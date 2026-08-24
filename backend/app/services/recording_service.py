"""
Recording service — orchestrates the full background processing pipeline.
Upload → Transcribe (Groq Whisper) → Analyze (Groq LLM) → Ready
"""

import os
import mimetypes
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.recording import Recording
from app.services.providers.groq_asr import GroqASRProvider, GROQ_SUPPORTED_EXTENSIONS
from app.services.providers.groq_llm import GroqLLMProvider
from app.services.providers.base import TranscriptionError, AnalysisError
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# All backed formats: what Groq Whisper directly accepts + video passthrough
ALLOWED_EXTENSIONS = (
    GROQ_SUPPORTED_EXTENSIONS  # .flac, .mp3, .mp4, .mpeg, .mpga, .m4a, .ogg, .wav, .webm
    | {".mov", ".avi"}  # Common video — we'll note these may fail if file is too large
)
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}


def _utcnow():
    return datetime.now(timezone.utc)


def _update(db: Session, recording: Recording, **kwargs):
    for k, v in kwargs.items():
        setattr(recording, k, v)
    recording.updated_at = _utcnow()
    db.commit()
    db.refresh(recording)


def detect_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return "video" if ext in VIDEO_EXTENSIONS else "audio"


def get_audio_duration(file_path: str) -> float | None:
    try:
        from mutagen import File as MutagenFile
        audio = MutagenFile(file_path)
        if audio and hasattr(audio, "info") and hasattr(audio.info, "length"):
            return round(audio.info.length, 2)
    except Exception as e:
        logger.warning(f"Duration extraction failed: {e}")
    return None


class RecordingService:
    """
    Orchestrates: upload validation → ASR transcription → LLM analysis → DB store
    Runs inside a FastAPI BackgroundTask.
    Status flow: pending → transcribing → analyzing → ready | failed
    """

    def __init__(self):
        self._asr = GroqASRProvider()
        self._llm = GroqLLMProvider()
        self._settings = get_settings()

    def validate_file(self, filename: str, file_size: int, content_type: str | None) -> None:
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        if content_type and content_type not in ("application/octet-stream",):
            allowed = self._settings.allowed_mime_types_list
            guessed, _ = mimetypes.guess_type(filename)
            if content_type not in allowed and guessed not in allowed:
                raise ValueError(f"Unsupported content type '{content_type}'.")

        if file_size > self._settings.max_file_size_bytes:
            raise ValueError(
                f"File {file_size/1024/1024:.1f} MB exceeds {self._settings.max_file_size_mb} MB limit."
            )

    async def process_recording(self, recording_id: str, db: Session) -> None:
        """Full async pipeline. Called as background task."""
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        if not recording:
            logger.error(f"[{recording_id}] Not found in DB")
            return

        file_path = recording.file_path
        logger.info(f"[{recording_id}] Processing '{recording.filename}'")

        # ── Stage 1: Transcribing ────────────────────────────────────────────
        _update(db, recording, status="transcribing")

        try:
            if not file_path or not os.path.exists(file_path):
                raise TranscriptionError(f"Audio file not found: '{file_path}'")

            # Extract duration
            duration = get_audio_duration(file_path)
            if duration:
                _update(db, recording, duration_seconds=duration)

            # Transcribe → returns {text, segments}
            logger.info(f"[{recording_id}] Sending to Whisper...")
            result = await self._asr.transcribe(file_path, recording.filename)
            transcript = result["text"]
            segments = result["segments"]
            _update(db, recording, transcript=transcript, segments=segments)
            logger.info(f"[{recording_id}] Transcribed: {len(segments)} segments")

            # ── Stage 2: Analyzing ───────────────────────────────────────────
            _update(db, recording, status="analyzing")
            logger.info(f"[{recording_id}] Sending to GPT-4o-mini...")
            analysis = await self._llm.analyze(transcript)

            # ── Stage 3: Ready ───────────────────────────────────────────────
            _update(
                db, recording,
                status="ready",
                summary=analysis["summary"],
                key_points=analysis["key_points"],
                decisions=analysis["decisions"],
                action_items=analysis["action_items"]
            )

            logger.info(f"[{recording_id}] ✓ Processing complete")

        except (TranscriptionError, AnalysisError, ValueError) as exc:
            logger.error(f"[{recording_id}] Failed: {exc}")
            _update(db, recording, status="failed", error_message=str(exc))
        except Exception as exc:
            logger.exception(f"[{recording_id}] Unexpected error")
            _update(db, recording, status="failed", error_message=f"Unexpected error: {exc}")
