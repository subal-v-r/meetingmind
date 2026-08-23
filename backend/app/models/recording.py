"""
Recording model — an audio/video file belonging to a workspace.
Stores timestamped transcript segments for caption synchronization.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.sqlite import JSON
from app.database.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Recording(Base):
    __tablename__ = "recordings"

    # Identity
    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: str = Column(String(255), nullable=False)
    file_path: str = Column(String(512), nullable=True)   # Cleared after successful processing
    file_type: str = Column(String(20), nullable=True)    # "audio" | "video"

    # Processing state
    status: str = Column(String(20), nullable=False, default="pending")
    # Status values: pending | transcribing | analyzing | ready | failed
    error_message: str = Column(Text, nullable=True)

    # Audio metadata
    duration_seconds: float = Column(Float, nullable=True)

    # Results
    transcript: str = Column(Text, nullable=True)          # Full text
    segments: list = Column(JSON, nullable=True)           # [{start, end, text, speaker}]
    summary: str = Column(Text, nullable=True)
    key_points: list = Column(JSON, nullable=True)
    decisions: list = Column(JSON, nullable=True)
    action_items: list = Column(JSON, nullable=True)

    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)
