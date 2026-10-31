"""SQLAlchemy engine and request-scoped session management."""

from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def create_database_engine(database_url: str) -> Engine:
    """Create a pooled SQLAlchemy engine for a PostgreSQL URL."""

    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_timeout=30,
    )


@lru_cache
def get_engine() -> Engine:
    """Return the process-wide engine for the configured database."""

    return create_database_engine(get_settings().database_url)


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    """Return the process-wide session factory."""

    return sessionmaker(bind=get_engine(), autocommit=False, autoflush=False)


def get_db_session() -> Generator[Session, None, None]:
    """Yield one database session and always close it after the request."""

    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
