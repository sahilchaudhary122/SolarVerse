"""Read-only customer portal views derived from canonical ownership paths."""

from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Customer = MODEL_CLASSES["customer"]
Site = MODEL_CLASSES["site"]
Enquiry = MODEL_CLASSES["enquiry"]
Survey = MODEL_CLASSES["site_survey"]
Quotation = MODEL_CLASSES["quotation"]
QuotationLine = MODEL_CLASSES["quotation_line"]
SalesOrder = MODEL_CLASSES["sales_order"]
OrderLine = MODEL_CLASSES["order_line"]
Installation = MODEL_CLASSES["installation"]
InstallationTechnician = MODEL_CLASSES["installation_technician"]
Technician = MODEL_CLASSES["technician"]
ChecklistItem = MODEL_CLASSES["installation_checklist_item"]
EquipmentUnit = MODEL_CLASSES["equipment_unit"]
DispatchItem = MODEL_CLASSES["dispatch_item"]
Dispatch = MODEL_CLASSES["dispatch"]
Product = MODEL_CLASSES["product"]
Warranty = MODEL_CLASSES["warranty"]
Ticket = MODEL_CLASSES["service_ticket"]

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"], dependencies=[Depends(require_role("customer"))])


def _owner(session: Session, user: Any) -> Any:
    matches = session.query(Customer).filter(
        func.lower(func.trim(Customer.email)) == user.email_normalized
    ).limit(2).all()
    if len(matches) != 1:
        raise HTTPException(status_code=403, detail="Customer account does not map to exactly one customer record")
    return matches[0]


def _date(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


def _quotation_out(quote: Any, lines: list[Any] | None = None) -> dict[str, Any]:
    result = {
        "id": str(quote.id), "enquiry_id": str(quote.enquiry_id), "survey_id": str(quote.survey_id),
        "package_id": str(quote.package_id) if quote.package_id else None,
        "version": quote.version, "status": quote.status, "created_at": _date(quote.created_at),
        "valid_until": _date(quote.valid_until), "currency_code": quote.currency_code,
        "subtotal_amount": str(quote.subtotal_amount), "discount_amount": str(quote.discount_amount),
        "tax_amount": str(quote.tax_amount), "total_amount": str(quote.total_amount),
    }
    if lines is not None:
        result["lines"] = [{
            "id": str(line.id), "product_id": str(line.product_id) if line.product_id else None,
            "description_snapshot": line.description_snapshot, "quantity": str(line.quantity),
            "unit_price": str(line.unit_price), "discount_amount": str(line.discount_amount),
            "tax_amount": str(line.tax_amount), "line_total": str(line.line_total),
        } for line in lines]
    return result


def _owned_order_query(session: Session, customer_id: UUID):
    return session.query(SalesOrder).join(Quotation, Quotation.id == SalesOrder.quotation_id).join(
        Enquiry, Enquiry.id == Quotation.enquiry_id
    ).filter(Enquiry.customer_id == customer_id)


def _order_out(session: Session, order: Any, detail: bool = False) -> dict[str, Any]:
    quote = session.get(Quotation, order.quotation_id)
    enquiry = session.get(Enquiry, quote.enquiry_id) if quote else None
    site = session.get(Site, enquiry.site_id) if enquiry else None
    result = {
        "id": str(order.id), "quotation_id": str(order.quotation_id), "status": order.status,
        "currency_code": order.currency_code, "subtotal_amount": str(order.subtotal_amount),
        "discount_amount": str(order.discount_amount), "tax_amount": str(order.tax_amount),
        "total_amount": str(order.total_amount), "created_at": _date(order.created_at),
        "confirmed_at": _date(order.confirmed_at),
        "site": ({"id": str(site.id), "label": site.label, "address_line": site.address_line,
                  "city": site.city, "state": site.state, "postal_code": site.postal_code} if site else None),
    }
    if detail:
        lines = session.query(OrderLine).filter_by(order_id=order.id).order_by(OrderLine.id).all()
        result["lines"] = [{
            "id": str(line.id), "source_quotation_line_id": str(line.source_quotation_line_id) if line.source_quotation_line_id else None,
            "product_id": str(line.product_id) if line.product_id else None,
            "description_snapshot": line.description_snapshot, "quantity": str(line.quantity),
            "unit_price": str(line.unit_price), "discount_amount": str(line.discount_amount),
            "tax_amount": str(line.tax_amount), "line_total": str(line.line_total),
        } for line in lines]
    return result


def _owned_installation_query(session: Session, customer_id: UUID):
    owned_order_ids = _owned_order_query(session, customer_id).with_entities(SalesOrder.id)
    return session.query(Installation).join(Site, Site.id == Installation.site_id).filter(
        Site.customer_id == customer_id,
        or_(Installation.order_id.is_(None), Installation.order_id.in_(owned_order_ids)),
    )


def _installation_out(session: Session, row: Any) -> dict[str, Any]:
    technicians = session.query(Technician.name).join(
        InstallationTechnician, InstallationTechnician.technician_id == Technician.id
    ).filter(InstallationTechnician.installation_id == row.id).order_by(Technician.name).all()
    checklist = session.query(
        func.count(ChecklistItem.id),
        func.count(ChecklistItem.id).filter(ChecklistItem.is_completed.is_(True)),
    ).filter(ChecklistItem.installation_id == row.id).one()
    return {
        "id": str(row.id), "order_id": str(row.order_id) if row.order_id else None,
        "site_id": str(row.site_id), "status": row.status, "scheduled_at": _date(row.scheduled_at),
        "started_at": _date(row.started_at), "completed_at": _date(row.completed_at),
        "customer_signed_off_at": _date(row.customer_signed_off_at),
        "technicians": [{"name": name} for (name,) in technicians],
        "checklist_summary": {"total": checklist[0], "completed": checklist[1]},
    }


def _owned_equipment_query(session: Session, customer_id: UUID):
    return session.query(EquipmentUnit, Dispatch.status).join(
        DispatchItem, DispatchItem.id == EquipmentUnit.dispatch_item_id
    ).join(Dispatch, Dispatch.id == DispatchItem.dispatch_id).join(
        SalesOrder, SalesOrder.id == DispatchItem.order_id
    ).join(Quotation, Quotation.id == SalesOrder.quotation_id).join(
        Enquiry, Enquiry.id == Quotation.enquiry_id
    ).filter(Enquiry.customer_id == customer_id)


def _equipment_out(session: Session, unit: Any, dispatch_status: str) -> dict[str, Any]:
    product = session.get(Product, unit.product_id)
    return {
        "id": str(unit.id), "serial_number": unit.serial_number, "product_id": str(unit.product_id),
        "product_name": product.name if product else None,
        "dispatch_status": dispatch_status,
    }


@router.get("/dashboard")
def customer_dashboard(session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> dict[str, int]:
    customer = _owner(session, user)
    quote_ids = session.query(Quotation.id).join(Enquiry).filter(Enquiry.customer_id == customer.id)
    order_ids = _owned_order_query(session, customer.id).with_entities(SalesOrder.id)
    installation_ids = _owned_installation_query(session, customer.id).with_entities(Installation.id)
    equipment_ids = _owned_equipment_query(session, customer.id).with_entities(EquipmentUnit.id)
    warranty_count = session.query(func.count(Warranty.id)).join(
        EquipmentUnit, EquipmentUnit.id == Warranty.equipment_unit_id
    ).filter(EquipmentUnit.id.in_(equipment_ids)).scalar()
    return {
        "enquiries": session.query(func.count(Enquiry.id)).filter_by(customer_id=customer.id).scalar(),
        "active_enquiries": session.query(func.count(Enquiry.id)).filter(
            Enquiry.customer_id == customer.id, Enquiry.status.notin_(("converted", "lost", "cancelled"))
        ).scalar(),
        "quotations": session.query(func.count(Quotation.id)).filter(Quotation.id.in_(quote_ids)).scalar(),
        "orders": session.query(func.count(SalesOrder.id)).filter(SalesOrder.id.in_(order_ids)).scalar(),
        "installations": session.query(func.count(Installation.id)).filter(Installation.id.in_(installation_ids)).scalar(),
        "equipment": session.query(func.count(EquipmentUnit.id)).filter(EquipmentUnit.id.in_(equipment_ids)).scalar(),
        "warranties": warranty_count,
        "service_tickets": session.query(func.count(Ticket.id)).filter_by(customer_id=customer.id).scalar(),
    }


@router.get("/quotations")
def list_customer_quotations(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100),
                             session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    customer = _owner(session, user)
    rows = session.query(Quotation).join(Enquiry, Enquiry.id == Quotation.enquiry_id).filter(
        Enquiry.customer_id == customer.id
    ).order_by(Quotation.created_at.desc(), Quotation.id).offset(offset).limit(limit).all()
    return [_quotation_out(row) for row in rows]


@router.get("/quotations/{quotation_id}")
def get_customer_quotation(quotation_id: UUID, session: Session = Depends(get_db_session),
                           user: Any = Depends(require_role("customer"))) -> dict[str, Any]:
    customer = _owner(session, user)
    quote = session.query(Quotation).join(Enquiry, Enquiry.id == Quotation.enquiry_id).filter(
        Quotation.id == quotation_id, Enquiry.customer_id == customer.id
    ).first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    lines = session.query(QuotationLine).filter_by(quotation_id=quote.id).order_by(QuotationLine.id).all()
    return _quotation_out(quote, lines)


@router.get("/orders")
def list_customer_orders(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100),
                         session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    customer = _owner(session, user)
    rows = _owned_order_query(session, customer.id).order_by(SalesOrder.created_at.desc(), SalesOrder.id).offset(offset).limit(limit).all()
    return [_order_out(session, row) for row in rows]


@router.get("/orders/{order_id}")
def get_customer_order(order_id: UUID, session: Session = Depends(get_db_session),
                       user: Any = Depends(require_role("customer"))) -> dict[str, Any]:
    customer = _owner(session, user)
    row = _owned_order_query(session, customer.id).filter(SalesOrder.id == order_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return _order_out(session, row, True)


@router.get("/installations")
def list_customer_installations(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100),
                                session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    customer = _owner(session, user)
    rows = _owned_installation_query(session, customer.id).order_by(Installation.created_at.desc(), Installation.id).offset(offset).limit(limit).all()
    return [_installation_out(session, row) for row in rows]


@router.get("/installations/{installation_id}")
def get_customer_installation(installation_id: UUID, session: Session = Depends(get_db_session),
                              user: Any = Depends(require_role("customer"))) -> dict[str, Any]:
    customer = _owner(session, user)
    row = _owned_installation_query(session, customer.id).filter(Installation.id == installation_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Installation not found")
    return _installation_out(session, row)


@router.get("/equipment")
def list_customer_equipment(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100),
                            session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    customer = _owner(session, user)
    rows = _owned_equipment_query(session, customer.id).order_by(EquipmentUnit.created_at.desc(), EquipmentUnit.id).offset(offset).limit(limit).all()
    return [_equipment_out(session, unit, status) for unit, status in rows]


@router.get("/equipment/{equipment_id}")
def get_customer_equipment(equipment_id: UUID, session: Session = Depends(get_db_session),
                           user: Any = Depends(require_role("customer"))) -> dict[str, Any]:
    customer = _owner(session, user)
    row = _owned_equipment_query(session, customer.id).filter(EquipmentUnit.id == equipment_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Equipment unit not found")
    return _equipment_out(session, row[0], row[1])


@router.get("/warranties")
def list_customer_warranties(offset: int = Query(default=0, ge=0), limit: int = Query(default=50, ge=1, le=100),
                             session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    customer = _owner(session, user)
    rows = session.query(Warranty, EquipmentUnit, Dispatch.status).join(
        EquipmentUnit, EquipmentUnit.id == Warranty.equipment_unit_id
    ).join(DispatchItem, DispatchItem.id == EquipmentUnit.dispatch_item_id).join(
        Dispatch, Dispatch.id == DispatchItem.dispatch_id
    ).join(SalesOrder, SalesOrder.id == DispatchItem.order_id).join(
        Quotation, Quotation.id == SalesOrder.quotation_id
    ).join(Enquiry, Enquiry.id == Quotation.enquiry_id).filter(
        Enquiry.customer_id == customer.id
    ).order_by(Warranty.starts_on.desc(), Warranty.id).offset(offset).limit(limit).all()
    today = date.today()
    return [{
        "id": str(w.id), "equipment_unit_id": str(unit.id), "serial_number": unit.serial_number,
        "starts_on": _date(w.starts_on), "ends_on": _date(w.ends_on),
        "valid_now": w.starts_on <= today <= w.ends_on, "terms": w.terms,
        "equipment_status": dispatch_status,
    } for w, unit, dispatch_status in rows]


@router.get("/warranties/{warranty_id}")
def get_customer_warranty(warranty_id: UUID, session: Session = Depends(get_db_session),
                          user: Any = Depends(require_role("customer"))) -> dict[str, Any]:
    customer = _owner(session, user)
    row = session.query(Warranty, EquipmentUnit, Dispatch.status).join(
        EquipmentUnit, EquipmentUnit.id == Warranty.equipment_unit_id
    ).join(DispatchItem, DispatchItem.id == EquipmentUnit.dispatch_item_id).join(
        Dispatch, Dispatch.id == DispatchItem.dispatch_id
    ).join(SalesOrder, SalesOrder.id == DispatchItem.order_id).join(
        Quotation, Quotation.id == SalesOrder.quotation_id
    ).join(Enquiry, Enquiry.id == Quotation.enquiry_id).filter(
        Enquiry.customer_id == customer.id, Warranty.id == warranty_id
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Warranty not found")
    w, unit, dispatch_status = row
    today = date.today()
    return {"id": str(w.id), "equipment_unit_id": str(unit.id), "serial_number": unit.serial_number,
            "starts_on": _date(w.starts_on), "ends_on": _date(w.ends_on),
            "valid_now": w.starts_on <= today <= w.ends_on, "terms": w.terms,
            "equipment_status": dispatch_status}


@router.get("/documents")
def customer_documents(session: Session = Depends(get_db_session), user: Any = Depends(require_role("customer"))) -> list[dict[str, Any]]:
    _owner(session, user)
    # file_asset has no visibility/share flag or customer-safe storage contract.
    # Returning empty metadata is safer than exposing internal filenames or keys.
    raise HTTPException(status_code=409, detail="Customer document sharing is not configured; file records contain internal metadata only")
