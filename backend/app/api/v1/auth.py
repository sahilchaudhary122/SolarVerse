"""Authentication and role authorization backed by the canonical app_user table."""

from datetime import datetime, timedelta, timezone
import re
from typing import Any
from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

AppUser = MODEL_CLASSES["app_user"]
Customer = MODEL_CLASSES["customer"]

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)
pwd_context = PasswordHash.recommended()

SUPPORTED_ROLES = frozenset({
    "system_admin", "sales", "surveyor", "sales_manager", "inventory_manager",
    "technician", "service_manager", "finance", "management", "customer",
})


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value


class RegistrationRequest(LoginRequest):
    full_name: str = Field(min_length=2, max_length=160)
    mobile: str = Field(min_length=7, max_length=24)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8 or not any(char.isalpha() for char in value) or not any(char.isdigit() for char in value):
            raise ValueError("Password must have at least 8 characters, including a letter and a number")
        return value


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


class UserDirectoryItem(BaseModel):
    id: str
    display_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class UserProvisionRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=160)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in SUPPORTED_ROLES - {"customer"}:
            raise ValueError("Unsupported staff role")
        return value


class UserRoleUpdate(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in SUPPORTED_ROLES - {"customer"}:
            raise ValueError("Unsupported staff role")
        return value


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def _issue_token(user: Any) -> TokenResponse:
    settings = get_settings()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=60)
    claims: dict[str, Any] = {"sub": str(user.id), "role": user.role, "exp": expiry}
    if settings.jwt_issuer:
        claims["iss"] = settings.jwt_issuer
    if settings.jwt_audience:
        claims["aud"] = settings.jwt_audience
    token = jwt.encode(
        claims,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return TokenResponse(access_token=token, role=user.role, email=user.email_normalized)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db_session)) -> TokenResponse:
    try:
        user = session.query(AppUser).filter_by(email_normalized=payload.email).first()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
    return _issue_token(user)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegistrationRequest, session: Session = Depends(get_db_session)) -> TokenResponse:
    phone = re.sub(r"[^\d+]", "", payload.mobile)
    if not re.fullmatch(r"\+[1-9]\d{6,14}", phone):
        raise HTTPException(status_code=422, detail="Enter a valid international phone number")

    try:
        if session.query(AppUser).filter_by(email_normalized=payload.email).first():
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        # The schema has no customer_id FK on app_user. Email is the available
        # matching key; ambiguous historical matches are rejected, never guessed.
        matches = (
            session.query(Customer)
            .filter(func.lower(func.trim(Customer.email)) == payload.email)
            .with_for_update()
            .all()
        )
        if len(matches) > 1:
            raise HTTPException(status_code=409, detail="Customer email matches multiple records; contact support")
        if matches:
            customer = matches[0]
            if customer.phone_e164 != phone:
                raise HTTPException(status_code=409, detail="Email is already associated with different customer details")
        else:
            customer = Customer(name=payload.full_name.strip(), phone_e164=phone, email=payload.email)
            session.add(customer)
            session.flush()

        user = AppUser(
            display_name=payload.full_name.strip(),
            email_normalized=payload.email,
            password_hash=get_password_hash(payload.password),
            role="customer",
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    except HTTPException:
        session.rollback()
        raise
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Account or customer details conflict with an existing record") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Account could not be created") from exc
    return _issue_token(user)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
    session: Session = Depends(get_db_session),
) -> Any:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    settings = get_settings()
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer or None,
            audience=settings.jwt_audience or None,
        )
        user_id = UUID(claims["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}) from exc
    try:
        user = session.get(AppUser, user_id)
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    if user is None:
        raise HTTPException(status_code=401, detail="User not found", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user account")
    return user


def require_role(*allowed_roles: str):
    allowed = {role.strip().lower() for role in allowed_roles}

    def role_dependency(current_user: Any = Depends(get_current_user)) -> Any:
        if current_user.role.strip().lower() not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions for this operation")
        return current_user

    return role_dependency


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: Any = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email_normalized,
        role=current_user.role,
        is_active=current_user.is_active,
    )


@router.get("/users", response_model=list[UserDirectoryItem])
def list_users(
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 50,
    session: Session = Depends(get_db_session),
    _: Any = Depends(require_role("system_admin")),
) -> list[UserDirectoryItem]:
    if offset < 0 or limit < 1 or limit > 100:
        raise HTTPException(status_code=422, detail="Pagination must use offset >= 0 and limit between 1 and 100")
    query = session.query(AppUser)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            AppUser.display_name.ilike(term) | AppUser.email_normalized.ilike(term)
        )
    if role:
        query = query.filter(AppUser.role == role.strip().lower())
    if is_active is not None:
        query = query.filter(AppUser.is_active.is_(is_active))
    rows = query.order_by(AppUser.created_at.desc(), AppUser.id).offset(offset).limit(limit).all()
    return [UserDirectoryItem(
        id=str(row.id),
        display_name=row.display_name,
        email=row.email_normalized,
        role=row.role,
        is_active=row.is_active,
        created_at=row.created_at,
    ) for row in rows]


@router.get("/users/{user_id}", response_model=UserDirectoryItem)
def get_user(
    user_id: UUID,
    session: Session = Depends(get_db_session),
    _: Any = Depends(require_role("system_admin")),
) -> UserDirectoryItem:
    row = session.get(AppUser, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDirectoryItem(
        id=str(row.id), display_name=row.display_name, email=row.email_normalized,
        role=row.role, is_active=row.is_active, created_at=row.created_at,
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def provision_user(
    payload: UserProvisionRequest,
    session: Session = Depends(get_db_session),
    _: Any = Depends(require_role("system_admin")),
) -> UserResponse:
    user = AppUser(
        display_name=payload.display_name.strip(),
        email_normalized=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    session.add(user)
    try:
        session.commit()
        session.refresh(user)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="User could not be created") from exc
    return UserResponse(id=str(user.id), email=user.email_normalized, role=user.role, is_active=user.is_active)


@router.patch("/users/{user_id}/active", response_model=UserResponse)
def set_user_active(
    user_id: UUID,
    is_active: bool,
    session: Session = Depends(get_db_session),
    current_user: Any = Depends(require_role("system_admin")),
) -> UserResponse:
    user = session.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and not is_active:
        raise HTTPException(status_code=409, detail="An administrator cannot deactivate their own account")
    user.is_active = is_active
    user.updated_at = datetime.now(timezone.utc)
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="User status could not be updated") from exc
    return UserResponse(id=str(user.id), email=user.email_normalized, role=user.role, is_active=user.is_active)


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def set_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    session: Session = Depends(get_db_session),
    current_user: Any = Depends(require_role("system_admin")),
) -> UserResponse:
    user = session.get(AppUser, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and user.role != payload.role:
        raise HTTPException(status_code=409, detail="An administrator cannot change their own role")
    user.role = payload.role
    user.updated_at = datetime.now(timezone.utc)
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="User role could not be updated") from exc
    return UserResponse(id=str(user.id), email=user.email_normalized, role=user.role, is_active=user.is_active)
