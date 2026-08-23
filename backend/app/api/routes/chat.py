"""Chat and MOM routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.workspace import Workspace
from app.services.chat_service import ChatService
from app.services.mom_service import MOMService
from app.schemas.api import ChatRequest, ChatResponse, MomResponse
from app.core.logging import get_logger

router = APIRouter(tags=["Chat & MOM"])
logger = get_logger(__name__)
_chat_service = ChatService()
_mom_service = MOMService()


# ─── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/api/workspaces/{workspace_id}/chat", response_model=ChatResponse)
async def post_chat(workspace_id: str, body: ChatRequest, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")
    try:
        msg = await _chat_service.send_message(workspace_id, body.message, db)
        return ChatResponse.model_validate(msg)
    except Exception as e:
        logger.error(f"Chat error for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/workspaces/{workspace_id}/messages", response_model=list[ChatResponse])
async def get_messages(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"Workspace '{workspace_id}' not found.")
    msgs = _chat_service.get_messages(workspace_id, db)
    return [ChatResponse.model_validate(m) for m in msgs]


# ─── MOM ──────────────────────────────────────────────────────────────────────

@router.post("/api/recordings/{recording_id}/generate-mom", response_model=MomResponse)
async def generate_recording_mom(recording_id: str, db: Session = Depends(get_db)):
    try:
        result = await _mom_service.generate_for_recording(recording_id, db)
        return MomResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"MOM error for recording {recording_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/workspaces/{workspace_id}/generate-mom", response_model=MomResponse)
async def generate_workspace_mom(workspace_id: str, db: Session = Depends(get_db)):
    try:
        result = await _mom_service.generate_for_workspace(workspace_id, db)
        return MomResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"MOM error for workspace {workspace_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
