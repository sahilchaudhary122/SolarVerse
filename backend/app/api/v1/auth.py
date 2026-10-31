"""Secure authentication, password hashing, JWT verification, and strict RBAC."""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
import jwt
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer()

pwd_context = PasswordHash.recommended()


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool


def get_password_hash(password: str) -> str:
    """Hash password using Argon2 via pwdlib."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db_session)) -> TokenResponse:
    """Authenticate user with Argon2 password verification and database lookup."""
    if not payload.email or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password required",
        )

    try:
        user = session.query(User).filter_by(email=payload.email).first()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": user.email, "role": user.role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)

    return TokenResponse(
        access_token=encoded_jwt,
        token_type="bearer",
        role=user.role,
        email=user.email,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    session: Session = Depends(get_db_session),
) -> User:
    """Validate JWT token and verify user existence, status, and role strictly against database."""
    settings = get_settings()
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
        ) from exc

    try:
        user = session.query(User).filter_by(email=email).first()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user


def require_role(*allowed_roles: str):
    """Dependency factory to enforce RBAC role permissions based on database record."""
    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and "ADMIN" not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation",
            )
        return current_user
    return role_dependency


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return profile of currently authenticated user."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )
