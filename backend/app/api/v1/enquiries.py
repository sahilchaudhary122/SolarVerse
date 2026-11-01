"""Canonical enquiry, site, customer and status-history endpoints."""

from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Customer = MODEL_CLASSES["customer"]
Site = MODEL_CLASSES["site"]
Enquiry = MODEL_CLASSES["enquiry"]
StatusHistory = MODEL_CLASSES["enquiry_status_history"]
router = APIRouter(prefix="/enquiries", tags=["Enquiries"])
STAFF_ROLES = ("system_admin", "sales", "sales_manager", "management")
STATUSES = ("new", "contacted", "survey_pending", "qualified", "quoted", "converted", "lost", "cancelled")


class EnquiryCreateRequest(BaseModel):
    customer_name: str = Field(min_length=1, max_length=160)
    phone: str = Field(min_length=7, max_length=16, pattern=r"^\+[1-9]\d{6,14}$")
    email: str | None = Field(default=None, max_length=254)
    address: str = Field(min_length=1, max_length=2000)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    capacity_kw: Decimal | None = Field(default=None, gt=0, max_digits=8, decimal_places=3)
    system_type: str | None = Field(default=None, pattern=r"^(on-grid|off-grid)$")
    monthly_bill: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    monthly_bill_currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    requirements: str | None = None
    website: str | None = None

    @model_validator(mode="after")
    def currency_pair(self) -> "EnquiryCreateRequest":
        if (self.monthly_bill is None) != (self.monthly_bill_currency_code is None):
            raise ValueError("monthly_bill and monthly_bill_currency_code must be provided together")
        if self.email is not None:
            self.email = self.email.strip().lower()
        if self.monthly_bill_currency_code:
            self.monthly_bill_currency_code = self.monthly_bill_currency_code.upper()
        return self


class EnquiryUpdateRequest(BaseModel):
    site_id: UUID | None = None
    requested_capacity_kw: Decimal | None = Field(default=None, gt=0, max_digits=8, decimal_places=3)
    requested_system_type: str | None = Field(default=None, pattern=r"^(on-grid|off-grid)$")
    monthly_bill: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    monthly_bill_currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    requirements: str | None = None

    @model_validator(mode="after")
    def currency_pair(self) -> "EnquiryUpdateRequest":
        amount_changed = "monthly_bill" in self.model_fields_set
        currency_changed = "monthly_bill_currency_code" in self.model_fields_set
        if amount_changed != currency_changed and (self.monthly_bill is not None or self.monthly_bill_currency_code is not None):
            raise ValueError("monthly_bill and monthly_bill_currency_code must be updated together")
        if self.monthly_bill_currency_code:
            self.monthly_bill_currency_code = self.monthly_bill_currency_code.upper()
        return self


class StatusUpdateRequest(BaseModel):
    status: str = Field(pattern=r"^(new|contacted|survey_pending|qualified|quoted|converted|lost|cancelled)$")
    reason: str | None = None


def _serialize(enquiry: Any, customer: Any, site: Any) -> dict[str, Any]:
    return {
        "id": str(enquiry.id),
        "customer_id": str(customer.id),
        "customer_name": customer.name,
        "phone": customer.phone_e164,
        "email": customer.email,
        "site_id": str(site.id),
        "address": site.address_line,
        "city": site.city,
        "state": site.state,
        "postal_code": site.postal_code,
        "capacity_kw": str(enquiry.requested_capacity_kw) if enquiry.requested_capacity_kw is not None else None,
        "system_type": enquiry.requested_system_type,
        "monthly_bill": str(enquiry.monthly_bill) if enquiry.monthly_bill is not None else None,
        "monthly_bill_currency_code": enquiry.monthly_bill_currency_code,
        "requirements": enquiry.requirements,
        "status": enquiry.status,
        "created_at": enquiry.created_at.isoformat() if enquiry.created_at else None,
    }


def _owned_customer_id(session: Session, user: Any) -> UUID:
    matches = session.query(Customer.id).filter(func.lower(func.trim(Customer.email)) == user.email_normalized).limit(2).all()
    if len(matches) > 1:
        raise HTTPException(status_code=409, detail="Customer account mapping is ambiguous; contact support")
    if not matches:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return matches[0][0]


def _get_enquiry_rows(session: Session, enquiry_id: UUID) -> tuple[Any, Any, Any] | None:
    return (
        session.query(Enquiry, Customer, Site)
        .join(Customer, Customer.id == Enquiry.customer_id)
        .join(Site, (Site.customer_id == Enquiry.customer_id) & (Site.id == Enquiry.site_id))
        .filter(Enquiry.id == enquiry_id)
        .first()
    )


@router.post("", response_model=dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_enquiry(
    payload: EnquiryCreateRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    if payload.website:
        raise HTTPException(status_code=400, detail="Spam detected")
    try:
        customer = None
        if payload.email:
            matches = session.query(Customer).filter(func.lower(func.trim(Customer.email)) == payload.email).limit(2).all()
            if len(matches) > 1:
                raise HTTPException(status_code=409, detail="Customer email matches multiple records")
            if matches:
                customer = matches[0]
                if customer.phone_e164 != payload.phone:
                    raise HTTPException(status_code=409, detail="Customer email is associated with different contact details")
        if customer is None:
            customer = Customer(name=payload.customer_name.strip(), phone_e164=payload.phone, email=payload.email)
            session.add(customer)
            session.flush()

        site_matches = (
            session.query(Site)
            .filter(
                Site.customer_id == customer.id,
                func.lower(func.trim(Site.address_line)) == payload.address.strip().lower(),
                Site.city.is_not_distinct_from(payload.city),
                Site.state.is_not_distinct_from(payload.state),
                Site.postal_code.is_not_distinct_from(payload.postal_code),
            )
            .limit(2)
            .all()
        )
        if len(site_matches) > 1:
            raise HTTPException(status_code=409, detail="Site address matches multiple records; specify a customer site first")
        site = site_matches[0] if site_matches else Site(
            customer_id=customer.id,
            address_line=payload.address.strip(),
            city=payload.city,
            state=payload.state,
            postal_code=payload.postal_code,
        )
        if not site_matches:
            session.add(site)
            session.flush()

        enquiry = Enquiry(
            customer_id=customer.id,
            site_id=site.id,
            requested_capacity_kw=payload.capacity_kw,
            requested_system_type=payload.system_type,
            monthly_bill=payload.monthly_bill,
            monthly_bill_currency_code=payload.monthly_bill_currency_code,
            requirements=payload.requirements,
            status="new",
        )
        session.add(enquiry)
        session.flush()
        session.add(StatusHistory(enquiry_id=enquiry.id, from_status=None, to_status="new", reason="Enquiry created"))
        session.commit()
        session.refresh(enquiry)
    except HTTPException:
        session.rollback()
        raise
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Enquiry conflicts with existing data") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Enquiry could not be created") from exc

    return {
        "success": True,
        "message": "Enquiry submitted successfully",
        "data": _serialize(enquiry, customer, site),
    }


@router.get("", response_model=list[dict[str, Any]])
def list_enquiries(
    status_filter: str | None = None,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> list[dict[str, Any]]:
    if user.role == "customer":
        customer_id = _owned_customer_id(session, user)
    elif user.role in STAFF_ROLES:
        customer_id = None
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    query = (
        session.query(Enquiry, Customer, Site)
        .join(Customer, Customer.id == Enquiry.customer_id)
        .join(Site, (Site.customer_id == Enquiry.customer_id) & (Site.id == Enquiry.site_id))
    )
    if customer_id:
        query = query.filter(Enquiry.customer_id == customer_id)
    if status_filter:
        if status_filter not in STATUSES:
            raise HTTPException(status_code=422, detail="Unsupported enquiry status")
        query = query.filter(Enquiry.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Customer.name.ilike(term), Customer.phone_e164.ilike(term), Site.address_line.ilike(term)))
    rows = query.order_by(Enquiry.created_at.desc(), Enquiry.id).offset(offset).limit(limit).all()
    return [_serialize(enquiry, customer, site) for enquiry, customer, site in rows]


@router.get("/{enquiry_id}", response_model=dict[str, Any])
def get_enquiry(
    enquiry_id: UUID,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    row = _get_enquiry_rows(session, enquiry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry, customer, site = row
    if user.role == "customer" and customer.id != _owned_customer_id(session, user):
        raise HTTPException(status_code=403, detail="You may only access your enquiry")
    if user.role not in STAFF_ROLES and user.role != "customer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return _serialize(enquiry, customer, site)


@router.patch("/{enquiry_id}", response_model=dict[str, Any])
def update_enquiry(
    enquiry_id: UUID,
    payload: EnquiryUpdateRequest,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    row = _get_enquiry_rows(session, enquiry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry, customer, _ = row
    if user.role == "customer":
        if customer.id != _owned_customer_id(session, user):
            raise HTTPException(status_code=403, detail="You may only update your enquiry")
        allowed = {"requirements"}
    elif user.role in STAFF_ROLES:
        allowed = {"site_id", "requested_capacity_kw", "requested_system_type", "monthly_bill", "monthly_bill_currency_code", "requirements"}
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    values = payload.model_dump(exclude_unset=True)
    if not values or set(values) - allowed:
        raise HTTPException(status_code=422, detail="No supported update fields were provided")
    for key, value in values.items():
        setattr(enquiry, key, value)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Enquiry update violates a database constraint") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Enquiry could not be updated") from exc
    updated = _get_enquiry_rows(session, enquiry_id)
    return _serialize(*updated)


@router.get("/{enquiry_id}/history", response_model=list[dict[str, Any]])
def list_enquiry_status_history(
    enquiry_id: UUID,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> list[dict[str, Any]]:
    row = _get_enquiry_rows(session, enquiry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    enquiry, customer, _ = row
    if user.role == "customer" and customer.id != _owned_customer_id(session, user):
        raise HTTPException(status_code=403, detail="You may only access your enquiry history")
    if user.role not in STAFF_ROLES and user.role != "customer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    rows = session.query(StatusHistory).filter_by(enquiry_id=enquiry.id).order_by(StatusHistory.changed_at, StatusHistory.id).all()
    return [{"id": str(item.id), "from_status": item.from_status, "to_status": item.to_status, "changed_at": item.changed_at.isoformat(), "reason": item.reason} for item in rows]


@router.patch("/{enquiry_id}/status", dependencies=[Depends(require_role("system_admin", "sales", "sales_manager"))])
def update_enquiry_status(
    enquiry_id: UUID,
    payload: StatusUpdateRequest,
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    enquiry = session.query(Enquiry).filter_by(id=enquiry_id).with_for_update().first()
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if enquiry.status == payload.status:
        return {"success": True, "message": "Enquiry status is unchanged", "id": str(enquiry.id)}
    prior_status = enquiry.status
    session.add(StatusHistory(enquiry_id=enquiry.id, from_status=prior_status, to_status=payload.status, reason=payload.reason))
    enquiry.status = payload.status
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Enquiry status could not be updated") from exc
    return {"success": True, "message": f"Enquiry status updated to {payload.status}", "id": str(enquiry.id)}
