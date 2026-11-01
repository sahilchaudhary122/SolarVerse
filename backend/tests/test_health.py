"""Tests for the Phase 1 health endpoint."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_healthy_status() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "application": "SolarVerse",
    }


def test_api_documentation_is_available() -> None:
    response = client.get("/docs")

    assert response.status_code == 200
    assert "Swagger UI" in response.text
