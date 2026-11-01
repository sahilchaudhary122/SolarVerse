"""Database file-asset metadata only; this API does not upload or fetch bytes."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Asset = MODEL_CLASSES["file_asset"]
Survey = MODEL_CLASSES["site_survey"]
Installation = MODEL_CLASSES["installation"]
Ticket = MODEL_CLASSES["service_ticket"]
router = APIRouter(prefix="/files", tags=["File Assets"])
ROLES = ("system_admin", "sales_manager", "surveyor", "technician", "service_manager")


class FileAssetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    site_survey_id: UUID | None = None
    installation_id: UUID | None = None
    service_ticket_id: UUID | None = None
    bucket_name: str = Field(min_length=1, max_length=120)
    storage_key: str = Field(min_length=1)
    original_name: str = Field(min_length=1, max_length=255)
    content_type: str | None = Field(default=None, max_length=120)
    size_bytes: int | None = Field(default=None, ge=0)
    checksum_sha256: str | None = Field(default=None, pattern=r"^[0-9a-fA-F]{64}$")

    @model_validator(mode="after")
    def exactly_one_parent(self):
        if sum(value is not None for value in (self.site_survey_id, self.installation_id, self.service_ticket_id)) != 1:
            raise ValueError("Exactly one parent record is required")
        return self


def _out(row: Any) -> dict[str, Any]:
    return {"id": str(row.id), "site_survey_id": str(row.site_survey_id) if row.site_survey_id else None,
            "installation_id": str(row.installation_id) if row.installation_id else None,
            "service_ticket_id": str(row.service_ticket_id) if row.service_ticket_id else None,
            "bucket_name": row.bucket_name, "storage_key": row.storage_key, "original_name": row.original_name,
            "content_type": row.content_type, "size_bytes": row.size_bytes, "checksum_sha256": row.checksum_sha256,
            "uploaded_at": row.uploaded_at.isoformat()}


@router.post("", status_code=201, dependencies=[Depends(require_role(*ROLES))])
def create_asset(payload: FileAssetCreate, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    parents = [payload.site_survey_id, payload.installation_id, payload.service_ticket_id]
    if sum(value is not None for value in parents) != 1:
        raise HTTPException(status_code=422, detail="Exactly one parent record is required")
    if payload.site_survey_id and session.get(Survey, payload.site_survey_id) is None:
        raise HTTPException(status_code=404, detail="Site survey not found")
    if payload.installation_id and session.get(Installation, payload.installation_id) is None:
        raise HTTPException(status_code=404, detail="Installation not found")
    if payload.service_ticket_id and session.get(Ticket, payload.service_ticket_id) is None:
        raise HTTPException(status_code=404, detail="Service ticket not found")
    row = Asset(**payload.model_dump())
    session.add(row)
    try:
        session.commit(); session.refresh(row)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="File metadata conflicts with an existing asset key") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="File metadata could not be recorded") from exc
    return _out(row)


@router.get("", dependencies=[Depends(require_role(*ROLES, "management"))])
def list_assets(site_survey_id: UUID | None = None, installation_id: UUID | None = None,
                service_ticket_id: UUID | None = None, offset: int = Query(default=0, ge=0),
                limit: int = Query(default=50, ge=1, le=200), session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    query = session.query(Asset)
    if site_survey_id: query = query.filter(Asset.site_survey_id == site_survey_id)
    if installation_id: query = query.filter(Asset.installation_id == installation_id)
    if service_ticket_id: query = query.filter(Asset.service_ticket_id == service_ticket_id)
    return [_out(row) for row in query.order_by(Asset.uploaded_at.desc(), Asset.id).offset(offset).limit(limit).all()]
