"""
Groq LLM providers using openai/gpt-oss-20b:
- GroqLLMProvider: Meeting analysis (summary, decisions, action items)
- GroqChatProvider: Workspace AI chat with multi-recording context
- GroqMOMProvider: Generate Minutes of Meeting documents
"""

import json
from groq import AsyncGroq
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
- Make the 'summary' moderately detailed (2 to 4 well-written paragraphs using \n\n for spacing). It should explain the main purpose of the meeting, important topics, key outcomes, and next steps. Do not make it a single short sentence.
- Return ONLY valid JSON, no markdown fences.

Output format (strict):
{
  "summary": "string",
  "key_points": ["string", ...],
  "decisions": ["string", ...],
  "action_items": [{"task": "string", "assignee": "string", "deadline": "string|null"}]
}
Respond with ONLY the JSON object. No explanations. No markdown formatting.
"""

CHAT_SYSTEM_PROMPT = """\
You are MeetingMind AI, an intelligent assistant that helps users understand their meeting recordings.

You have access to the transcripts of one or more meetings uploaded by the user.
Answer questions based on the meeting content. Be helpful and clear.

CRITICAL FORMATTING RULES:
- Respond ONLY in clean, natural conversational text formatted as simple paragraphs.
- DO NOT generate Markdown tables, ASCII separators, or raw formatting tags like `**`, `|`, `---`, or `<br>`.
- If multiple recordings are compared, explain the comparison naturally in standard sentences or simple bullet points (without bolding text).
- Make the answer feel like a helpful human assistant explaining the result, not like a generated report.
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


def _friendly_llm_error(exc: Exception) -> str:
    """Convert raw Groq errors to user-friendly messages."""
    msg = str(exc).lower()
    if "invalid_api_key" in msg or "authentication" in msg:
        return "Invalid API key. Please check your GROQ_API_KEY."
    if "rate_limit" in msg or "429" in msg:
        return "Rate limit reached. Please wait a moment and retry."
    if "quota" in msg or "insufficient" in msg:
        return "API quota exceeded. Please check your Groq account."
    if "model_not_found" in msg or "404" in msg or "not found" in msg:
        return (
            "AI model not available. The configured GROQ_LLM_MODEL is not accessible "
            "on your account. Check MANUAL_CHANGES.txt for the correct model name."
        )
    if "connection" in msg or "network" in msg:
        return "Network error connecting to AI service."
    return f"AI analysis failed: {str(exc)[:120]}"


def _lazy_client(settings) -> AsyncGroq:
    if not settings.groq_api_key:
        raise AnalysisError("GROQ_API_KEY not set. Please add it to your backend/.env file.")
    return AsyncGroq(api_key=settings.groq_api_key)


class GroqLLMProvider:
    """Groq LLM for structured meeting analysis."""

    def __init__(self):
        self._client: AsyncGroq | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.groq_llm_model
        return self._client

    async def analyze(self, transcript: str) -> dict:
        truncated = transcript[:MAX_TRANSCRIPT_CHARS]
        client = self._get_client()
        logger.info(f"Analyzing transcript ({len(truncated)} chars) with Groq [{self._model}]")

        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Meeting transcript:\n\n{truncated}"},
                ],
                temperature=0.1,
            )
            raw = response.choices[0].message.content.strip()
            
            # Robust JSON extraction: Strip markdown fences if the LLM adds them
            import re
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                raw_json = json_match.group(0)
            else:
                raw_json = raw

            data = json.loads(raw_json)
            analysis = MeetingAnalysis.model_validate(data)
            logger.info(f"Analysis done: {len(analysis.decisions)} decisions, {len(analysis.action_items)} actions")
            return analysis.model_dump()
        except AnalysisError:
            raise
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse LLM analysis JSON: {e}\nRaw output: {raw[:200]}")
            raise AnalysisError(f"Invalid AI response format: {e}") from e
        except Exception as e:
            logger.error(f"Groq LLM error: {e}")
            raise AnalysisError(_friendly_llm_error(e)) from e


class GroqChatProvider:
    """Groq LLM for workspace AI chat with meeting context."""

    def __init__(self):
        self._client: AsyncGroq | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.groq_llm_model
        return self._client

    async def chat(
        self,
        user_message: str,
        history: list[dict],
        recording_contexts: list[dict],
    ) -> str:
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
            raise AnalysisError(_friendly_llm_error(e)) from e


class GroqMOMProvider:
    """Groq LLM for generating Minutes of Meeting documents."""

    def __init__(self):
        self._client: AsyncGroq | None = None
        self._model: str | None = None

    def _get_client(self) -> AsyncGroq:
        if self._client is None:
            settings = get_settings()
            self._client = _lazy_client(settings)
            self._model = settings.groq_llm_model
        return self._client

    async def generate_mom(self, meeting_data: str) -> str:
        client = self._get_client()
        logger.info("Generating MOM document with Groq")

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
            raise AnalysisError(_friendly_llm_error(e)) from e
