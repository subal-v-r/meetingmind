"""
MOMService — generates a formal Minutes of Meeting document.
"""

from sqlalchemy.orm import Session
from app.models.recording import Recording
from app.models.workspace import Workspace
from app.services.providers.openai_llm import OpenAIMOMProvider
from app.core.logging import get_logger
import json

logger = get_logger(__name__)


class MOMService:
    def __init__(self):
        self._provider = OpenAIMOMProvider()

    def _build_recording_data(self, r: Recording, title: str) -> str:
        """Format recording data into a structured string for MOM generation."""
        action_items_str = ""
        if r.action_items:
            rows = "\n".join(
                f"- {item.get('task', '')} | {item.get('assignee', 'Unassigned')} | {item.get('deadline', 'No deadline')}"
                for item in r.action_items
            )
            action_items_str = f"\nAction Items:\n{rows}"

        decisions_str = ""
        if r.decisions:
            decisions_str = "\nDecisions Made:\n" + "\n".join(f"- {d}" for d in r.decisions)

        transcript_preview = (r.transcript or "")[:5000]

        return f"""Meeting Title: {title}
Recording: {r.filename}
Duration: {f"{r.duration_seconds:.0f} seconds" if r.duration_seconds else "Unknown"}

Summary:
{r.summary or "Not analyzed yet."}

Key Points:
{chr(10).join(f"- {p}" for p in (r.key_points or []))}
{decisions_str}
{action_items_str}

Transcript (excerpt):
{transcript_preview}"""

    async def generate_for_recording(self, recording_id: str, db: Session) -> dict:
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        if not recording:
            raise ValueError(f"Recording '{recording_id}' not found.")
        if recording.status != "ready":
            raise ValueError(f"Recording is not ready yet (status: {recording.status}).")

        workspace = db.query(Workspace).filter(Workspace.id == recording.workspace_id).first()
        title = workspace.title if workspace else recording.filename

        meeting_data = self._build_recording_data(recording, title)
        logger.info(f"Generating MOM for recording {recording_id}")
        content = await self._provider.generate_mom(meeting_data)

        return {
            "recording_id": recording_id,
            "workspace_id": recording.workspace_id,
            "title": title,
            "content": content,
        }

    async def generate_for_workspace(self, workspace_id: str, db: Session) -> dict:
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            raise ValueError(f"Workspace '{workspace_id}' not found.")

        recordings = (
            db.query(Recording)
            .filter(Recording.workspace_id == workspace_id, Recording.status == "ready")
            .all()
        )
        if not recordings:
            raise ValueError("No completed recordings in this workspace.")

        parts = [self._build_recording_data(r, workspace.title) for r in recordings]
        combined = "\n\n" + "=" * 60 + "\n\n".join(parts)

        logger.info(f"Generating workspace MOM for {workspace_id} ({len(recordings)} recordings)")
        content = await self._provider.generate_mom(
            f"Workspace: {workspace.title}\nNumber of recordings: {len(recordings)}\n\n{combined}"
        )

        return {
            "recording_id": None,
            "workspace_id": workspace_id,
            "title": workspace.title,
            "content": content,
        }
