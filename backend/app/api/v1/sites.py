"""Canonical customer-owned site endpoints."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Customer = MODEL_CLASSES["customer"]
Site = MODEL_CLASSES["site"]
router = APIRouter(prefix="/sites", tags=["Sites"])
STAFF_ROLES = ("system_admin", "sales", "sales_manager", "surveyor", "management")


class SiteCreateRequest(BaseModel):
    customer_id: UUID | None = None
    label: str | None = Field(default=None, max_length=120)
    address_line: str = Field(min_length=1, max_length=4000)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country_code: str = Field(default="IN", min_length=2, max_length=2, pattern=r"^[A-Za-z]{2}$")


def _customer_for_user(session: Session, user: Any) -> Any:
    rows = session.query(Customer).filter(func.lower(func.trim(Customer.email)) == user.email_normalized).limit(2).all()
    if len(rows) > 1:
        raise HTTPException(status_code=409, detail="Customer account mapping is ambiguous; contact support")
    if not rows:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return rows[0]


def _serialize(site: Any) -> dict[str, Any]:
    return {"id": str(site.id), "customer_id": str(site.customer_id), "label": site.label,
            "address_line": site.address_line, "city": site.city, "state": site.state,
            "postal_code": site.postal_code, "country_code": site.country_code,
            "created_at": site.created_at.isoformat() if site.created_at else None}


@router.post("", status_code=201)
def create_site(
    payload: SiteCreateRequest,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    if user.role == "customer":
        customer = _customer_for_user(session, user)
        if payload.customer_id and payload.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="You may only create a site for your customer account")
    elif user.role in STAFF_ROLES:
        if payload.customer_id is None:
            raise HTTPException(status_code=422, detail="customer_id is required for staff site creation")
        customer = session.get(Customer, payload.customer_id)
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    site = Site(customer_id=customer.id, label=payload.label, address_line=payload.address_line.strip(),
                city=payload.city, state=payload.state, postal_code=payload.postal_code,
                country_code=payload.country_code.upper())
    session.add(site)
    try:
        session.commit()
        session.refresh(site)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Site could not be created") from exc
    return _serialize(site)


@router.get("", response_model=list[dict[str, Any]])
def list_sites(
    customer_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> list[dict[str, Any]]:
    query = session.query(Site)
    if user.role == "customer":
        own_id = _customer_for_user(session, user).id
        if customer_id and customer_id != own_id:
            raise HTTPException(status_code=403, detail="You may only access your sites")
        query = query.filter(Site.customer_id == own_id)
    elif user.role in STAFF_ROLES:
        if customer_id:
            query = query.filter(Site.customer_id == customer_id)
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    rows = query.order_by(Site.created_at.desc(), Site.id).offset(offset).limit(limit).all()
    return [_serialize(row) for row in rows]


@router.get("/{site_id}")
def get_site(
    site_id: UUID,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    site = session.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="Site not found")
    if user.role == "customer" and site.customer_id != _customer_for_user(session, user).id:
        raise HTTPException(status_code=403, detail="You may only access your sites")
    if user.role not in STAFF_ROLES and user.role != "customer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return _serialize(site)
