"""Tests for strict secure authentication and JWT verification."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import jwt
import pytest
from pydantic import ValidationError

from app.main import app
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES
from app.api.v1.auth import _issue_token, get_password_hash
from app.api.v1.auth import require_role
from app.core.config import Settings, get_settings
from fastapi import HTTPException
from uuid import uuid4

client = TestClient(app)
AppUser = MODEL_CLASSES["app_user"]


def test_login_success(monkeypatch) -> None:
    mock_user = AppUser(
        id=uuid4(),
        display_name="Admin",
        email_normalized="admin@solarverse.com",
        password_hash=get_password_hash("admin123"),
        role="system_admin",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user
    mock_session.get.return_value = mock_user

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
    assert data["role"] == "system_admin"
    assert data["email"] == "admin@solarverse.com"


def test_login_incorrect_password(monkeypatch) -> None:
    mock_user = AppUser(
        id=uuid4(),
        display_name="Admin",
        email_normalized="admin@solarverse.com",
        password_hash=get_password_hash("admin123"),
        role="system_admin",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user
    mock_session.get.return_value = mock_user

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


def test_login_rejects_inactive_account(monkeypatch) -> None:
    mock_user = AppUser(
        id=uuid4(), display_name="Inactive", email_normalized="inactive@solarverse.com",
        password_hash=get_password_hash("admin123"), role="system_admin", is_active=False,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user
    app.dependency_overrides[get_db_session] = lambda: mock_session
    try:
        response = client.post("/api/v1/auth/login", json={"email": mock_user.email_normalized, "password": "admin123"})
    finally:
        app.dependency_overrides.pop(get_db_session, None)
    assert response.status_code == 403
    assert response.json()["detail"] == "Inactive user account"


def test_invalid_expired_and_inactive_session_tokens_are_rejected(monkeypatch) -> None:
    invalid = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert invalid.status_code == 401

    settings = get_settings()
    user_id = uuid4()
    expired_token = jwt.encode(
        {"sub": str(user_id), "role": "system_admin", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    expired = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired.status_code == 401

    inactive_user = AppUser(
        id=user_id, display_name="Inactive", email_normalized="inactive@solarverse.com",
        password_hash="hash", role="system_admin", is_active=False,
    )
    mock_session = MagicMock()
    mock_session.get.return_value = inactive_user
    app.dependency_overrides[get_db_session] = lambda: mock_session
    valid_token = jwt.encode(
        {"sub": str(user_id), "role": "system_admin", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    try:
        response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {valid_token}"})
    finally:
        app.dependency_overrides.pop(get_db_session, None)
    assert response.status_code == 403


def test_production_settings_require_and_issue_jwt_issuer_and_audience(monkeypatch) -> None:
    base = {
        "environment": "production",
        "secret_key": "production-test-secret-value-that-is-long-enough",
        "database_url": "postgresql+psycopg://db.example.test/solarverse?sslmode=require",
        "cors_origins": ["https://app.example.test"],
    }
    with pytest.raises(ValidationError):
        Settings(**base)

    settings = Settings(**base, jwt_issuer="https://api.example.test", jwt_audience="solarverse-web")
    monkeypatch.setattr("app.api.v1.auth.get_settings", lambda: settings)
    user = AppUser(id=uuid4(), display_name="Issuer test", email_normalized="issuer@example.test", password_hash="hash", role="sales", is_active=True)
    issued = _issue_token(user)
    claims = jwt.decode(issued.access_token, settings.secret_key, algorithms=[settings.jwt_algorithm],
                        issuer=settings.jwt_issuer, audience=settings.jwt_audience)
    assert claims["iss"] == settings.jwt_issuer
    assert claims["aud"] == settings.jwt_audience


def test_get_me_unauthorized() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  # Unauthenticated requests return HTTP 401


def test_get_me_success() -> None:
    mock_user = AppUser(
        id=uuid4(),
        display_name="Admin",
        email_normalized="admin@solarverse.com",
        password_hash=get_password_hash("admin123"),
        role="system_admin",
        is_active=True,
    )
    mock_session = MagicMock()
    mock_session.query.return_value.filter_by.return_value.first.return_value = mock_user
    mock_session.get.return_value = mock_user

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
    assert data["role"] == "system_admin"


def test_admin_allowlist_does_not_grant_every_role() -> None:
    dependency = require_role("ADMIN")
    sales_user = AppUser(id=uuid4(), display_name="Sales", email_normalized="sales@solarverse.com", password_hash="hash", role="sales", is_active=True)
    try:
        dependency(current_user=sales_user)
        assert False, "A sales role must not inherit the ADMIN permission"
    except HTTPException as exc:
        assert exc.status_code == 403


def test_legacy_admin_role_does_not_map_to_system_admin_permission() -> None:
    dependency = require_role("system_admin")
    legacy_user = AppUser(id=uuid4(), display_name="Legacy", email_normalized="legacy@example.com", password_hash="hash", role="ADMIN", is_active=True)
    try:
        dependency(current_user=legacy_user)
        assert False, "Legacy ADMIN must not grant canonical system_admin permissions"
    except HTTPException as exc:
        assert exc.status_code == 403


def test_business_enquiry_list_requires_authentication() -> None:
    response = client.get("/api/v1/enquiries")
    assert response.status_code == 401


def test_registration_rejects_weak_password_before_database_access() -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Example Customer", "email": "customer@example.com", "mobile": "+911234567890", "password": "short"},
    )
    assert response.status_code == 422


def test_registration_rejects_invalid_phone_before_database_access() -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Example Customer", "email": "customer@example.com", "mobile": "123", "password": "secure123"},
    )
    assert response.status_code == 422
