"""Quotation and BOM generation API endpoints."""

from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Quotation, SiteSurvey

router = APIRouter(prefix="/quotations", tags=["Quotations"])


class QuotationCreateRequest(BaseModel):
    enquiry_id: str
    survey_id: str
    system_capacity_kw: float | Decimal
    system_type: str = Field(..., pattern="^(on-grid|off-grid)$")
    total_amount: float | Decimal
    bom_details: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_quotation(payload: QuotationCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    # Enforce rule: Final quotation requires approved survey
    survey = session.get(SiteSurvey, payload.survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Site survey not found")
    if survey.status != "approved":
        raise HTTPException(status_code=400, detail="Final quotation requires an approved site survey")

    quotation = Quotation(
        enquiry_id=payload.enquiry_id,
        survey_id=payload.survey_id,
        system_capacity_kw=Decimal(str(payload.system_capacity_kw)),
        system_type=payload.system_type,
        total_amount=Decimal(str(payload.total_amount)),
        status="approved",
        bom_details=payload.bom_details or "Standard Solar BOM: Panels, Inverter, Mounting Structure, DC/AC Cables",
    )
    session.add(quotation)
    session.commit()
    session.refresh(quotation)
    return {"success": True, "message": "Quotation generated successfully from approved survey", "id": str(quotation.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_quotations(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    quotes = session.query(Quotation).all()
    return [{
        "id": str(q.id),
        "enquiry_id": str(q.enquiry_id),
        "system_capacity_kw": float(q.system_capacity_kw),
        "system_type": q.system_type,
        "total_amount": float(q.total_amount),
        "status": q.status,
    } for q in quotes]
