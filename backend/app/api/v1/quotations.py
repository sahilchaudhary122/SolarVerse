"""Canonical quotation snapshots and line-item APIs."""

from datetime import date
from decimal import Decimal
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

Quotation = MODEL_CLASSES["quotation"]
QuotationLine = MODEL_CLASSES["quotation_line"]
Enquiry = MODEL_CLASSES["enquiry"]
SiteSurvey = MODEL_CLASSES["site_survey"]
Product = MODEL_CLASSES["product"]
SolarPackage = MODEL_CLASSES["solar_package"]
router = APIRouter(prefix="/quotations", tags=["Quotations"])


class QuotationLineInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: UUID | None = None
    description_snapshot: str = Field(min_length=1)
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)
    unit_price: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    line_total: Decimal = Field(ge=0, max_digits=14, decimal_places=2)


class QuotationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enquiry_id: UUID
    survey_id: UUID
    package_id: UUID | None = None
    valid_until: date | None = None
    currency_code: str = Field(min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")
    subtotal_amount: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=14, decimal_places=2)
    total_amount: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    lines: list[QuotationLineInput] = Field(min_length=1, max_length=100)


class QuotationStatusRequest(BaseModel):
    status: str = Field(min_length=1, max_length=24)


def _line(line: Any) -> dict[str, Any]:
    return {"id": str(line.id), "product_id": str(line.product_id) if line.product_id else None,
            "description_snapshot": line.description_snapshot, "quantity": str(line.quantity),
            "unit_price": str(line.unit_price), "discount_amount": str(line.discount_amount),
            "tax_amount": str(line.tax_amount), "line_total": str(line.line_total)}


def _quote(quote: Any, lines: list[Any] | None = None) -> dict[str, Any]:
    result = {"id": str(quote.id), "enquiry_id": str(quote.enquiry_id), "survey_id": str(quote.survey_id),
              "package_id": str(quote.package_id) if quote.package_id else None, "version": quote.version,
              "status": quote.status, "created_at": quote.created_at.isoformat() if quote.created_at else None,
              "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
              "currency_code": quote.currency_code, "subtotal_amount": str(quote.subtotal_amount),
              "discount_amount": str(quote.discount_amount), "tax_amount": str(quote.tax_amount),
              "total_amount": str(quote.total_amount)}
    if lines is not None:
        result["lines"] = [_line(line) for line in lines]
    return result


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "sales", "sales_manager"))])
def create_quotation(payload: QuotationCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    enquiry = session.get(Enquiry, payload.enquiry_id)
    survey = session.get(SiteSurvey, payload.survey_id)
    if enquiry is None or survey is None:
        raise HTTPException(status_code=404, detail="Enquiry or survey not found")
    if survey.enquiry_id != enquiry.id or survey.site_id != enquiry.site_id:
        raise HTTPException(status_code=409, detail="Survey does not belong to the enquiry's site")
    if survey.status != "approved" or not survey.is_current:
        raise HTTPException(status_code=409, detail="Quotation requires the current approved survey")
    if payload.package_id and session.get(SolarPackage, payload.package_id) is None:
        raise HTTPException(status_code=404, detail="Solar package not found")
    for item in payload.lines:
        if item.product_id and session.get(Product, item.product_id) is None:
            raise HTTPException(status_code=404, detail="Quotation product not found")

    current_version = session.query(func.max(Quotation.version)).filter_by(enquiry_id=enquiry.id).scalar() or 0
    quote = Quotation(
        enquiry_id=enquiry.id,
        survey_id=survey.id,
        package_id=payload.package_id,
        version=current_version + 1,
        status="draft",
        valid_until=payload.valid_until,
        currency_code=payload.currency_code.upper(),
        subtotal_amount=payload.subtotal_amount,
        discount_amount=payload.discount_amount,
        tax_amount=payload.tax_amount,
        total_amount=payload.total_amount,
    )
    session.add(quote)
    try:
        session.flush()
        for item in payload.lines:
            session.add(QuotationLine(quotation_id=quote.id, **item.model_dump()))
        session.commit()
        session.refresh(quote)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Quotation version or line item conflicts with existing data") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Quotation could not be created") from exc
    lines = session.query(QuotationLine).filter_by(quotation_id=quote.id).order_by(QuotationLine.id).all()
    return _quote(quote, lines)


@router.get("", response_model=list[dict[str, Any]], dependencies=[Depends(require_role("system_admin", "sales", "sales_manager", "management"))])
def list_quotations(
    status_filter: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(Quotation)
    if status_filter:
        query = query.filter(Quotation.status == status_filter)
    rows = query.order_by(Quotation.created_at.desc(), Quotation.id).offset(offset).limit(limit).all()
    return [_quote(row) for row in rows]


@router.get("/{quotation_id}", dependencies=[Depends(require_role("system_admin", "sales", "sales_manager", "management"))])
def get_quotation(quotation_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    quote = session.get(Quotation, quotation_id)
    if quote is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    lines = session.query(QuotationLine).filter_by(quotation_id=quote.id).order_by(QuotationLine.id).all()
    return _quote(quote, lines)


@router.post("/{quotation_id}/approve", dependencies=[Depends(require_role("system_admin", "sales_manager"))])
def approve_quotation(quotation_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    quote = session.query(Quotation).filter_by(id=quotation_id).with_for_update().first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    survey = session.get(SiteSurvey, quote.survey_id)
    if survey is None or survey.status != "approved" or not survey.is_current:
        raise HTTPException(status_code=409, detail="Quotation survey must remain current and approved")
    quote.status = "approved"
    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Quotation could not be approved") from exc
    return {"id": str(quote.id), "status": quote.status}
