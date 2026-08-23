"""
Workspace CRUD routes.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.workspace import Workspace
from app.models.recording import Recording
from app.schemas.api import WorkspaceCreate, WorkspacePatch, WorkspaceItem, DeleteResponse
from app.core.logging import get_logger

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])
logger = get_logger(__name__)


def _workspace_item(ws: Workspace, db: Session) -> WorkspaceItem:
    count = db.query(Recording).filter(Recording.workspace_id == ws.id).count()
    return WorkspaceItem(
        id=ws.id,
        title=ws.title,
        recording_count=count,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
    )


@router.post("", response_model=WorkspaceItem, status_code=status.HTTP_201_CREATED)
async def create_workspace(body: WorkspaceCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    ws = Workspace(
        id=str(uuid.uuid4()),
        title=body.title,
        created_at=now,
        updated_at=now,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    logger.info(f"Workspace created: {ws.id} '{ws.title}'")
    return _workspace_item(ws, db)


@router.get("", response_model=list[WorkspaceItem])
async def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).order_by(Workspace.updated_at.desc()).all()
    return [_workspace_item(ws, db) for ws in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceItem)
async def get_workspace(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")
    return _workspace_item(ws, db)


@router.patch("/{workspace_id}", response_model=WorkspaceItem)
async def rename_workspace(workspace_id: str, body: WorkspacePatch, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")
    ws.title = body.title
    ws.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ws)
    return _workspace_item(ws, db)


@router.delete("/{workspace_id}", response_model=DeleteResponse)
async def delete_workspace(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")

    # Delete all recordings (cascade) and chat messages
    from app.models.chat_message import ChatMessage
    import os
    recordings = db.query(Recording).filter(Recording.workspace_id == workspace_id).all()
    for r in recordings:
        if r.file_path and os.path.exists(r.file_path):
            try:
                os.remove(r.file_path)
            except OSError:
                pass
        db.delete(r)
    db.query(ChatMessage).filter(ChatMessage.workspace_id == workspace_id).delete()
    db.delete(ws)
    db.commit()
    logger.info(f"Workspace deleted: {workspace_id}")
    return DeleteResponse(message="Workspace deleted.", id=workspace_id)
