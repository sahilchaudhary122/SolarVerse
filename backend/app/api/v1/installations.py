"""Canonical installation, technician assignment and checklist APIs."""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Installation = MODEL_CLASSES["installation"]
Technician = MODEL_CLASSES["technician"]
InstallationTechnician = MODEL_CLASSES["installation_technician"]
ChecklistItem = MODEL_CLASSES["installation_checklist_item"]
SalesOrder = MODEL_CLASSES["sales_order"]
Quotation = MODEL_CLASSES["quotation"]
Enquiry = MODEL_CLASSES["enquiry"]
router = APIRouter(prefix="/installations", tags=["Installations"])


class InstallationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    site_id: UUID | None = None
    order_id: UUID | None = None
    scheduled_at: datetime | None = None
    technician_ids: list[UUID] = Field(default_factory=list, max_length=30)
    status: str = Field(default="scheduled", min_length=1, max_length=24)


class TechnicianCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=160)
    phone_e164: str | None = Field(default=None, max_length=16)


class ChecklistCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    item_key: str = Field(min_length=1, max_length=80)
    description_snapshot: str = Field(min_length=1)
    notes: str | None = None


class ChecklistUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_completed: bool
    notes: str | None = None


class InstallationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(min_length=1, max_length=24)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    customer_signed_off_at: datetime | None = None


def _serialize(session: Session, installation: Any) -> dict[str, Any]:
    technicians = (
        session.query(Technician)
        .join(InstallationTechnician, InstallationTechnician.technician_id == Technician.id)
        .filter(InstallationTechnician.installation_id == installation.id)
        .order_by(Technician.name, Technician.id)
        .all()
    )
    return {"id": str(installation.id), "order_id": str(installation.order_id) if installation.order_id else None,
            "site_id": str(installation.site_id), "status": installation.status,
            "scheduled_at": installation.scheduled_at.isoformat() if installation.scheduled_at else None,
            "started_at": installation.started_at.isoformat() if installation.started_at else None,
            "completed_at": installation.completed_at.isoformat() if installation.completed_at else None,
            "customer_signed_off_at": installation.customer_signed_off_at.isoformat() if installation.customer_signed_off_at else None,
            "technicians": [{"id": str(row.id), "name": row.name} for row in technicians]}


def _derive_site_for_order(session: Session, order_id: UUID) -> UUID:
    row = (
        session.query(Enquiry.site_id)
        .join(Quotation, Quotation.enquiry_id == Enquiry.id)
        .join(SalesOrder, SalesOrder.quotation_id == Quotation.id)
        .filter(SalesOrder.id == order_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=409, detail="Could not derive an installation site from this order")
    return row[0]


@router.post("/technicians", status_code=201, dependencies=[Depends(require_role("system_admin", "sales_manager"))])
def create_technician(payload: TechnicianCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    technician = Technician(name=payload.name.strip(), phone_e164=payload.phone_e164, active=True)
    session.add(technician)
    try:
        session.commit()
        session.refresh(technician)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Technician could not be created") from exc
    return {"id": str(technician.id), "name": technician.name, "phone_e164": technician.phone_e164, "active": technician.active}


@router.get("/technicians", dependencies=[Depends(require_role("system_admin", "sales_manager", "surveyor", "technician", "service_manager"))])
def list_technicians(
    active: bool = True,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    rows = session.query(Technician).filter(Technician.active.is_(active)).order_by(Technician.name).offset(offset).limit(limit).all()
    return [{"id": str(row.id), "name": row.name, "phone_e164": row.phone_e164, "active": row.active} for row in rows]


@router.post("", status_code=201, dependencies=[Depends(require_role("system_admin", "sales_manager", "technician"))])
def create_installation(payload: InstallationCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    site_id = payload.site_id
    if payload.order_id and session.get(SalesOrder, payload.order_id) is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    if site_id is None:
        if payload.order_id is None:
            raise HTTPException(status_code=422, detail="site_id is required when no order is supplied")
        site_id = _derive_site_for_order(session, payload.order_id)
    if payload.technician_ids:
        technicians = session.query(Technician).filter(Technician.id.in_(payload.technician_ids), Technician.active.is_(True)).all()
        if len(technicians) != len(set(payload.technician_ids)):
            raise HTTPException(status_code=404, detail="One or more active technicians were not found")
    installation = Installation(order_id=payload.order_id, site_id=site_id, status=payload.status.strip(), scheduled_at=payload.scheduled_at)
    session.add(installation)
    try:
        session.flush()
        for technician_id in payload.technician_ids:
            session.add(InstallationTechnician(installation_id=installation.id, technician_id=technician_id))
        session.commit()
        session.refresh(installation)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Installation assignment conflicts with existing data") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Installation could not be scheduled") from exc
    return _serialize(session, installation)


@router.get("", dependencies=[Depends(require_role("system_admin", "sales_manager", "technician", "surveyor", "management"))])
def list_installations(
    site_id: UUID | None = None,
    status_filter: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(Installation)
    if site_id:
        query = query.filter(Installation.site_id == site_id)
    if status_filter:
        query = query.filter(Installation.status == status_filter)
    rows = query.order_by(Installation.created_at.desc(), Installation.id).offset(offset).limit(limit).all()
    return [_serialize(session, row) for row in rows]


@router.get("/{installation_id}", dependencies=[Depends(require_role("system_admin", "sales_manager", "technician", "surveyor", "management"))])
def get_installation(installation_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    row = session.get(Installation, installation_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Installation not found")
    return _serialize(session, row)


@router.post("/{installation_id}/checklist", status_code=201, dependencies=[Depends(require_role("system_admin", "sales_manager", "technician"))])
def add_checklist_item(installation_id: UUID, payload: ChecklistCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    if session.get(Installation, installation_id) is None:
        raise HTTPException(status_code=404, detail="Installation not found")
    item = ChecklistItem(installation_id=installation_id, item_key=payload.item_key.strip(),
                         description_snapshot=payload.description_snapshot.strip(), is_completed=False, notes=payload.notes)
    session.add(item)
    try:
        session.commit()
        session.refresh(item)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Checklist item key already exists for this installation") from exc
    return {"id": str(item.id), "item_key": item.item_key, "description_snapshot": item.description_snapshot,
            "is_completed": item.is_completed, "completed_at": None, "notes": item.notes}


@router.patch("/{installation_id}/checklist/{item_id}", dependencies=[Depends(require_role("system_admin", "sales_manager", "technician"))])
def update_checklist_item(
    installation_id: UUID,
    item_id: UUID,
    payload: ChecklistUpdate,
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    item = session.query(ChecklistItem).filter_by(id=item_id, installation_id=installation_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    item.is_completed = payload.is_completed
    item.completed_at = datetime.now(timezone.utc) if payload.is_completed else None
    item.notes = payload.notes
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Checklist item could not be updated") from exc
    return {"id": str(item.id), "item_key": item.item_key, "is_completed": item.is_completed,
            "completed_at": item.completed_at.isoformat() if item.completed_at else None, "notes": item.notes}


@router.patch("/{installation_id}/status", dependencies=[Depends(require_role("system_admin", "sales_manager", "technician"))])
def update_installation_status(
    installation_id: UUID,
    payload: InstallationStatusUpdate,
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    installation = session.query(Installation).filter_by(id=installation_id).with_for_update().first()
    if installation is None:
        raise HTTPException(status_code=404, detail="Installation not found")
    for field in ("started_at", "completed_at", "customer_signed_off_at"):
        value = getattr(payload, field)
        if field in payload.model_fields_set:
            setattr(installation, field, value)
    installation.status = payload.status.strip()
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Installation timestamps violate the documented order") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Installation status could not be updated") from exc
    return _serialize(session, installation)
