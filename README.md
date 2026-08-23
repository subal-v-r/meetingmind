# 🎙️ Meeting Summarizer

> Turn meeting recordings into structured insights — transcript, summary, key decisions, and action items — powered by OpenAI Whisper and GPT-4o-mini.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org)

---

## ✨ Features

- **Audio Upload** — Drag-and-drop or browse. Supports MP3, WAV, M4A, MP4, OGG, WebM (up to 25 MB)
- **AI Transcription** — OpenAI Whisper converts speech to text accurately
- **Smart Analysis** — GPT-4o-mini extracts structured insights in one pass
- **Meeting Summary** — Concise plain-English overview of the meeting
- **Key Points** — Most important discussion topics, numbered
- **Key Decisions** — Only confirmed decisions (no hallucinations)
- **Action Items** — Task + Assignee + Deadline, extracted with strict rules
- **Searchable Transcript** — Collapsible, with live search highlighting and copy
- **Download Summary** — Export the full summary as a Markdown file
- **Meeting History** — Browse, revisit, retry, and delete past meetings
- **Async Processing** — Upload returns instantly; frontend polls for progress
- **Error Resilience** — Failed meetings show reason; retry with one click

---

## 🏗️ Architecture

```
AI Pipeline: Audio → Whisper (ASR) → GPT-4o-mini (LLM) → SQLite → React Dashboard
```

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  UploadZone → ProcessingStatus → Results Dashboard       │
│  (Vite + TypeScript + Tailwind CSS)                     │
└────────────────────┬────────────────────────────────────┘
                     │  HTTP / REST (polling)
┌────────────────────▼────────────────────────────────────┐
│                 FastAPI Backend                          │
│                                                         │
│  POST /upload → BackgroundTask                          │
│          ↓                                              │
│  TranscriptionService (OpenAI Whisper)                  │
│          ↓                                              │
│  SummarizationService (GPT-4o-mini, JSON mode)          │
│          ↓                                              │
│  meeting_service.py (orchestration + file cleanup)      │
│          ↓                                              │
│  SQLite (SQLAlchemy + Alembic)                          │
└─────────────────────────────────────────────────────────┘
```

### Provider Abstraction
Both ASR and LLM providers implement protocol interfaces (`ASRProvider`, `LLMProvider`). 
To switch from OpenAI to another provider, implement the interface and inject it — no route code changes needed.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| Database | SQLite via SQLAlchemy (Alembic migrations) |
| ASR | OpenAI Whisper API (`whisper-1`) |
| LLM | OpenAI GPT-4o-mini (JSON mode + Pydantic validation) |
| Testing | pytest, pytest-asyncio, FastAPI TestClient |

---

## 📁 Project Structure

```
Meeting_summarizer/
│
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── meetings.py        # All meeting endpoints
│   │   │   └── health.py          # GET /health
│   │   ├── services/
│   │   │   ├── providers/
│   │   │   │   ├── base.py        # ASRProvider + LLMProvider protocols
│   │   │   │   ├── openai_asr.py  # Whisper implementation
│   │   │   │   └── openai_llm.py  # GPT-4o-mini + prompt engineering
│   │   │   ├── transcription_service.py
│   │   │   ├── summarization_service.py
│   │   │   └── meeting_service.py # Processing pipeline orchestration
│   │   ├── models/meeting.py      # SQLAlchemy ORM model
│   │   ├── schemas/
│   │   │   ├── meeting.py         # API request/response schemas
│   │   │   └── analysis.py        # LLM output schema (strict Pydantic)
│   │   ├── database/database.py
│   │   ├── core/logging.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_schemas.py
│   │   ├── test_api.py
│   │   └── test_meeting_service.py
│   ├── uploads/                   # Temp audio storage (gitignored)
│   │   └── .gitkeep
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # UploadPage, ResultsPage, HistoryPage
│   │   ├── services/api.ts        # All API calls centralized here
│   │   ├── hooks/useMeetingPolling.ts
│   │   ├── types/meeting.ts       # TypeScript interfaces
│   │   ├── App.tsx                # React Router setup
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- An **OpenAI API key** with access to `whisper-1` and `gpt-4o-mini`

---

### 1. Clone the repository

```bash
git clone <repo-url>
cd Meeting_summarizer
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# VITE_API_BASE_URL is already set to http://localhost:8000
```

---

## 🚀 Running the Application

### Start the backend (from `/backend`):

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Start the frontend (from `/frontend`):

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

> 💡 Keep both terminals open while using the app.

---

## 🌍 Environment Variables

### `backend/.env`

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | **Required.** Your OpenAI API key | — |
| `DATABASE_URL` | SQLite DB path | `sqlite:///./meeting_summarizer.db` |
| `MAX_FILE_SIZE_MB` | Max upload size in MB | `25` |
| `OPENAI_MODEL` | LLM model for analysis | `gpt-4o-mini` |
| `OPENAI_WHISPER_MODEL` | Whisper model for ASR | `whisper-1` |
| `DEBUG` | Enable debug logging | `false` |

### `frontend/.env`

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meetings/upload` | Upload audio; returns `meeting_id` immediately |
| `GET` | `/api/meetings` | List all meetings (ordered by newest) |
| `GET` | `/api/meetings/{id}` | Full result — poll until `status: completed\|failed` |
| `GET` | `/api/meetings/{id}/transcript` | Transcript only |
| `DELETE` | `/api/meetings/{id}` | Delete meeting and file |
| `POST` | `/api/meetings/{id}/reprocess` | Retry a failed meeting |
| `GET` | `/health` | Health check with DB connectivity |

---

## 🧪 Running Tests

```bash
cd backend
pytest -v
```

Test coverage includes:
- Pydantic schema validation (good + bad inputs)
- API endpoints (health, list, upload validation, 404s)
- Meeting service pipeline (mocked ASR + LLM, success + failure paths)

---

## 🤖 AI Pipeline Details

### Speech-to-Text (Whisper)
- Provider: OpenAI Whisper API (`whisper-1`)
- File size validated against 25 MB API limit
- Audio duration extracted via `mutagen`

### Meeting Analysis (GPT-4o-mini)
- Uses JSON mode for guaranteed structured output
- Temperature set to 0.1 for reliable, factual extraction
- Strict system prompt instructs the model to:
  - Only use information from the transcript
  - Not invent people, decisions, or deadlines
  - Use "Unassigned" when assignee is unclear
  - Use `null` when no deadline is mentioned
- Response validated with Pydantic before storage
- Falls back to a clear error if response is invalid

### Extracted Output Schema

```json
{
  "summary": "Brief overview of the meeting",
  "key_points": ["Discussion point 1", "..."],
  "decisions": ["Confirmed decision 1", "..."],
  "action_items": [
    {
      "task": "Prepare UI designs",
      "assignee": "Sarah",
      "deadline": "Friday"
    }
  ]
}
```

---

## 📸 Screenshots

> _Add screenshots here after running the application._

| Upload Page | Processing | Results Dashboard |
|-------------|------------|-------------------|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## 💡 Example Workflow

1. Open `http://localhost:5173`
2. Drag and drop a `.mp3` or `.wav` meeting recording
3. Click **"Analyze Meeting"**
4. Watch the processing steps animate in real time
5. View the full dashboard: summary, decisions, action items, transcript
6. Download the summary as a Markdown file
7. Visit `/history` to see all past meetings

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
