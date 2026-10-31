"""Tests for strict secure authentication and JWT verification."""

from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db_session
from app.models.user import User
from app.api.v1.auth import get_password_hash

client = TestClient(app)


def test_login_success(monkeypatch) -> None:
    mock_user = User(
        email="admin@solarverse.com",
        hashed_password=get_password_hash("admin123"),
        role="ADMIN",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user

    app.dependency_overrides[get_db_session] = lambda: mock_session
    try:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@solarverse.com", "password": "admin123"},
        )
    finally:
        app.dependency_overrides.pop(get_db_session, None)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@solarverse.com"


def test_login_incorrect_password(monkeypatch) -> None:
    mock_user = User(
        email="admin@solarverse.com",
        hashed_password=get_password_hash("admin123"),
        role="ADMIN",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user

    app.dependency_overrides[get_db_session] = lambda: mock_session
    try:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@solarverse.com", "password": "wrongpassword"},
        )
    finally:
        app.dependency_overrides.pop(get_db_session, None)

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_get_me_unauthorized() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  # Unauthenticated requests return HTTP 401


def test_get_me_success() -> None:
    mock_user = User(
        email="admin@solarverse.com",
        hashed_password=get_password_hash("admin123"),
        role="ADMIN",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user

    app.dependency_overrides[get_db_session] = lambda: mock_session
    try:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@solarverse.com", "password": "admin123"},
        )
        token = login_res.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        app.dependency_overrides.pop(get_db_session, None)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@solarverse.com"
    assert data["role"] == "ADMIN"
