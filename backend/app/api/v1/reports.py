"""Role-scoped operational report summaries from canonical records."""

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Customer = MODEL_CLASSES["customer"]
Enquiry = MODEL_CLASSES["enquiry"]
Quotation = MODEL_CLASSES["quotation"]
SalesOrder = MODEL_CLASSES["sales_order"]
Installation = MODEL_CLASSES["installation"]
InventoryBalance = MODEL_CLASSES["inventory_balance"]
InventoryLocation = MODEL_CLASSES["inventory_location"]
Product = MODEL_CLASSES["product"]
Ticket = MODEL_CLASSES["service_ticket"]
Payment = MODEL_CLASSES["payment"]

router = APIRouter(prefix="/reports", tags=["Reports"])
REPORT_ROLES = {
    "customers": {"system_admin", "sales", "sales_manager", "management", "service_manager", "finance"},
    "enquiries": {"system_admin", "sales", "sales_manager", "management"},
    "quotations": {"system_admin", "sales", "sales_manager", "management"},
    "orders": {"system_admin", "sales", "sales_manager", "finance", "management"},
    "installations": {"system_admin", "sales_manager", "technician", "surveyor", "management"},
    "inventory": {"system_admin", "inventory_manager", "sales_manager", "finance", "management"},
    "service_tickets": {"system_admin", "service_manager", "technician", "sales_manager", "management"},
    "payments": {"system_admin", "finance", "management"},
}


def _bounded(query: Any, column: Any, date_from: date | None, date_to: date | None) -> Any:
    if date_from:
        query = query.filter(column >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
    if date_to:
        query = query.filter(column < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=timezone.utc))
    return query


def _counts(session: Session, model: Any, date_from: date | None, date_to: date | None) -> list[dict[str, Any]]:
    query = session.query(model.status, func.count(model.id)).group_by(model.status).order_by(model.status)
    if hasattr(model, "created_at"):
        query = _bounded(query, model.created_at, date_from, date_to)
    elif hasattr(model, "opened_at"):
        query = _bounded(query, model.opened_at, date_from, date_to)
    return [{"status": status, "count": count} for status, count in query.all()]


@router.get("/summary")
def report_summary(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    session: Session = Depends(get_db_session),
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must be on or before date_to")
    role = user.role.strip().lower()
    if not any(role in allowed for allowed in REPORT_ROLES.values()):
        raise HTTPException(status_code=403, detail="Your role cannot access reports")
    reports: dict[str, Any] = {}
    if "customers" in REPORT_ROLES and role in REPORT_ROLES["customers"]:
        q = session.query(func.count(Customer.id))
        q = _bounded(q, Customer.created_at, date_from, date_to)
        reports["customers"] = {"created_count": q.scalar()}
    for key, model in (("enquiries", Enquiry), ("quotations", Quotation), ("orders", SalesOrder),
                       ("installations", Installation), ("service_tickets", Ticket), ("payments", Payment)):
        if role in REPORT_ROLES[key]:
            reports[key] = {"by_status": _counts(session, model, date_from, date_to)}
    if role in REPORT_ROLES["inventory"]:
        rows = session.query(InventoryLocation.name, Product.name, InventoryBalance.quantity_on_hand).join(
            InventoryBalance, InventoryBalance.location_id == InventoryLocation.id
        ).join(Product, Product.id == InventoryBalance.product_id).order_by(
            InventoryLocation.name, Product.name
        ).all()
        reports["inventory"] = {"balances": [{
            "location": location, "product": product, "quantity_on_hand": str(quantity),
        } for location, product, quantity in rows]}
    return {"period": {"date_from": date_from.isoformat() if date_from else None,
                        "date_to": date_to.isoformat() if date_to else None}, "reports": reports}
