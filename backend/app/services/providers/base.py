"""
Provider protocols and exceptions.
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class ASRProvider(Protocol):
    async def transcribe(self, audio_file_path: str, filename: str) -> dict:
        """Returns {text: str, segments: [{start, end, text, speaker}]}"""
        ...


@runtime_checkable
class LLMProvider(Protocol):
    async def analyze(self, transcript: str) -> dict:
        """Returns {summary, key_points, decisions, action_items}"""
        ...


class TranscriptionError(Exception):
    pass


class AnalysisError(Exception):
    pass
