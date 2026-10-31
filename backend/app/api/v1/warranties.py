"""Warranty management API endpoints."""

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Warranty, SerialNumber

router = APIRouter(prefix="/warranties", tags=["Warranties"])


class WarrantyActivateRequest(BaseModel):
    serial_number_id: str
    customer_id: str
    warranty_period_months: int = 60
    delivery_date: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def activate_warranty(payload: WarrantyActivateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    start = datetime.fromisoformat(payload.delivery_date) if payload.delivery_date else datetime.now(timezone.utc)
    # calculate expiry
    expiry = start.replace(year=start.year + (payload.warranty_period_months // 12))

    warranty = Warranty(
        serial_number_id=payload.serial_number_id,
        customer_id=payload.customer_id,
        warranty_period_months=payload.warranty_period_months,
        start_date=start,
        expiry_date=expiry,
        status="active",
    )
    session.add(warranty)
    session.commit()
    session.refresh(warranty)
    return {"success": True, "message": "Warranty activated from delivery date", "id": str(warranty.id)}


@router.get("/lookup/{serial_num}", response_model=dict[str, Any])
def lookup_warranty(serial_num: str, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    serial = session.query(SerialNumber).filter_by(serial_number=serial_num).first()
    if not serial:
        raise HTTPException(status_code=404, detail="Serial number not found")
    warranty = session.query(Warranty).filter_by(serial_number_id=serial.id).first()
    if not warranty:
        raise HTTPException(status_code=404, detail="Warranty record not found for serial number")
    return {
        "id": str(warranty.id),
        "serial_number": serial_num,
        "status": warranty.status,
        "start_date": warranty.start_date.isoformat(),
        "expiry_date": warranty.expiry_date.isoformat(),
        "warranty_period_months": warranty.warranty_period_months,
    }
