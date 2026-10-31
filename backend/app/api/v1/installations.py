"""Installation management API endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Installation

router = APIRouter(prefix="/installations", tags=["Installations"])


class InstallationCreateRequest(BaseModel):
    order_id: str
    assigned_technician_id: str | None = None
    scheduled_date: str | None = None


class InstallationCompleteRequest(BaseModel):
    checklist_completed: bool = True
    evidence_url: str | None = None
    customer_signoff: bool = True


@router.post("", status_code=status.HTTP_201_CREATED)
def create_installation(payload: InstallationCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    inst = Installation(
        order_id=payload.order_id,
        status="scheduled",
        checklist_completed=False,
        customer_signoff=False,
    )
    session.add(inst)
    session.commit()
    session.refresh(inst)
    return {"success": True, "message": "Installation scheduled successfully", "id": str(inst.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_installations(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    insts = session.query(Installation).all()
    return [{
        "id": str(i.id),
        "order_id": str(i.order_id),
        "status": i.status,
        "checklist_completed": i.checklist_completed,
        "customer_signoff": i.customer_signoff,
    } for i in insts]


@router.post("/{installation_id}/complete")
def complete_installation(installation_id: str, payload: InstallationCompleteRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    inst = session.get(Installation, installation_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Installation not found")

    # Enforce rule: Require checklist, evidence and sign-off before installation completion
    if not payload.checklist_completed or not payload.customer_signoff or not payload.evidence_url:
        raise HTTPException(
            status_code=400,
            detail="Installation completion requires checklist completion, evidence upload, and customer sign-off",
        )

    inst.checklist_completed = payload.checklist_completed
    inst.evidence_url = payload.evidence_url
    inst.customer_signoff = payload.customer_signoff
    inst.status = "completed"
    session.commit()
    return {"success": True, "message": "Installation completed successfully", "id": str(inst.id)}
