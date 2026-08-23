"""Health check endpoint."""

from fastapi import APIRouter
from app.database.database import check_db_connection
from app.schemas.api import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    ok = check_db_connection()
    return HealthResponse(status="ok", db="ok" if ok else "error")
