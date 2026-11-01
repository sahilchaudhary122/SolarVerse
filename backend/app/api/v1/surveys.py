"""Canonical site-survey and append-only review APIs."""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

SiteSurvey = MODEL_CLASSES["site_survey"]
SurveyReview = MODEL_CLASSES["site_survey_review"]
Enquiry = MODEL_CLASSES["enquiry"]
router = APIRouter(prefix="/surveys", tags=["Site Surveys"])
STAFF_ROLES = ("system_admin", "surveyor", "sales", "sales_manager", "management")


class SurveyCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    site_id: UUID
    enquiry_id: UUID
    scheduled_at: datetime | None = None
    roof_area_sqm: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    roof_direction: str | None = Field(default=None, max_length=30)
    roof_tilt_degrees: Decimal | None = Field(default=None, ge=0, le=90, max_digits=5, decimal_places=2)
    shadow_free_area_sqm: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    monthly_bill: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    monthly_bill_currency_code: str | None = Field(default=None, min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")
    cable_distance_m: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    grid_suitability: bool | None = None

    @model_validator(mode="after")
    def currency_pair(self) -> "SurveyCreateRequest":
        if (self.monthly_bill is None) != (self.monthly_bill_currency_code is None):
            raise ValueError("monthly_bill and monthly_bill_currency_code must be provided together")
        if self.monthly_bill_currency_code:
            self.monthly_bill_currency_code = self.monthly_bill_currency_code.upper()
        return self


class SurveyReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(pattern=r"^(approved|rejected)$")
    reviewer_notes: str | None = None
    rejection_reason: str | None = None

    @model_validator(mode="after")
    def rejection_reason_required(self) -> "SurveyReviewRequest":
        if self.status == "rejected" and not (self.rejection_reason or self.reviewer_notes or "").strip():
            raise ValueError("A rejection reason is required")
        return self


def _survey(survey: Any) -> dict[str, Any]:
    fields = ("roof_area_sqm", "roof_tilt_degrees", "shadow_free_area_sqm", "monthly_bill", "cable_distance_m")
    result = {name: str(getattr(survey, name)) if getattr(survey, name) is not None else None for name in fields}
    result.update({
        "id": str(survey.id), "enquiry_id": str(survey.enquiry_id), "site_id": str(survey.site_id),
        "scheduled_at": survey.scheduled_at.isoformat() if survey.scheduled_at else None,
        "roof_direction": survey.roof_direction,
        "monthly_bill_currency_code": survey.monthly_bill_currency_code,
        "grid_suitability": survey.grid_suitability,
        "status": survey.status, "is_current": survey.is_current,
        "submitted_at": survey.submitted_at.isoformat() if survey.submitted_at else None,
        "approved_at": survey.approved_at.isoformat() if survey.approved_at else None,
        "created_at": survey.created_at.isoformat() if survey.created_at else None,
    })
    return result


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "surveyor"))])
def create_survey(payload: SurveyCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    enquiry = session.get(Enquiry, payload.enquiry_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if enquiry.site_id != payload.site_id:
        raise HTTPException(status_code=409, detail="Survey site must match the enquiry site")
    survey = SiteSurvey(
        **payload.model_dump(),
        status="draft",
        is_current=False,
    )
    session.add(survey)
    try:
        session.commit()
        session.refresh(survey)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Survey violates enquiry/site integrity") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Survey could not be created") from exc
    return _survey(survey)


@router.get("", response_model=list[dict[str, Any]])
def list_surveys(
    enquiry_id: UUID | None = None,
    status_filter: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> list[dict[str, Any]]:
    query = session.query(SiteSurvey)
    if user.role == "customer":
        # Resolve ownership through enquiries; app_user intentionally has no customer_id FK.
        Customer = MODEL_CLASSES["customer"]
        owned = session.query(Enquiry.id).join(Customer, Customer.id == Enquiry.customer_id).filter(
            func.lower(func.trim(Customer.email)) == user.email_normalized
        ).subquery()
        query = query.filter(SiteSurvey.enquiry_id.in_(session.query(owned.c.id)))
    elif user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if enquiry_id:
        query = query.filter(SiteSurvey.enquiry_id == enquiry_id)
    if status_filter:
        query = query.filter(SiteSurvey.status == status_filter)
    rows = query.order_by(SiteSurvey.created_at.desc(), SiteSurvey.id).offset(offset).limit(limit).all()
    return [_survey(row) for row in rows]


@router.get("/{survey_id}")
def get_survey(
    survey_id: UUID,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    survey = session.get(SiteSurvey, survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if user.role == "customer":
        EnquiryCustomer = MODEL_CLASSES["enquiry"]
        Customer = MODEL_CLASSES["customer"]
        owner = session.query(Customer.id).join(EnquiryCustomer, EnquiryCustomer.customer_id == Customer.id).filter(
            EnquiryCustomer.id == survey.enquiry_id,
            func.lower(func.trim(Customer.email)) == user.email_normalized,
        ).first()
        if owner is None:
            raise HTTPException(status_code=403, detail="You may only access your surveys")
    elif user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return _survey(survey)


@router.post("/{survey_id}/review", dependencies=[Depends(require_role("system_admin", "surveyor", "sales_manager"))])
def review_survey(
    survey_id: UUID,
    payload: SurveyReviewRequest,
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    survey = session.query(SiteSurvey).filter_by(id=survey_id).with_for_update().first()
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    enquiry = session.query(Enquiry).filter_by(id=survey.enquiry_id).with_for_update().first()
    if enquiry is None or enquiry.site_id != survey.site_id:
        raise HTTPException(status_code=409, detail="Survey no longer matches its enquiry site")
    if payload.status == "approved":
        session.query(SiteSurvey).filter(
            SiteSurvey.enquiry_id == survey.enquiry_id,
            SiteSurvey.id != survey.id,
            SiteSurvey.is_current.is_(True),
        ).update({"is_current": False}, synchronize_session=False)
        survey.is_current = True
        survey.approved_at = func.now()
    else:
        survey.is_current = False
    survey.status = payload.status
    review = SurveyReview(
        survey_id=survey.id,
        reviewer_id=user.id,
        reviewer_label=user.display_name,
        decision=payload.status,
        rejection_reason=payload.rejection_reason or (payload.reviewer_notes if payload.status == "rejected" else None),
        notes=payload.reviewer_notes,
    )
    session.add(review)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Survey review conflicts with the current approval state") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Survey review could not be saved") from exc
    return {"id": str(survey.id), "status": survey.status, "is_current": survey.is_current,
            "review_id": str(review.id), "reviewed_at": review.reviewed_at.isoformat() if review.reviewed_at else None}
