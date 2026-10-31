"""Order and Serial Number API endpoints."""

from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Order, SerialNumber, Quotation

router = APIRouter(prefix="/orders", tags=["Orders & Serial Numbers"])


class OrderCreateRequest(BaseModel):
    quotation_id: str
    customer_id: str
    site_id: str
    total_amount: float | Decimal


class SerialRegisterRequest(BaseModel):
    serial_number: str
    product_id: str
    order_id: str | None = None
    customer_id: str | None = None
    site_id: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    order = Order(
        quotation_id=payload.quotation_id,
        customer_id=payload.customer_id,
        site_id=payload.site_id,
        total_amount=Decimal(str(payload.total_amount)),
        status="confirmed",
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return {"success": True, "message": "Order confirmed successfully", "id": str(order.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_orders(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    orders = session.query(Order).all()
    return [{
        "id": str(o.id),
        "customer_id": str(o.customer_id),
        "total_amount": float(o.total_amount),
        "status": o.status,
    } for o in orders]


@router.post("/serials", status_code=status.HTTP_201_CREATED)
def register_serial(payload: SerialRegisterRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    serial = SerialNumber(
        serial_number=payload.serial_number,
        product_id=payload.product_id,
        order_id=payload.order_id,
        customer_id=payload.customer_id,
        site_id=payload.site_id,
        status="dispatched",
    )
    session.add(serial)
    session.commit()
    session.refresh(serial)
    return {"success": True, "message": "Serial number registered successfully", "id": str(serial.id)}


@router.get("/serials/{serial_num}", response_model=dict[str, Any])
def lookup_serial(serial_num: str, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    serial = session.query(SerialNumber).filter_by(serial_number=serial_num).first()
    if not serial:
        raise HTTPException(status_code=404, detail="Serial number not found")
    return {
        "id": str(serial.id),
        "serial_number": serial.serial_number,
        "product_id": str(serial.product_id),
        "status": serial.status,
    }
