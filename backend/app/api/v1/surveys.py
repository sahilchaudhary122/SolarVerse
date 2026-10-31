"""Site survey and approval API endpoints."""

from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import SiteSurvey, Site

router = APIRouter(prefix="/surveys", tags=["Site Surveys"])


class SurveyCreateRequest(BaseModel):
    site_id: str
    enquiry_id: str | None = None
    roof_area_sqft: float | Decimal | None = None
    roof_type: str | None = None
    tilt_angle: float | Decimal | None = None
    shadow_free_area_sqft: float | Decimal | None = None
    monthly_bill: float | Decimal | None = None
    cable_distance_meters: float | Decimal | None = None
    grid_suitability: str | None = None


class SurveyReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    reviewer_notes: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_survey(payload: SurveyCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    survey = SiteSurvey(
        site_id=payload.site_id,
        enquiry_id=payload.enquiry_id,
        roof_area_sqft=Decimal(str(payload.roof_area_sqft)) if payload.roof_area_sqft else None,
        roof_type=payload.roof_type,
        tilt_angle=Decimal(str(payload.tilt_angle)) if payload.tilt_angle else None,
        shadow_free_area_sqft=Decimal(str(payload.shadow_free_area_sqft)) if payload.shadow_free_area_sqft else None,
        monthly_bill=Decimal(str(payload.monthly_bill)) if payload.monthly_bill else None,
        cable_distance_meters=Decimal(str(payload.cable_distance_meters)) if payload.cable_distance_meters else None,
        grid_suitability=payload.grid_suitability,
        status="pending",
    )
    session.add(survey)
    session.commit()
    session.refresh(survey)
    return {"success": True, "message": "Site survey created successfully", "id": str(survey.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_surveys(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    surveys = session.query(SiteSurvey).all()
    return [{
        "id": str(s.id),
        "site_id": str(s.site_id),
        "status": s.status,
        "roof_area_sqft": float(s.roof_area_sqft) if s.roof_area_sqft else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    } for s in surveys]


@router.post("/{survey_id}/review")
def review_survey(survey_id: str, payload: SurveyReviewRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    survey = session.get(SiteSurvey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey.status = payload.status
    survey.reviewer_notes = payload.reviewer_notes
    session.commit()
    return {"success": True, "message": f"Survey {payload.status} successfully", "id": str(survey.id)}
