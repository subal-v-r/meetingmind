"""
Recording routes — upload, list, get, transcript, delete, reprocess.
"""

import os
import uuid
import aiofiles
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.recording import Recording
from app.models.workspace import Workspace
from app.services.recording_service import RecordingService, detect_file_type
from app.schemas.api import (
    UploadResponse, RecordingStatus, RecordingDetail,
    TranscriptResponse, DeleteResponse, ActionItemResponse,
)
from app.schemas.analysis import TranscriptSegment
from app.config import get_settings
from app.core.logging import get_logger

router = APIRouter(tags=["Recordings"])
logger = get_logger(__name__)
settings = get_settings()
_service = RecordingService()


def _to_detail(r: Recording) -> RecordingDetail:
    action_items = None
    if r.action_items:
        action_items = [
            ActionItemResponse(
                task=item.get("task", ""),
                assignee=item.get("assignee", "Unassigned"),
                deadline=item.get("deadline"),
                status="Pending",
            )
            for item in r.action_items
        ]
    return RecordingDetail(
        id=r.id,
        workspace_id=r.workspace_id,
        filename=r.filename,
        file_type=r.file_type,
        file_path=r.file_path,
        status=r.status,
        error_message=r.error_message,
        duration_seconds=r.duration_seconds,
        created_at=r.created_at,
        updated_at=r.updated_at,
        transcript=r.transcript,
        segments=r.segments,
        summary=r.summary,
        key_points=r.key_points,
        decisions=r.decisions,
        action_items=action_items,
    )


# ─── Upload ───────────────────────────────────────────────────────────────────

@router.post(
    "/api/workspaces/{workspace_id}/recordings/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_recording(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")

    filename = file.filename or "recording"
    content_type = file.content_type or ""
    recording_id = str(uuid.uuid4())

    # Save file
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower()
    file_path = os.path.join(upload_dir, f"{recording_id}{ext}")

    try:
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        file_size = len(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # Validate
    try:
        _service.validate_file(filename, file_size, content_type)
    except ValueError as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=422, detail=str(e))

    # Create DB record
    now = datetime.now(timezone.utc)
    recording = Recording(
        id=recording_id,
        workspace_id=workspace_id,
        filename=filename,
        file_path=file_path,
        file_type=detect_file_type(filename),
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(recording)

    # Update workspace timestamp
    ws.updated_at = now
    db.commit()
    db.refresh(recording)
    logger.info(f"Recording {recording_id} created in workspace {workspace_id}")

    background_tasks.add_task(_service.process_recording, recording_id, db)

    return UploadResponse(recording_id=recording_id, workspace_id=workspace_id)


# ─── List recordings in workspace ────────────────────────────────────────────

@router.get("/api/workspaces/{workspace_id}/recordings", response_model=list[RecordingStatus])
async def list_recordings(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")
    recordings = (
        db.query(Recording)
        .filter(Recording.workspace_id == workspace_id)
        .order_by(Recording.created_at.desc())
        .all()
    )
    return [RecordingStatus.model_validate(r) for r in recordings]


# ─── Get single recording ─────────────────────────────────────────────────────

@router.get("/api/recordings/{recording_id}", response_model=RecordingDetail)
async def get_recording(recording_id: str, db: Session = Depends(get_db)):
    r = db.query(Recording).filter(Recording.id == recording_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Recording '{recording_id}' not found.")
    return _to_detail(r)


# ─── Transcript with segments ─────────────────────────────────────────────────

@router.get("/api/recordings/{recording_id}/transcript", response_model=TranscriptResponse)
async def get_transcript(recording_id: str, db: Session = Depends(get_db)):
    r = db.query(Recording).filter(Recording.id == recording_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Recording '{recording_id}' not found.")

    segments = None
    if r.segments:
        segments = [TranscriptSegment(**seg) for seg in r.segments]

    return TranscriptResponse(
        recording_id=r.id,
        filename=r.filename,
        full_text=r.transcript,
        segments=segments,
        status=r.status,
    )


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/api/recordings/{recording_id}", response_model=DeleteResponse)
async def delete_recording(recording_id: str, db: Session = Depends(get_db)):
    r = db.query(Recording).filter(Recording.id == recording_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Recording '{recording_id}' not found.")
    if r.file_path and os.path.exists(r.file_path):
        try:
            os.remove(r.file_path)
        except OSError:
            pass
    db.delete(r)
    db.commit()
    return DeleteResponse(message="Recording deleted.", id=recording_id)


# ─── Reprocess ────────────────────────────────────────────────────────────────

@router.post("/api/recordings/{recording_id}/reprocess", response_model=UploadResponse)
async def reprocess_recording(
    recording_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    r = db.query(Recording).filter(Recording.id == recording_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Recording '{recording_id}' not found.")
    if r.status not in ("failed", "pending"):
        raise HTTPException(status_code=400, detail=f"Cannot reprocess status '{r.status}'.")
    if not r.file_path or not os.path.exists(r.file_path):
        raise HTTPException(status_code=409, detail="Original file no longer available. Please re-upload.")

    r.status = "pending"
    r.error_message = None
    r.updated_at = datetime.now(timezone.utc)
    db.commit()
    background_tasks.add_task(_service.process_recording, recording_id, db)
    return UploadResponse(recording_id=recording_id, workspace_id=r.workspace_id, message="Reprocessing started.")


# ─── Update Action Items ──────────────────────────────────────────────────────

from pydantic import BaseModel
from typing import Optional

class ActionItemUpdate(BaseModel):
    task: str
    assignee: str = "Unassigned"
    deadline: Optional[str] = None
    status: str = "Pending"

class ActionItemsUpdateRequest(BaseModel):
    action_items: list[ActionItemUpdate]


@router.patch("/api/recordings/{recording_id}/action-items", response_model=RecordingDetail)
async def update_action_items(
    recording_id: str,
    body: ActionItemsUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update action items (task, assignee, status) for a recording."""
    r = db.query(Recording).filter(Recording.id == recording_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Recording '{recording_id}' not found.")
    if r.status != "ready":
        raise HTTPException(status_code=400, detail="Recording must be in 'ready' state to update action items.")

    # Validate & normalize
    items = []
    for ai in body.action_items:
        if not ai.task.strip():
            raise HTTPException(status_code=422, detail="Action item task cannot be empty.")
        valid_statuses = {"Pending", "In Progress", "Completed"}
        final_status = ai.status if ai.status in valid_statuses else "Pending"
        items.append({
            "task": ai.task.strip(),
            "assignee": ai.assignee.strip() or "Unassigned",
            "deadline": ai.deadline,
            "status": final_status,
        })

    r.action_items = items
    r.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(r)
    logger.info(f"Action items updated for recording {recording_id}")
    return _to_detail(r)

