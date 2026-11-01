"""Health-check endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    """Response returned by the health-check endpoint."""

    status: str
    application: str


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Report whether the API is available."""

    settings = get_settings()
    return HealthResponse(status="healthy", application=settings.application_name)


@router.get("/health/database", response_model=HealthResponse, summary="Database readiness")
def database_readiness(
    session: Session = Depends(get_db_session),
) -> HealthResponse:
    """Check database readiness with a lightweight query."""

    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    return HealthResponse(status="healthy", application=get_settings().application_name)
