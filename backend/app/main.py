"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.database.database import Base, engine
from app.api.routes import workspaces, recordings, chat, health

settings = get_settings()
setup_logging(debug=settings.debug)
logger = get_logger(__name__)

# Create all tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables verified/created")

os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="Meeting AI — API",
    description="AI Meeting Workspace: workspaces, recordings, timestamped transcripts, AI chat, and MOM generation.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(workspaces.router)
app.include_router(recordings.router)
app.include_router(chat.router)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

logger.info("Meeting AI API v2.0 started 🚀")
