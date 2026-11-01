"""Payment and refund ledger records; no payment provider is integrated."""

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

Payment = MODEL_CLASSES["payment"]
Refund = MODEL_CLASSES["payment_refund"]
Order = MODEL_CLASSES["sales_order"]
router = APIRouter(prefix="/payments", tags=["Payments"])
ROLES = ("system_admin", "finance")


class PaymentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_id: UUID
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    currency_code: str = Field(min_length=3, max_length=3)
    status: str = Field(min_length=1, max_length=20)
    external_reference: str | None = Field(default=None, max_length=160)
    paid_at: datetime | None = None


class RefundCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    status: str = Field(min_length=1, max_length=20)
    reason: str | None = None
    external_reference: str | None = Field(default=None, max_length=160)
    refunded_at: datetime | None = None


@router.post("", status_code=201, dependencies=[Depends(require_role(*ROLES))])
def create_payment(payload: PaymentCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    if session.get(Order, payload.order_id) is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    row = Payment(order_id=payload.order_id, amount=payload.amount, currency_code=payload.currency_code.upper(),
                  status=payload.status.strip(), external_reference=payload.external_reference, paid_at=payload.paid_at)
    session.add(row)
    try:
        session.commit(); session.refresh(row)
    except (IntegrityError, SQLAlchemyError) as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Payment record violates canonical constraints") from exc
    return {"id": str(row.id), "order_id": str(row.order_id), "amount": str(row.amount), "currency_code": row.currency_code,
            "status": row.status, "external_reference": row.external_reference, "paid_at": row.paid_at.isoformat() if row.paid_at else None}


@router.get("", dependencies=[Depends(require_role(*ROLES, "management"))])
def list_payments(order_id: UUID | None = None, offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=200),
                  session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    query = session.query(Payment)
    if order_id: query = query.filter(Payment.order_id == order_id)
    return [{"id": str(x.id), "order_id": str(x.order_id), "amount": str(x.amount), "currency_code": x.currency_code,
             "status": x.status, "external_reference": x.external_reference, "paid_at": x.paid_at.isoformat() if x.paid_at else None}
            for x in query.order_by(Payment.created_at.desc(), Payment.id).offset(offset).limit(limit).all()]


@router.post("/{payment_id}/refunds", status_code=201, dependencies=[Depends(require_role(*ROLES))])
def create_refund(payment_id: UUID, payload: RefundCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    if session.get(Payment, payment_id) is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    row = Refund(payment_id=payment_id, amount=payload.amount, status=payload.status.strip(), reason=payload.reason,
                 external_reference=payload.external_reference, refunded_at=payload.refunded_at)
    session.add(row)
    try:
        session.commit(); session.refresh(row)
    except (IntegrityError, SQLAlchemyError) as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Refund record violates canonical constraints") from exc
    return {"id": str(row.id), "payment_id": str(row.payment_id), "amount": str(row.amount), "status": row.status,
            "reason": row.reason, "external_reference": row.external_reference,
            "refunded_at": row.refunded_at.isoformat() if row.refunded_at else None}
