"""Canonical order dispatch and dispatch-item APIs."""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Dispatch = MODEL_CLASSES["dispatch"]
DispatchItem = MODEL_CLASSES["dispatch_item"]
SalesOrder = MODEL_CLASSES["sales_order"]
OrderLine = MODEL_CLASSES["order_line"]
Product = MODEL_CLASSES["product"]
router = APIRouter(prefix="/dispatches", tags=["Dispatches"])


class DispatchItemInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_line_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)


class DispatchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_id: UUID
    status: str = Field(min_length=1, max_length=24)
    dispatched_at: datetime | None = None
    recipient_name: str | None = Field(default=None, max_length=160)
    notes: str | None = None
    items: list[DispatchItemInput] = Field(min_length=1, max_length=100)


def _details(session: Session, dispatch: Any) -> dict[str, Any]:
    items = session.query(DispatchItem).filter_by(dispatch_id=dispatch.id).order_by(DispatchItem.id).all()
    return {"id": str(dispatch.id), "order_id": str(dispatch.order_id), "status": dispatch.status,
            "dispatched_at": dispatch.dispatched_at.isoformat() if dispatch.dispatched_at else None,
            "delivered_at": dispatch.delivered_at.isoformat() if dispatch.delivered_at else None,
            "recipient_name": dispatch.recipient_name, "notes": dispatch.notes,
            "items": [{"id": str(item.id), "order_line_id": str(item.order_line_id) if item.order_line_id else None,
                       "product_id": str(item.product_id), "quantity": str(item.quantity)} for item in items]}


@router.post("", status_code=201, dependencies=[Depends(require_role("system_admin", "inventory_manager"))])
def create_dispatch(payload: DispatchCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    order = session.query(SalesOrder).filter_by(id=payload.order_id).with_for_update().first()
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    lines: list[tuple[Any, Any]] = []
    for item in payload.items:
        line = session.query(OrderLine).filter_by(id=item.order_line_id, order_id=order.id).with_for_update().first()
        if line is None or line.product_id is None:
            raise HTTPException(status_code=409, detail="Each dispatch line must reference a product-backed line on this order")
        product = session.get(Product, line.product_id)
        lines.append((item, line, product))
    dispatch = Dispatch(order_id=order.id, status=payload.status.strip(), dispatched_at=payload.dispatched_at,
                        recipient_name=payload.recipient_name, notes=payload.notes)
    session.add(dispatch)
    try:
        session.flush()
        for item, line, product in lines:
            if product is None:
                raise HTTPException(status_code=409, detail="Dispatch product no longer exists")
            session.add(DispatchItem(dispatch_id=dispatch.id, order_id=order.id, order_line_id=line.id,
                                     product_id=product.id, quantity=item.quantity))
        session.commit()
        session.refresh(dispatch)
    except HTTPException:
        session.rollback()
        raise
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Dispatch data violates an order or product relationship") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Dispatch could not be created") from exc
    return _details(session, dispatch)


@router.get("", dependencies=[Depends(require_role("system_admin", "inventory_manager", "sales_manager", "management"))])
def list_dispatches(
    order_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(Dispatch)
    if order_id:
        query = query.filter(Dispatch.order_id == order_id)
    rows = query.order_by(Dispatch.created_at.desc(), Dispatch.id).offset(offset).limit(limit).all()
    return [_details(session, row) for row in rows]
