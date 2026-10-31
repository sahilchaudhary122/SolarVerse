"""FastAPI application entry point."""

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers


def create_application() -> FastAPI:
    """Create and configure the SolarVerse FastAPI application."""

    settings = get_settings()
    application = FastAPI(
        title=settings.application_name,
        version="0.1.0",
        description="SolarVerse solar business management API.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    register_exception_handlers(application)
    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_application()
