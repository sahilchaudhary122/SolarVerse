"""Canonical equipment warranty records."""

from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Warranty = MODEL_CLASSES["warranty"]
EquipmentUnit = MODEL_CLASSES["equipment_unit"]
router = APIRouter(prefix="/warranties", tags=["Warranties"])
STAFF = ("system_admin", "inventory_manager", "sales_manager", "service_manager")


class WarrantyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    equipment_unit_id: UUID
    starts_on: date
    ends_on: date
    terms: str | None = None

    @model_validator(mode="after")
    def valid_dates(self):
        if self.ends_on < self.starts_on:
            raise ValueError("ends_on must be on or after starts_on")
        return self


def _out(row: Any, serial: str) -> dict[str, Any]:
    return {"id": str(row.id), "equipment_unit_id": str(row.equipment_unit_id),
            "serial_number": serial, "starts_on": row.starts_on.isoformat(),
            "ends_on": row.ends_on.isoformat(), "valid_now": row.starts_on <= date.today() <= row.ends_on,
            "terms": row.terms}


@router.post("", status_code=201, dependencies=[Depends(require_role(*STAFF))])
def create_warranty(payload: WarrantyCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    unit = session.get(EquipmentUnit, payload.equipment_unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Equipment unit not found")
    row = Warranty(equipment_unit_id=unit.id, starts_on=payload.starts_on, ends_on=payload.ends_on, terms=payload.terms)
    session.add(row)
    try:
        session.commit()
        session.refresh(row)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Warranty conflicts with canonical equipment data") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Warranty could not be created") from exc
    return _out(row, unit.serial_number)


@router.get("", dependencies=[Depends(require_role(*STAFF))])
def list_warranties(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=200),
                    session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    rows = session.query(Warranty, EquipmentUnit.serial_number).join(EquipmentUnit).order_by(Warranty.starts_on.desc(), Warranty.id).offset(offset).limit(limit).all()
    return [_out(row, serial) for row, serial in rows]


@router.get("/lookup/{serial_number}", dependencies=[Depends(require_role(*STAFF, "technician"))])
def lookup_warranty(serial_number: str, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    match = session.query(Warranty, EquipmentUnit.serial_number).join(EquipmentUnit).filter(EquipmentUnit.serial_number == serial_number).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Warranty not found for serial number")
    return _out(*match)
