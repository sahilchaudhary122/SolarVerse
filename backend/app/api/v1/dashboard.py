"""Dashboard analytics API endpoint."""

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Customer, Enquiry, SiteSurvey, Quotation, Order, Installation, SupportTicket

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=dict[str, Any])
def get_dashboard_stats(session: Session = Depends(get_db_session)) -> dict[str, Any]:
    """Retrieve aggregated real statistics for business dashboard."""
    try:
        customers_count = session.query(Customer).count()
        enquiries_count = session.query(Enquiry).count()
        surveys_count = session.query(SiteSurvey).count()
        quotations_count = session.query(Quotation).count()
        orders_count = session.query(Order).count()
        installations_count = session.query(Installation).count()
        tickets_count = session.query(SupportTicket).count()
    except Exception:
        customers_count = 0
        enquiries_count = 0
        surveys_count = 0
        quotations_count = 0
        orders_count = 0
        installations_count = 0
        tickets_count = 0

    return {
        "customers": customers_count,
        "enquiries": enquiries_count,
        "surveys": surveys_count,
        "quotations": quotations_count,
        "orders": orders_count,
        "installations": installations_count,
        "support_tickets": tickets_count,
    }
