"""
ChatMessage model — AI conversation thread belonging to a workspace.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.database.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    role: str = Column(String(20), nullable=False)   # "user" | "assistant"
    content: str = Column(Text, nullable=False)
    created_at: datetime = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
