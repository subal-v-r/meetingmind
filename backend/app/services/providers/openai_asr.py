"""
OpenAI Whisper ASR provider.
Uses verbose_json response format to get timestamped transcript segments.
"""

import os
from openai import AsyncOpenAI
from app.services.providers.base import TranscriptionError
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

WHISPER_MAX_BYTES = 25 * 1024 * 1024


class OpenAIASRProvider:
    """
    Whisper with verbose_json → returns full text AND timestamped segments.
    Lazy-initialized so the app can start without OPENAI_API_KEY being set.
    """

    def __init__(self):
        self._client: AsyncOpenAI | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            settings = get_settings()
            if not settings.openai_api_key:
                raise TranscriptionError("OPENAI_API_KEY not set.")
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            self._model = settings.openai_whisper_model
        return self._client

    async def transcribe(self, audio_file_path: str, filename: str) -> dict:
        """
        Returns:
            {
                "text": "full transcript...",
                "segments": [{"start": 0.0, "end": 4.2, "text": "...", "speaker": "Speaker"}]
            }
        """
        file_size = os.path.getsize(audio_file_path)
        if file_size > WHISPER_MAX_BYTES:
            raise TranscriptionError(
                f"File {file_size/1024/1024:.1f} MB exceeds the 25 MB Whisper limit."
            )

        client = self._get_client()
        logger.info(f"Sending '{filename}' ({file_size/1024:.0f} KB) to Whisper")

        try:
            with open(audio_file_path, "rb") as f:
                response = await client.audio.transcriptions.create(
                    model=self._model,
                    file=(filename, f),
                    response_format="verbose_json",  # Returns segments with timestamps
                    timestamp_granularities=["segment"],
                )

            # Build segments list, normalizing speaker label
            segments = []
            if hasattr(response, "segments") and response.segments:
                for i, seg in enumerate(response.segments):
                    speaker_idx = (i % 3) + 1  # Cycle through Speaker 1/2/3
                    segments.append({
                        "start": round(float(seg.start), 2),
                        "end": round(float(seg.end), 2),
                        "text": seg.text.strip(),
                        "speaker": f"Speaker {speaker_idx}",
                    })
            else:
                # Fallback: treat entire transcript as one segment
                text = response.text if hasattr(response, "text") else str(response)
                segments = [{"start": 0.0, "end": 0.0, "text": text, "speaker": "Speaker 1"}]

            full_text = response.text if hasattr(response, "text") else " ".join(s["text"] for s in segments)
            logger.info(f"Transcription done: {len(segments)} segments, {len(full_text)} chars")
            return {"text": full_text, "segments": segments}

        except TranscriptionError:
            raise
        except Exception as e:
            logger.error(f"Whisper API error: {e}")
            raise TranscriptionError(f"Transcription failed: {e}") from e
