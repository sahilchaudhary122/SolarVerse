"""Canonical stock, movement, and reservation endpoints."""

from decimal import Decimal
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

InventoryLocation = MODEL_CLASSES["inventory_location"]
InventoryBalance = MODEL_CLASSES["inventory_balance"]
StockMovement = MODEL_CLASSES["stock_movement"]
StockReservation = MODEL_CLASSES["stock_reservation"]
SalesOrder = MODEL_CLASSES["sales_order"]
OrderLine = MODEL_CLASSES["order_line"]
Product = MODEL_CLASSES["product"]
router = APIRouter(prefix="/inventory", tags=["Inventory"])
INV_ROLES = ("system_admin", "inventory_manager")


class LocationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)


class MovementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    location_id: UUID
    product_id: UUID
    order_id: UUID | None = None
    movement_type: str = Field(min_length=1, max_length=30)
    quantity_delta: Decimal = Field(max_digits=12, decimal_places=3)
    notes: str | None = None


class ReservationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    location_id: UUID
    order_id: UUID
    order_line_id: UUID
    product_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)


def _balance(balance: Any) -> dict[str, Any]:
    return {"location_id": str(balance.location_id), "product_id": str(balance.product_id),
            "quantity_on_hand": str(balance.quantity_on_hand),
            "updated_at": balance.updated_at.isoformat() if balance.updated_at else None}


@router.post("/locations", status_code=201, dependencies=[Depends(require_role(*INV_ROLES))])
def create_location(payload: LocationCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    location = InventoryLocation(name=payload.name.strip(), active=True)
    session.add(location)
    try:
        session.commit()
        session.refresh(location)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Inventory location could not be created") from exc
    return {"id": str(location.id), "name": location.name, "active": location.active}


@router.get("/locations", dependencies=[Depends(require_role(*INV_ROLES, "sales", "sales_manager"))])
def list_locations(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    rows = session.query(InventoryLocation).order_by(InventoryLocation.name, InventoryLocation.id).all()
    return [{"id": str(row.id), "name": row.name, "active": row.active} for row in rows]


@router.get("/balances", dependencies=[Depends(require_role(*INV_ROLES, "sales", "sales_manager", "finance", "management"))])
def list_balances(
    location_id: UUID | None = None,
    product_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(InventoryBalance)
    if location_id:
        query = query.filter(InventoryBalance.location_id == location_id)
    if product_id:
        query = query.filter(InventoryBalance.product_id == product_id)
    return [_balance(row) for row in query.order_by(InventoryBalance.location_id, InventoryBalance.product_id).offset(offset).limit(limit).all()]


@router.post("/movements", status_code=201, dependencies=[Depends(require_role(*INV_ROLES))])
def create_movement(payload: MovementCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    if payload.quantity_delta == 0:
        raise HTTPException(status_code=422, detail="quantity_delta must be nonzero")
    location = session.get(InventoryLocation, payload.location_id)
    product = session.get(Product, payload.product_id)
    if location is None or not location.active or product is None or not product.active:
        raise HTTPException(status_code=404, detail="Active location or product not found")
    if payload.order_id and session.get(SalesOrder, payload.order_id) is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    try:
        session.execute(
            pg_insert(InventoryBalance.__table__)
            .values(location_id=payload.location_id, product_id=payload.product_id, quantity_on_hand=Decimal("0"))
            .on_conflict_do_nothing(index_elements=["location_id", "product_id"])
        )
        balance = (
            session.query(InventoryBalance)
            .filter_by(location_id=payload.location_id, product_id=payload.product_id)
            .with_for_update()
            .one()
        )
        updated_quantity = balance.quantity_on_hand + payload.quantity_delta
        if updated_quantity < 0:
            raise HTTPException(status_code=409, detail="Movement would make on-hand quantity negative")
        balance.quantity_on_hand = updated_quantity
        balance.updated_at = datetime.now(timezone.utc)
        movement = StockMovement(
            location_id=payload.location_id,
            product_id=payload.product_id,
            order_id=payload.order_id,
            movement_type=payload.movement_type.strip(),
            quantity_delta=payload.quantity_delta,
            notes=payload.notes,
        )
        session.add(movement)
        session.commit()
        session.refresh(movement)
    except HTTPException:
        session.rollback()
        raise
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Stock movement could not be recorded") from exc
    return {"id": str(movement.id), "location_id": str(movement.location_id), "product_id": str(movement.product_id),
            "quantity_delta": str(movement.quantity_delta), "quantity_on_hand": str(updated_quantity)}


@router.get("/movements", dependencies=[Depends(require_role(*INV_ROLES, "finance", "management"))])
def list_movements(
    location_id: UUID | None = None,
    product_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(StockMovement)
    if location_id:
        query = query.filter(StockMovement.location_id == location_id)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    rows = query.order_by(StockMovement.occurred_at.desc(), StockMovement.id).offset(offset).limit(limit).all()
    return [{"id": str(row.id), "location_id": str(row.location_id), "product_id": str(row.product_id),
             "order_id": str(row.order_id) if row.order_id else None, "movement_type": row.movement_type,
             "quantity_delta": str(row.quantity_delta), "occurred_at": row.occurred_at.isoformat(), "notes": row.notes}
            for row in rows]


@router.post("/reservations", status_code=201, dependencies=[Depends(require_role(*INV_ROLES, "sales_manager"))])
def create_reservation(payload: ReservationCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    line = session.query(OrderLine).filter_by(id=payload.order_line_id).with_for_update().first()
    if line is None or line.order_id != payload.order_id or line.product_id != payload.product_id:
        raise HTTPException(status_code=409, detail="Order line, order, and product must match")
    balance = session.query(InventoryBalance).filter_by(location_id=payload.location_id, product_id=payload.product_id).with_for_update().first()
    if balance is None:
        raise HTTPException(status_code=409, detail="No inventory balance exists for this location and product")
    reserved = session.query(func.coalesce(func.sum(StockReservation.quantity - StockReservation.quantity_consumed), 0)).filter(
        StockReservation.location_id == payload.location_id,
        StockReservation.product_id == payload.product_id,
        StockReservation.status == "active",
    ).scalar() or Decimal("0")
    if balance.quantity_on_hand - reserved < payload.quantity:
        raise HTTPException(status_code=409, detail="Insufficient unreserved stock")
    reservation = StockReservation(
        location_id=payload.location_id, order_id=payload.order_id,
        order_line_id=payload.order_line_id, product_id=payload.product_id,
        quantity=payload.quantity, quantity_consumed=Decimal("0"), status="active",
    )
    session.add(reservation)
    try:
        session.commit()
        session.refresh(reservation)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Reservation does not match an inventory balance or order line") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Stock reservation could not be created") from exc
    return {"id": str(reservation.id), "status": reservation.status, "quantity": str(reservation.quantity)}


@router.post("/reservations/{reservation_id}/release", dependencies=[Depends(require_role(*INV_ROLES, "sales_manager"))])
def release_reservation(reservation_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    reservation = session.query(StockReservation).filter_by(id=reservation_id).with_for_update().first()
    if reservation is None:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status != "active":
        raise HTTPException(status_code=409, detail="Only active reservations can be released")
    reservation.status = "released"
    reservation.released_at = datetime.now(timezone.utc)
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Reservation could not be released") from exc
    return {"id": str(reservation.id), "status": reservation.status, "released_at": reservation.released_at.isoformat()}
