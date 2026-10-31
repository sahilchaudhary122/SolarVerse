"""Quotation and Bill of Materials models."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Quotation(Base):
    """Customer quotation generated from an approved site survey."""

    __tablename__ = "quotation"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    enquiry_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("enquiry.id", ondelete="RESTRICT"),
        nullable=False,
    )
    survey_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("site_survey.id", ondelete="RESTRICT"),
        nullable=False,
    )
    system_capacity_kw: Mapped[Decimal] = mapped_column(Numeric(8, 3), nullable=False)
    system_type: Mapped[str] = mapped_column(String(20), nullable=False)  # on-grid, off-grid
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="draft", server_default=text("'draft'"))
    bom_details: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or text BOM components
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
