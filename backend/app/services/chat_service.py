"""
ChatService — workspace AI chat with multi-recording context.
Persists conversation history to DB.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.models.recording import Recording
from app.services.providers.openai_llm import OpenAIChatProvider
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChatService:
    def __init__(self):
        self._provider = OpenAIChatProvider()

    async def send_message(
        self, workspace_id: str, user_message: str, db: Session
    ) -> ChatMessage:
        """
        1. Load all ready recordings in workspace as context.
        2. Load recent chat history.
        3. Call GPT-4o-mini.
        4. Persist both user message and AI reply.
        """
        # Build recording context
        recordings = (
            db.query(Recording)
            .filter(
                Recording.workspace_id == workspace_id,
                Recording.status == "ready",
            )
            .all()
        )
        recording_contexts = [
            {
                "filename": r.filename,
                "transcript": r.transcript or "",
                "summary": r.summary or "",
            }
            for r in recordings
        ]

        # Load history
        history_msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.workspace_id == workspace_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in history_msgs]

        # Persist user message
        user_msg = ChatMessage(
            workspace_id=workspace_id,
            role="user",
            content=user_message,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user_msg)
        db.commit()

        # Call AI
        logger.info(f"Chat for workspace {workspace_id}: {len(recordings)} recordings, {len(history)} history")
        ai_reply = await self._provider.chat(user_message, history, recording_contexts)

        # Persist AI reply
        ai_msg = ChatMessage(
            workspace_id=workspace_id,
            role="assistant",
            content=ai_reply,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)

        return ai_msg

    def get_messages(self, workspace_id: str, db: Session) -> list[ChatMessage]:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.workspace_id == workspace_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
