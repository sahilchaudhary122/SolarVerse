"""Dashboard metrics aggregated exclusively from canonical records."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
METRIC_TABLES = {
    "customers": "customer",
    "sites": "site",
    "enquiries": "enquiry",
    "surveys": "site_survey",
    "quotations": "quotation",
    "orders": "sales_order",
    "inventory_locations": "inventory_location",
    "stock_movements": "stock_movement",
    "dispatches": "dispatch",
    "equipment_units": "equipment_unit",
    "installations": "installation",
    "warranties": "warranty",
    "service_tickets": "service_ticket",
    "payments": "payment",
}


@router.get("", response_model=dict[str, Any], dependencies=[Depends(require_role(
    "system_admin", "sales", "sales_manager", "inventory_manager", "technician",
    "service_manager", "finance", "management",
))])
def get_dashboard_stats(session: Session = Depends(get_db_session)) -> dict[str, Any]:
    try:
        counts = {
            metric: session.query(func.count(model.id)).scalar() or 0
            for metric, model in ((key, MODEL_CLASSES[table]) for key, table in METRIC_TABLES.items())
        }
        payment_total = session.query(func.coalesce(func.sum(MODEL_CLASSES["payment"].amount), 0)).scalar()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Dashboard data is temporarily unavailable") from exc
    return {**counts, "payment_amount_recorded": str(payment_total)}
