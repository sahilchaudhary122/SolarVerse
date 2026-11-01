"""Customer records and ownership-aware customer access."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Customer = MODEL_CLASSES["customer"]
router = APIRouter(prefix="/customers", tags=["Customers"])
STAFF_ROLES = ("system_admin", "sales", "sales_manager", "management", "service_manager", "finance")


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    phone_e164: str = Field(min_length=7, max_length=16, pattern=r"^\+[1-9]\d{6,14}$")
    email: str | None = Field(default=None, max_length=254)


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    phone_e164: str | None = Field(default=None, min_length=7, max_length=16, pattern=r"^\+[1-9]\d{6,14}$")
    email: str | None = Field(default=None, max_length=254)


def _serialize(customer: Any) -> dict[str, Any]:
    return {
        "id": str(customer.id),
        "name": customer.name,
        "phone_e164": customer.phone_e164,
        "email": customer.email,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


def _owned_customer(session: Session, user: Any) -> Any:
    matches = (
        session.query(Customer)
        .filter(func.lower(func.trim(Customer.email)) == user.email_normalized)
        .limit(2)
        .all()
    )
    if len(matches) > 1:
        raise HTTPException(status_code=409, detail="Customer account mapping is ambiguous; contact support")
    if not matches:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return matches[0]


@router.post("", status_code=201, dependencies=[Depends(require_role(*STAFF_ROLES))])
def create_customer(payload: CustomerCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    email = payload.email.strip().lower() if payload.email else None
    if email:
        matches = session.query(Customer).filter(func.lower(func.trim(Customer.email)) == email).limit(2).all()
        if len(matches) > 1:
            raise HTTPException(status_code=409, detail="Email matches multiple customer records")
        if matches:
            raise HTTPException(status_code=409, detail="Customer email is already registered")
    customer = Customer(name=payload.name.strip(), phone_e164=payload.phone_e164, email=email)
    session.add(customer)
    try:
        session.commit()
        session.refresh(customer)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Customer conflicts with an existing record") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Customer could not be created") from exc
    return _serialize(customer)


@router.get("", dependencies=[Depends(require_role(*STAFF_ROLES))])
def list_customers(
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(Customer)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Customer.name.ilike(term), Customer.phone_e164.ilike(term), Customer.email.ilike(term)))
    return [_serialize(row) for row in query.order_by(Customer.created_at.desc(), Customer.id).offset(offset).limit(limit).all()]


@router.get("/me")
def get_my_customer(
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")
    return _serialize(_owned_customer(session, user))


@router.get("/{customer_id}")
def get_customer(
    customer_id: UUID,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    customer = session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    if user.role == "customer" and customer.id != _owned_customer(session, user).id:
        raise HTTPException(status_code=403, detail="You may only access your customer record")
    if user.role not in set(STAFF_ROLES) | {"customer"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return _serialize(customer)


@router.patch("/{customer_id}")
def update_customer(
    customer_id: UUID,
    payload: CustomerUpdate,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    customer = session.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    if user.role == "customer":
        owned = _owned_customer(session, user)
        if customer.id != owned.id:
            raise HTTPException(status_code=403, detail="You may only update your customer record")
        if payload.email is not None:
            raise HTTPException(status_code=403, detail="Customers cannot change the email used to associate their account")
    elif user.role not in set(STAFF_ROLES):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="At least one field is required")
    for key, value in values.items():
        setattr(customer, key, value.strip().lower() if key == "email" and value else value.strip() if isinstance(value, str) else value)
    try:
        session.commit()
        session.refresh(customer)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Customer could not be updated") from exc
    return _serialize(customer)
