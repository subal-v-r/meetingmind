"""API request/response schemas for workspaces, recordings, and chat."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.analysis import ActionItem, TranscriptSegment


# ─── Action Item with status ──────────────────────────────────────────────────

class ActionItemResponse(ActionItem):
    status: str = Field(default="Pending")


# ─── Workspace ────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    title: str = "New Meeting Chat"


class WorkspacePatch(BaseModel):
    title: str


class WorkspaceItem(BaseModel):
    id: str
    title: str
    recording_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceDetail(WorkspaceItem):
    pass


# ─── Recording ────────────────────────────────────────────────────────────────

class RecordingStatus(BaseModel):
    id: str
    workspace_id: str
    filename: str
    file_type: Optional[str]
    file_path: Optional[str] = None
    status: str
    error_message: Optional[str]
    duration_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordingDetail(RecordingStatus):
    transcript: Optional[str] = None
    segments: Optional[list[TranscriptSegment]] = None
    summary: Optional[str] = None
    key_points: Optional[list[str]] = None
    decisions: Optional[list[str]] = None
    action_items: Optional[list[ActionItemResponse]] = None


class TranscriptResponse(BaseModel):
    recording_id: str
    filename: str
    full_text: Optional[str]
    segments: Optional[list[TranscriptSegment]]
    status: str


class UploadResponse(BaseModel):
    recording_id: str
    workspace_id: str
    message: str = "Recording uploaded. Processing started in background."
    status: str = "pending"


class DeleteResponse(BaseModel):
    message: str
    id: str


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    id: str
    workspace_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── MOM ──────────────────────────────────────────────────────────────────────

class MomResponse(BaseModel):
    recording_id: Optional[str] = None
    workspace_id: Optional[str] = None
    title: str
    content: str   # Formatted Markdown document


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    db: str
