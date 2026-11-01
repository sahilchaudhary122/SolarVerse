"""Canonical sales-order and serialized-equipment APIs."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

SalesOrder = MODEL_CLASSES["sales_order"]
OrderLine = MODEL_CLASSES["order_line"]
Quotation = MODEL_CLASSES["quotation"]
QuotationLine = MODEL_CLASSES["quotation_line"]
SiteSurvey = MODEL_CLASSES["site_survey"]
EquipmentUnit = MODEL_CLASSES["equipment_unit"]
Product = MODEL_CLASSES["product"]
DispatchItem = MODEL_CLASSES["dispatch_item"]
router = APIRouter(prefix="/orders", tags=["Sales Orders & Equipment"])


class OrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quotation_id: UUID


class SerialRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    serial_number: str = Field(min_length=1, max_length=120)
    product_id: UUID
    dispatch_item_id: UUID | None = None


def _order(order: Any) -> dict[str, Any]:
    return {
        "id": str(order.id),
        "quotation_id": str(order.quotation_id),
        "status": order.status,
        "currency_code": order.currency_code,
        "subtotal_amount": str(order.subtotal_amount),
        "discount_amount": str(order.discount_amount),
        "tax_amount": str(order.tax_amount),
        "total_amount": str(order.total_amount),
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "sales", "sales_manager"))])
def create_order(payload: OrderCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    quotation = session.query(Quotation).filter_by(id=payload.quotation_id).with_for_update().first()
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.status != "approved":
        raise HTTPException(status_code=409, detail="Only approved quotations can become sales orders")
    survey = session.get(SiteSurvey, quotation.survey_id)
    if survey is None or survey.status != "approved" or not survey.is_current:
        raise HTTPException(status_code=409, detail="The quotation survey is no longer current and approved")
    if session.query(SalesOrder.id).filter_by(quotation_id=quotation.id).first():
        raise HTTPException(status_code=409, detail="A sales order already exists for this quotation")
    quote_lines = session.query(QuotationLine).filter_by(quotation_id=quotation.id).order_by(QuotationLine.id).all()
    if not quote_lines:
        raise HTTPException(status_code=409, detail="A quotation must contain at least one line before conversion")

    order = SalesOrder(
        quotation_id=quotation.id,
        status="confirmed",
        confirmed_at=func.now(),
        currency_code=quotation.currency_code,
        subtotal_amount=quotation.subtotal_amount,
        discount_amount=quotation.discount_amount,
        tax_amount=quotation.tax_amount,
        total_amount=quotation.total_amount,
    )
    session.add(order)
    try:
        session.flush()
        for line in quote_lines:
            session.add(OrderLine(
                order_id=order.id,
                source_quotation_line_id=line.id,
                product_id=line.product_id,
                description_snapshot=line.description_snapshot,
                quantity=line.quantity,
                unit_price=line.unit_price,
                discount_amount=line.discount_amount,
                tax_amount=line.tax_amount,
                line_total=line.line_total,
            ))
        session.commit()
        session.refresh(order)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Sales order conflicts with existing data") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Sales order could not be created") from exc
    return {"success": True, "data": _order(order)}


@router.get("", response_model=list[dict[str, Any]], dependencies=[Depends(require_role("system_admin", "sales", "sales_manager", "finance", "management"))])
def list_orders(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    rows = session.query(SalesOrder).order_by(SalesOrder.created_at.desc(), SalesOrder.id).offset(offset).limit(limit).all()
    return [_order(row) for row in rows]


@router.get("/{order_id}", dependencies=[Depends(require_role("system_admin", "sales", "sales_manager", "finance", "management"))])
def get_order(order_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    order = session.get(SalesOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    lines = session.query(OrderLine).filter_by(order_id=order.id).order_by(OrderLine.id).all()
    data = _order(order)
    data["lines"] = [{
        "id": str(line.id),
        "source_quotation_line_id": str(line.source_quotation_line_id) if line.source_quotation_line_id else None,
        "product_id": str(line.product_id) if line.product_id else None,
        "description_snapshot": line.description_snapshot,
        "quantity": str(line.quantity),
        "unit_price": str(line.unit_price),
        "discount_amount": str(line.discount_amount),
        "tax_amount": str(line.tax_amount),
        "line_total": str(line.line_total),
    } for line in lines]
    return data


@router.post("/serials", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "inventory_manager", "technician"))])
def register_serial(payload: SerialRegisterRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    product = session.get(Product, payload.product_id)
    if product is None or not product.active:
        raise HTTPException(status_code=404, detail="Active product not found")
    if not product.tracks_serial_number:
        raise HTTPException(status_code=409, detail="Product is not configured to track serial numbers")
    if payload.dispatch_item_id:
        dispatch_item = session.get(DispatchItem, payload.dispatch_item_id)
        if dispatch_item is None or dispatch_item.product_id != payload.product_id:
            raise HTTPException(status_code=409, detail="Dispatch item does not match the selected product")
    equipment = EquipmentUnit(
        product_id=payload.product_id,
        dispatch_item_id=payload.dispatch_item_id,
        serial_number=payload.serial_number.strip(),
    )
    session.add(equipment)
    try:
        session.commit()
        session.refresh(equipment)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Serial number already exists or violates a relationship") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Equipment unit could not be created") from exc
    return {"id": str(equipment.id), "serial_number": equipment.serial_number, "product_id": str(equipment.product_id), "dispatch_item_id": str(equipment.dispatch_item_id) if equipment.dispatch_item_id else None}


@router.get("/serials/{serial_num}", dependencies=[Depends(require_role("system_admin", "inventory_manager", "technician", "service_manager"))])
def lookup_serial(serial_num: str, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    equipment = session.query(EquipmentUnit).filter_by(serial_number=serial_num).first()
    if equipment is None:
        raise HTTPException(status_code=404, detail="Equipment serial number not found")
    return {"id": str(equipment.id), "serial_number": equipment.serial_number,
            "product_id": str(equipment.product_id), "dispatch_item_id": str(equipment.dispatch_item_id) if equipment.dispatch_item_id else None}
