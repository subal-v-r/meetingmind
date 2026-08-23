"""Pydantic schemas for structured LLM output."""

from pydantic import BaseModel, Field
from typing import Optional


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: str = "Speaker"


class ActionItem(BaseModel):
    task: str
    assignee: str = "Unassigned"
    deadline: Optional[str] = None


class MeetingAnalysis(BaseModel):
    summary: str
    key_points: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)
