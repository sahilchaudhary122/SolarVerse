"""Site Survey model."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SiteSurvey(Base):
    """Site survey record conducted at a customer site."""

    __tablename__ = "site_survey"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    site_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("site.id", ondelete="RESTRICT"),
        nullable=False,
    )
    enquiry_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("enquiry.id", ondelete="SET NULL"),
        nullable=True,
    )
    roof_area_sqft: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    roof_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tilt_angle: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    shadow_free_area_sqft: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    monthly_bill: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    cable_distance_meters: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    grid_suitability: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending", server_default=text("'pending'"))
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
