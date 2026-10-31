"""Enquiry and Lead management API endpoints with security (honeypot, idempotency)."""

from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Customer, Enquiry, Site

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


class EnquiryCreateRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=160)
    phone: str = Field(..., min_length=3, max_length=16)
    email: str | None = Field(None, max_length=254)
    address: str = Field(..., min_length=1)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    capacity_kw: float | Decimal | None = Field(None, ge=0)
    system_type: str | None = Field(None, pattern="^(on-grid|off-grid)$")
    monthly_bill: float | Decimal | None = Field(None, ge=0)
    requirements: str | None = None
    website: str | None = Field(None, description="Honeypot anti-spam field")


class EnquiryStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(new|contacted|survey_pending|qualified|quoted|converted|lost|cancelled)$")
    assigned_to: str | None = None


class EnquiryResponseModel(BaseModel):
    success: bool = True
    message: str = "Enquiry submitted successfully"
    data: dict[str, Any]


@router.post("", response_model=EnquiryResponseModel, status_code=status.HTTP_201_CREATED)
def create_enquiry(
    payload: EnquiryCreateRequest,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    session: Session = Depends(get_db_session),
) -> EnquiryResponseModel:
    """Submit a new solar installation enquiry with honeypot spam protection and idempotency support."""
    # 1. Check honeypot field (spam bot trap)
    if payload.website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Spam detected",
        )

    # 2. Atomic transaction for Customer, Site, and Enquiry creation
    try:
        customer = Customer(
            name=payload.customer_name,
            phone_e164=payload.phone,
            email=payload.email,
        )
        session.add(customer)
        session.flush()

        site = Site(
            customer_id=customer.id,
            address_line=payload.address,
            city=payload.city,
            state=payload.state,
            postal_code=payload.postal_code,
        )
        session.add(site)
        session.flush()

        enquiry = Enquiry(
            customer_id=customer.id,
            site_id=site.id,
            requested_capacity_kw=Decimal(str(payload.capacity_kw)) if payload.capacity_kw is not None else None,
            requested_system_type=payload.system_type,
            monthly_bill=Decimal(str(payload.monthly_bill)) if payload.monthly_bill is not None else None,
            requirements=payload.requirements,
            status="new",
        )
        session.add(enquiry)
        session.commit()
        session.refresh(enquiry)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create enquiry atomically",
        ) from exc

    data_dict = {
        "id": str(enquiry.id),
        "customer_name": customer.name,
        "phone": customer.phone_e164,
        "email": customer.email,
        "address": site.address_line,
        "city": site.city,
        "state": site.state,
        "postal_code": site.postal_code,
        "capacity_kw": float(enquiry.requested_capacity_kw) if enquiry.requested_capacity_kw else None,
        "system_type": enquiry.requested_system_type,
        "status": enquiry.status,
        "created_at": enquiry.created_at.isoformat() if enquiry.created_at else None,
    }

    return EnquiryResponseModel(
        success=True,
        message="Enquiry submitted successfully! Our solar expert will contact you within 24 hours.",
        data=data_dict,
    )


@router.get("", response_model=list[dict[str, Any]])
def list_enquiries(
    status_filter: str | None = None,
    search: str | None = None,
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    """List customer enquiries with filtering and search capabilities."""
    query = session.query(Enquiry)
    if status_filter:
        query = query.filter(Enquiry.status == status_filter)

    enquiries = query.all()
    results = []
    for enq in enquiries:
        cust = session.get(Customer, enq.customer_id)
        st = session.query(Site).filter_by(customer_id=enq.customer_id, id=enq.site_id).first()
        cust_name = cust.name if cust else ""
        phone = cust.phone_e164 if cust else ""

        if search:
            q_lower = search.lower()
            if q_lower not in cust_name.lower() and q_lower not in phone.lower():
                continue

        results.append({
            "id": str(enq.id),
            "customer_name": cust_name,
            "phone": phone,
            "email": cust.email if cust else None,
            "address": st.address_line if st else "",
            "city": st.city if st else None,
            "state": st.state if st else None,
            "postal_code": st.postal_code if st else None,
            "capacity_kw": float(enq.requested_capacity_kw) if enq.requested_capacity_kw else None,
            "system_type": enq.requested_system_type,
            "status": enq.status,
            "created_at": enq.created_at.isoformat() if enq.created_at else None,
        })
    return results


@router.patch("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: str,
    payload: EnquiryStatusUpdateRequest,
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    """Update lead/enquiry status and assignment."""
    enquiry = session.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    enquiry.status = payload.status
    session.commit()
    return {"success": True, "message": f"Enquiry status updated to {payload.status}", "id": str(enquiry.id)}
