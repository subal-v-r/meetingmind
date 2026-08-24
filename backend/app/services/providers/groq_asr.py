"""
Groq Whisper ASR provider.
Uses whisper-large-v3-turbo for fast, accurate transcription with timestamps.
Supported formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
"""

import os
from groq import AsyncGroq
from app.services.providers.base import TranscriptionError
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

GROQ_WHISPER_MAX_BYTES = 25 * 1024 * 1024  # 25 MB per Groq docs

# Formats Groq Whisper directly supports
GROQ_SUPPORTED_EXTENSIONS = {
    ".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".ogg", ".wav", ".webm"
}


def _friendly_error(exc: Exception) -> str:
    """Convert raw Groq errors to user-friendly messages."""
    msg = str(exc).lower()
    if "invalid_api_key" in msg or "authentication" in msg or "auth" in msg:
        return "Invalid API key. Please check your GROQ_API_KEY."
    if "rate_limit" in msg or "rate limit" in msg or "429" in msg:
        return "Rate limit reached. Please wait a moment and try again."
    if "quota" in msg or "insufficient" in msg:
        return "API quota exceeded. Please check your Groq account."
    if "file too large" in msg or "too large" in msg:
        return "File too large. Maximum file size is 25 MB."
    if "unsupported" in msg or "format" in msg:
        return "Unsupported audio format. Please use MP3, WAV, M4A, FLAC, OGG, MP4, or WebM."
    if "connection" in msg or "network" in msg:
        return "Network error. Please check your internet connection."
    return "Transcription failed. Please try again."


class GroqASRProvider:
    """
    Groq Whisper provider with verbose_json → returns full text AND timestamped segments.
    Lazy-initialized so the app can start without GROQ_API_KEY being set.
    """

    def __init__(self):
        self._client: AsyncGroq | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            settings = get_settings()
            if not settings.groq_api_key:
                raise TranscriptionError("GROQ_API_KEY not set. Please add it to your backend/.env file.")
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            self._model = settings.groq_whisper_model
        return self._client

    async def transcribe(self, audio_file_path: str, filename: str) -> dict:
        """
        Returns:
            {
                "text": "full transcript...",
                "segments": [{"start": 0.0, "end": 4.2, "text": "...", "speaker": "Speaker 1"}]
            }
        """
        file_size = os.path.getsize(audio_file_path)
        if file_size > GROQ_WHISPER_MAX_BYTES:
            raise TranscriptionError(
                f"File too large ({file_size/1024/1024:.1f} MB). Maximum allowed size is 25 MB."
            )

        # Check extension is supported
        ext = os.path.splitext(filename)[1].lower()
        if ext not in GROQ_SUPPORTED_EXTENSIONS:
            raise TranscriptionError(
                f"Unsupported format '{ext}'. Groq supports: {', '.join(sorted(GROQ_SUPPORTED_EXTENSIONS))}"
            )

        client = self._get_client()
        logger.info(f"Sending '{filename}' ({file_size/1024:.0f} KB) to Groq Whisper ({self._model})")

        try:
            with open(audio_file_path, "rb") as f:
                response = await client.audio.transcriptions.create(
                    model=self._model,
                    file=(filename, f),
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                )

            logger.debug(f"Raw Groq response type: {type(response)}")

            # Extract full text safely
            if hasattr(response, "text"):
                full_text = response.text
            elif isinstance(response, dict):
                full_text = response.get("text", "")
            else:
                full_text = str(response)

            # Extract segments safely — Groq SDK may return dicts OR objects
            raw_segments = None
            if hasattr(response, "segments"):
                raw_segments = response.segments
            elif isinstance(response, dict):
                raw_segments = response.get("segments", None)

            segments = []
            if raw_segments:
                for i, seg in enumerate(raw_segments):
                    speaker_idx = (i % 3) + 1  # Cycle Speaker 1/2/3

                    # Support both dict-style and attribute-style access
                    if isinstance(seg, dict):
                        start = seg.get("start", 0.0)
                        end   = seg.get("end", 0.0)
                        text  = seg.get("text", "").strip()
                    else:
                        start = getattr(seg, "start", 0.0)
                        end   = getattr(seg, "end", 0.0)
                        text  = getattr(seg, "text", "").strip()

                    if text:  # Skip empty segments
                        segments.append({
                            "start": round(float(start), 2),
                            "end":   round(float(end), 2),
                            "text":  text,
                            "speaker": f"Speaker {speaker_idx}",
                        })

            # Fallback: treat entire transcript as one segment
            if not segments:
                logger.warning("No segments returned from Groq — using full text as one segment")
                segments = [{"start": 0.0, "end": 0.0, "text": full_text, "speaker": "Speaker 1"}]

            if not full_text:
                full_text = " ".join(s["text"] for s in segments)

            logger.info(f"Transcription done: {len(segments)} segments, {len(full_text)} chars")
            return {"text": full_text, "segments": segments}

        except TranscriptionError:
            raise
        except Exception as e:
            logger.error(f"Groq Whisper API error: {e}")
            raise TranscriptionError(_friendly_error(e)) from e
