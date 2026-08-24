"""
Application configuration loaded from environment variables.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Groq
    groq_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./meetingmind.db"

    # File upload
    max_file_size_mb: int = 100  # App accepts up to 100 MB; files >25 MB are chunked for Groq
    allowed_mime_types: str = (
        "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/x-wav,audio/flac,"
        "video/mp4,audio/ogg,audio/webm,video/webm,video/quicktime,audio/mp3,"
        "audio/mpga,application/octet-stream"
    )

    # Groq Models
    groq_llm_model: str = "openai/gpt-oss-20b"       # Chat completions model
    groq_whisper_model: str = "whisper-large-v3-turbo"  # Audio transcription model

    # App
    debug: bool = False
    upload_dir: str = "uploads"
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [m.strip() for m in self.allowed_mime_types.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    return Settings()
