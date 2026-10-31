"""Tests for PostgreSQL connectivity and database session lifecycle."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.api.v1.health import database_readiness
from app.db import session as database_session
from app.main import app

client = TestClient(app)


def test_database_connection_executes_lightweight_query() -> None:
    session = next(database_session.get_db_session())

    try:
        result = session.execute(text("SELECT 1"))
        assert result.scalar_one() == 1
    finally:
        session.close()


def test_database_session_dependency_closes_session(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def create_tracking_session() -> TrackingSession:
        return TrackingSession()

    monkeypatch.setattr(
        database_session,
        "get_session_factory",
        lambda: create_tracking_session,
    )

    dependency = database_session.get_db_session()
    session = next(dependency)
    dependency.close()

    assert session.closed_by_dependency is True


class TrackingSession(Session):
    """Session test double that records dependency cleanup."""

    def __init__(self) -> None:
        super().__init__()
        self.closed_by_dependency = False

    def close(self) -> None:
        self.closed_by_dependency = True
        super().close()


def test_database_readiness_endpoint_returns_healthy() -> None:
    response = client.get("/api/v1/health/database")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "application": "SolarVerse",
    }


def test_database_readiness_hides_connection_errors() -> None:
    class FailingSession:
        def execute(self, statement: object) -> None:
            raise OperationalError("SELECT 1", {}, Exception("credential detail"))

    def failing_db_session() -> object:
        yield FailingSession()

    app.dependency_overrides[database_session.get_db_session] = failing_db_session
    try:
        response = client.get("/api/v1/health/database")
    finally:
        app.dependency_overrides.pop(database_session.get_db_session, None)

    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
    assert "credential detail" not in response.text
