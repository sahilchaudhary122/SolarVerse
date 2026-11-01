"""Canonical service-ticket and service-history API."""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Ticket = MODEL_CLASSES["service_ticket"]
Activity = MODEL_CLASSES["service_activity"]
TicketTechnician = MODEL_CLASSES["service_ticket_technician"]
Technician = MODEL_CLASSES["technician"]
Customer = MODEL_CLASSES["customer"]
Site = MODEL_CLASSES["site"]
EquipmentUnit = MODEL_CLASSES["equipment_unit"]
router = APIRouter(prefix="/support/tickets", tags=["Service Tickets"])
STAFF = ("system_admin", "service_manager", "technician")


class TicketCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_id: UUID | None = None
    site_id: UUID | None = None
    equipment_unit_id: UUID | None = None
    status: str = Field(default="open", min_length=1, max_length=24)
    notes: str | None = None


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(min_length=1, max_length=24)
    notes: str | None = None


class ActivityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    activity_type: str = Field(min_length=1, max_length=40)
    notes: str | None = None


class Assignment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    technician_id: UUID


def _owned_customer(session: Session, user: Any) -> Any:
    row = session.query(Customer).filter(
        func.lower(func.trim(Customer.email)) == user.email_normalized
    ).limit(2).all()
    if len(row) != 1:
        raise HTTPException(status_code=403, detail="Your account does not map to exactly one customer record")
    return row[0]


def _out(
    session: Session,
    row: Any,
    include_activities: bool = False,
    customer_view: bool = False,
) -> dict[str, Any]:
    result = {"id": str(row.id), "customer_id": str(row.customer_id),
              "site_id": str(row.site_id) if row.site_id else None,
              "equipment_unit_id": str(row.equipment_unit_id) if row.equipment_unit_id else None,
              "status": row.status, "opened_at": row.opened_at.isoformat(),
              "closed_at": row.closed_at.isoformat() if row.closed_at else None}
    result["technician_ids"] = [str(x) for (x,) in session.query(TicketTechnician.technician_id).filter_by(ticket_id=row.id).all()]
    if include_activities:
        activities = session.query(Activity).filter_by(ticket_id=row.id)
        if customer_view:
            activities = activities.filter(Activity.activity_type.in_(("customer_opening", "customer_update")))
        result["activities"] = [{"id": str(a.id), "activity_type": a.activity_type, "from_status": a.from_status,
                                 "to_status": a.to_status, "notes": a.notes, "occurred_at": a.occurred_at.isoformat()}
                                for a in activities.order_by(Activity.occurred_at, Activity.id).all()]
    return result


@router.post("", status_code=201)
def create_ticket(payload: TicketCreate, session: Session = Depends(get_db_session), user: Any = Depends(get_current_user)) -> dict[str, Any]:
    if user.role == "customer":
        customer = _owned_customer(session, user)
        if payload.customer_id is not None and payload.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="You may only create tickets for your customer account")
        if "status" in payload.model_fields_set and payload.status.strip().lower() != "open":
            raise HTTPException(status_code=403, detail="Customers cannot set ticket status")
    elif user.role in STAFF + ("sales_manager",):
        if payload.customer_id is None:
            raise HTTPException(status_code=422, detail="customer_id is required for staff ticket creation")
        customer = session.get(Customer, payload.customer_id)
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
    else:
        raise HTTPException(status_code=403, detail="Your role cannot create service tickets")
    if payload.site_id is not None:
        site = session.get(Site, payload.site_id)
        if site is None:
            raise HTTPException(status_code=404, detail="Site not found")
        if site.customer_id != customer.id:
            code = 403 if user.role == "customer" else 409
            raise HTTPException(status_code=code, detail="Ticket site must belong to the selected customer")
    ticket = Ticket(customer_id=customer.id, site_id=payload.site_id, equipment_unit_id=payload.equipment_unit_id, status=payload.status.strip())
    session.add(ticket)
    try:
        session.flush()
        if payload.notes:
            activity_type = "customer_opening" if user.role == "customer" else "created"
            session.add(Activity(ticket_id=ticket.id, activity_type=activity_type, to_status=ticket.status, notes=payload.notes))
        session.commit()
        session.refresh(ticket)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Ticket site/customer/equipment relationship is invalid") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Service ticket could not be created") from exc
    return _out(session, ticket, True, customer_view=user.role == "customer")


@router.get("")
def list_tickets(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=200),
                 session: Session = Depends(get_db_session), user: Any = Depends(get_current_user)) -> list[dict[str, Any]]:
    query = session.query(Ticket)
    if user.role == "customer":
        query = query.filter(Ticket.customer_id == _owned_customer(session, user).id)
    elif user.role not in STAFF + ("sales_manager", "management"):
        raise HTTPException(status_code=403, detail="Your role cannot list service tickets")
    return [_out(session, row) for row in query.order_by(Ticket.opened_at.desc(), Ticket.id).offset(offset).limit(limit).all()]


@router.get("/{ticket_id}")
def get_ticket(ticket_id: UUID, session: Session = Depends(get_db_session), user: Any = Depends(get_current_user)) -> dict[str, Any]:
    row = session.get(Ticket, ticket_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Service ticket not found")
    if user.role == "customer" and row.customer_id != _owned_customer(session, user).id:
        raise HTTPException(status_code=403, detail="Ticket belongs to another customer")
    if user.role != "customer" and user.role not in STAFF + ("sales_manager", "management"):
        raise HTTPException(status_code=403, detail="Your role cannot view service tickets")
    return _out(session, row, True, customer_view=user.role == "customer")


@router.post("/{ticket_id}/activities", status_code=201)
def add_activity(
    ticket_id: UUID,
    payload: ActivityCreate,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Service ticket not found")
    if user.role == "customer":
        customer = _owned_customer(session, user)
        if ticket.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Ticket belongs to another customer")
        if payload.activity_type.strip() != "customer_update":
            raise HTTPException(status_code=403, detail="Customers may only add customer updates")
        activity_type = "customer_update"
    elif user.role in STAFF:
        activity_type = payload.activity_type.strip()
    else:
        raise HTTPException(status_code=403, detail="Your role cannot add ticket activity")
    row = Activity(ticket_id=ticket_id, activity_type=activity_type, notes=payload.notes)
    session.add(row)
    try:
        session.commit()
        session.refresh(row)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Service activity could not be recorded") from exc
    return {"id": str(row.id), "ticket_id": str(row.ticket_id), "activity_type": row.activity_type,
            "notes": row.notes, "occurred_at": row.occurred_at.isoformat()}


@router.patch("/{ticket_id}/status", dependencies=[Depends(require_role(*STAFF))])
def update_status(ticket_id: UUID, payload: StatusUpdate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    row = session.query(Ticket).filter_by(id=ticket_id).with_for_update().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Service ticket not found")
    prior = row.status
    row.status = payload.status.strip()
    row.closed_at = datetime.now(timezone.utc) if row.status.lower() in {"closed", "resolved"} else None
    session.add(Activity(ticket_id=row.id, activity_type="status_change", from_status=prior, to_status=row.status, notes=payload.notes))
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Ticket status update failed") from exc
    return _out(session, row, True)


@router.post("/{ticket_id}/technicians", status_code=201, dependencies=[Depends(require_role("system_admin", "service_manager"))])
def assign_technician(ticket_id: UUID, payload: Assignment, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    if session.get(Ticket, ticket_id) is None:
        raise HTTPException(status_code=404, detail="Service ticket not found")
    tech = session.query(Technician).filter_by(id=payload.technician_id, active=True).first()
    if tech is None:
        raise HTTPException(status_code=404, detail="Active technician not found")
    row = TicketTechnician(ticket_id=ticket_id, technician_id=tech.id)
    session.add(row)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Technician is already assigned to this ticket") from exc
    return {"ticket_id": str(ticket_id), "technician_id": str(tech.id), "assigned_at": row.assigned_at.isoformat()}
