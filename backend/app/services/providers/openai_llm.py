"""
OpenAI GPT-4o-mini LLM providers:
- OpenAILLMProvider: Meeting analysis (summary, decisions, action items)
- OpenAIChatProvider: Workspace AI chat with multi-recording context
- OpenAIMOMProvider: Generate Minutes of Meeting documents
"""

import json
from openai import AsyncOpenAI
from app.services.providers.base import AnalysisError
from app.schemas.analysis import MeetingAnalysis
from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

MAX_TRANSCRIPT_CHARS = 30_000

ANALYSIS_SYSTEM_PROMPT = """\
You are a professional meeting analyst. Extract structured information from meeting transcripts.

Rules:
- Only use information explicitly present in the transcript.
- Do NOT invent people, decisions, or deadlines.
- A decision is something clearly agreed upon, not a suggestion or hypothetical.
- An action item is a concrete task. Use "Unassigned" if assignee is unclear.
- For deadline: use exact phrasing from transcript (e.g. "by Friday"). Use null if not mentioned.
- Return ONLY valid JSON, no markdown fences.

Output format (strict):
{
  "summary": "string",
  "key_points": ["string", ...],
  "decisions": ["string", ...],
  "action_items": [{"task": "string", "assignee": "string", "deadline": "string|null"}]
}
"""

CHAT_SYSTEM_PROMPT = """\
You are Meeting AI, an intelligent assistant that helps users understand their meeting recordings.

You have access to the transcripts of one or more meetings uploaded by the user.
Answer questions based on the meeting content. Be concise and helpful.
When referencing specific content, mention which meeting and the approximate timestamp if known.
If information is not in the transcripts, say so clearly.
"""

MOM_SYSTEM_PROMPT = """\
You are a professional meeting secretary. Generate a formal Minutes of Meeting (MOM) document.

Use only information from the provided meeting data.
Do not invent attendees, decisions, or action items not mentioned.
Format the output as clean Markdown.

The MOM must have these sections:
1. MINUTES OF MEETING (title)
2. Meeting Details (title, date, duration if known)
3. Attendees (if speaker names are identifiable, otherwise omit)
4. Summary
5. Key Discussion Points
6. Decisions Made
7. Action Items (as a Markdown table: | Task | Owner | Deadline |)
8. Next Steps (if any)

Output ONLY the formatted Markdown document.
"""


def _lazy_client(settings) -> AsyncOpenAI:
    if not settings.openai_api_key:
        raise AnalysisError("OPENAI_API_KEY not set.")
    return AsyncOpenAI(api_key=settings.openai_api_key)


class OpenAILLMProvider:
    """GPT-4o-mini for structured meeting analysis."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.openai_model
        return self._client

    async def analyze(self, transcript: str) -> dict:
        truncated = transcript[:MAX_TRANSCRIPT_CHARS]
        client = self._get_client()
        logger.info(f"Analyzing transcript ({len(truncated)} chars) with {self._model}")

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Meeting transcript:\n\n{truncated}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            analysis = MeetingAnalysis.model_validate(data)
            logger.info(f"Analysis done: {len(analysis.decisions)} decisions, {len(analysis.action_items)} actions")
            return analysis.model_dump()
        except AnalysisError:
            raise
        except (json.JSONDecodeError, ValueError) as e:
            raise AnalysisError(f"Invalid AI response: {e}") from e
        except Exception as e:
            raise AnalysisError(f"LLM request failed: {e}") from e


class OpenAIChatProvider:
    """GPT-4o-mini for workspace AI chat with meeting context."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.openai_model
        return self._client

    async def chat(
        self,
        user_message: str,
        history: list[dict],
        recording_contexts: list[dict],
    ) -> str:
        """
        Args:
            user_message: Current user message.
            history: Past [{role, content}] messages.
            recording_contexts: [{filename, transcript, summary}] for all workspace recordings.
        Returns: AI assistant reply as string.
        """
        client = self._get_client()

        # Build context block
        context_parts = []
        for r in recording_contexts:
            context_parts.append(
                f"=== Recording: {r['filename']} ===\n"
                f"Summary: {r.get('summary', 'Not yet analyzed')}\n\n"
                f"Transcript:\n{r.get('transcript', 'No transcript available.')[:8000]}"
            )
        context_text = "\n\n".join(context_parts) if context_parts else "No recordings in this workspace yet."

        system_msg = CHAT_SYSTEM_PROMPT + f"\n\nMEETING DATA:\n{context_text}"

        messages = [{"role": "system", "content": system_msg}]
        messages.extend(history[-20:])  # Last 20 messages for context window
        messages.append({"role": "user", "content": user_message})

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise AnalysisError(f"Chat request failed: {e}") from e


class OpenAIMOMProvider:
    """GPT-4o-mini for generating Minutes of Meeting documents."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.openai_model
        return self._client

    async def generate_mom(self, meeting_data: str) -> str:
        """
        Args:
            meeting_data: String containing meeting title, transcript, summary, decisions, action items.
        Returns: Formatted Markdown MOM document.
        """
        client = self._get_client()
        logger.info("Generating MOM document")

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": MOM_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Meeting data:\n\n{meeting_data}"},
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise AnalysisError(f"MOM generation failed: {e}") from e
