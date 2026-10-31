"""Customer support and service ticket API endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import SupportTicket

router = APIRouter(prefix="/support/tickets", tags=["Support Tickets"])


class TicketCreateRequest(BaseModel):
    customer_id: str
    subject: str
    description: str


class TicketResolveRequest(BaseModel):
    customer_confirmed_resolution: bool = True


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    ticket = SupportTicket(
        customer_id=payload.customer_id,
        subject=payload.subject,
        description=payload.description,
        status="open",
        customer_confirmed_resolution=False,
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return {"success": True, "message": "Support ticket created successfully", "id": str(ticket.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_tickets(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    tickets = session.query(SupportTicket).all()
    return [{
        "id": str(t.id),
        "customer_id": str(t.customer_id),
        "subject": t.subject,
        "status": t.status,
        "customer_confirmed_resolution": t.customer_confirmed_resolution,
    } for t in tickets]


@router.post("/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, payload: TicketResolveRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    # Enforce rule: Support tickets remain open until customer confirms resolution
    if not payload.customer_confirmed_resolution:
        raise HTTPException(
            status_code=400,
            detail="Support ticket cannot be closed until customer confirms resolution",
        )

    ticket.customer_confirmed_resolution = True
    ticket.status = "resolved"
    session.commit()
    return {"success": True, "message": "Support ticket resolved with customer confirmation", "id": str(ticket.id)}
