"""
Workspace model — top-level container for meetings and AI conversation.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.database.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: str = Column(String(255), nullable=False, default="New Meeting Chat")
    created_at: datetime = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)
