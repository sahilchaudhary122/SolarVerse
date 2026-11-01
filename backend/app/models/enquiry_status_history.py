"""Append-only enquiry status transition history."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EnquiryStatusHistory(Base):
    __tablename__ = "enquiry_status_history"
    __table_args__ = (
        CheckConstraint(
            "from_status IS NULL OR from_status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')",
            name="ck_enquiry_history_from_status",
        ),
        CheckConstraint(
            "to_status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')",
            name="ck_enquiry_history_to_status",
        ),
        Index("ix_enquiry_history_enquiry_time", "enquiry_id", "changed_at"),
        {"schema": "solarverse_legacy"})

    id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    enquiry_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("solarverse_legacy.enquiry.id", ondelete="RESTRICT", name="fk_enquiry_history_enquiry"), nullable=False
    )
    from_status: Mapped[str | None] = mapped_column(String(24), nullable=True)
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
