# 🧠 MeetingMind

> Turn meeting recordings into structured insights — transcript, summary, key decisions, and action items — inside a modern, persistent, ChatGPT-style Workspace. Powered by OpenAI Whisper and GPT-4o-mini.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org)

---

## ✨ Features

- **Multi-Workspace Environment** — Organize your recordings by project/company via persistent chat workspaces.
- **Audio & Video Upload** — Supports MP3, WAV, M4A, MP4, OGG, WebM (up to 25 MB).
- **Synchronized Media Player** — Click a transcript segment to instantly seek the video/audio to that exact moment.
- **AI Transcription** — OpenAI Whisper converts speech to text accurately with precise timestamps.
- **Meeting Intelligence Dashboard** — Tabbed panels for Executive Summary, Key Decisions, and Action Items with assignees and deadlines.
- **AI Workspace Chat** — A ChatGPT-style chat that allows you to query information across ALL recordings within a workspace (multi-document RAG).
- **MOM Generation Engine** — Dynamically output formal Minutes of Meetings (MOM) as instantly downloadable Markdown documents.

---

## 🏗️ Architecture

```
AI Pipeline: Media → Whisper (ASR) → GPT-4o-mini (LLM) → SQLite → React Dashboard
```

Both ASR and LLM providers implement protocol interfaces (`ASRProvider`, `LLMProvider`) to easily allow future engine swapping (e.g., Anthropic, Groq, local models) without changing core services.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| Database | SQLite via SQLAlchemy |
| ASR | OpenAI Whisper API (`whisper-1`) |
| LLM | OpenAI GPT-4o-mini (JSON mode + Pydantic validation) |

---

## 📁 Project Structure

```
Meeting_summarizer/
│
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Workspaces, recordings, chat routes
│   │   ├── services/
│   │   │   ├── providers/       # LLM/ASR OpenAI abstractions
│   │   │   └── *service.py      # Recording, Chat, and MOM services
│   │   ├── models/              # SQLAlchemy (Workspace, Recording, ChatMessage)
│   │   ├── schemas/             # Pydantic validation interfaces
│   │   └── main.py              # FastAPI init
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Main content layout
│   │   │   ├── intelligence/    # Summary, Decisions, Actions, MOM modals
│   │   │   ├── player/          # Media player
│   │   │   ├── transcript/      # Sync scrolling logic
│   │   │   └── workspace/       # Chat, File Uploaders
│   │   ├── pages/               # WorkspacePage, RecordingPage
│   │   ├── services/api.ts
│   │   └── hooks/               # Polling and media synchronization hooks
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

### 2. Backend Setup & Database

The backend default uses SQLite. **No external database server is required.** The SQLite database is automatically created locally on the first backend startup.

```bash
cd backend
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
npm install

# Configure environment variables
cp .env.example .env
# VITE_API_BASE_URL securely points to local backend route
```

---

## 🚀 Running the Application

### Start the backend (from `/backend`):

```bash
uvicorn app.main:app --reload --port 8000
```
API docs: `http://localhost:8000/docs`

### Start the frontend (from `/frontend`):

```bash
npm run dev
```
Frontend: `http://localhost:5173`

> 💡 Keep both terminals open while using the app.

---

## 🌍 Environment Variables

### `backend/.env`
| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | **Required.** Your OpenAI API key | — |
| `DATABASE_URL` | SQLite DB path | `sqlite:///./meeting_ai.db` |
| `UPLOAD_DIR` | Recordings directory | `uploads` |
| `FRONTEND_URL` | CORS frontend origin | `http://localhost:5173` |

### `frontend/.env`
| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## 💡 Example Workflow

1. Open `http://localhost:5173`
2. At the left sidebar, click **New Workspace** to create a fresh working context.
3. Drag and drop a recording into the workspace.
4. Watch the processing animation as the backend automatically extracts transcription and intelligence via Async Jobs.
5. Once completed, click the recording to enter the Media Dashboard.
6. Play the media, watch the captions highlight synchronously, and review the structured AI Action items instantly.
7. Return to the Workspace to chat with the AI about everything discussed.
8. Click **Generate MOM** for an instant copy-able Markdown summary to report back to your team.
