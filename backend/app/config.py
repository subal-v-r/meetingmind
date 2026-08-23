"""
Application configuration loaded from environment variables.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./meeting_ai.db"

    # File upload
    max_file_size_mb: int = 25
    allowed_mime_types: str = (
        "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/x-wav,"
        "video/mp4,audio/ogg,audio/webm,video/webm,video/quicktime"
    )

    # LLM
    openai_model: str = "gpt-4o-mini"
    openai_whisper_model: str = "whisper-1"

    # App
    debug: bool = False
    upload_dir: str = "uploads"

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
