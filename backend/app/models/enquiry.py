"""Enquiry model."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Numeric,
    String,
    Text,
    and_,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.site import Site


class Enquiry(Base):
    """Initial customer request for a solar solution."""

    __tablename__ = "enquiry"
    __table_args__ = (
        CheckConstraint(
            "requested_capacity_kw IS NULL OR requested_capacity_kw > 0",
            name="ck_enquiry_requested_capacity_positive",
        ),
        CheckConstraint(
            "requested_system_type IS NULL OR requested_system_type IN "
            "('on-grid', 'off-grid')",
            name="ck_enquiry_requested_system_type_allowed",
        ),
        CheckConstraint(
            "monthly_bill IS NULL OR monthly_bill >= 0",
            name="ck_enquiry_monthly_bill_non_negative",
        ),
        CheckConstraint(
            "status IN ('new', 'contacted', 'survey_pending', 'qualified', "
            "'quoted', 'converted', 'lost', 'cancelled')",
            name="ck_enquiry_status_allowed",
        ),
        ForeignKeyConstraint(
            ["customer_id", "site_id"],
            ["site.customer_id", "site.id"],
            name="fk_enquiry_site_owned_by_customer",
            ondelete="RESTRICT",
        ),
        Index("ix_enquiry_customer_id", "customer_id"),
        Index("ix_enquiry_site_id", "site_id"),
        Index("ix_enquiry_status_created_at", "status", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    customer_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("customer.id", ondelete="RESTRICT"),
        nullable=False,
    )
    site_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        nullable=False,
    )
    requested_capacity_kw: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 3),
        nullable=True,
    )
    requested_system_type: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    monthly_bill: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default="new",
        server_default=text("'new'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    customer: Mapped["Customer"] = relationship(
        back_populates="enquiries",
        foreign_keys="Enquiry.customer_id",
    )
    site: Mapped["Site"] = relationship(
        back_populates="enquiries",
        primaryjoin=lambda: and_(
            Enquiry.customer_id == Site.customer_id,
            Enquiry.site_id == Site.id,
        ),
        foreign_keys=lambda: [Enquiry.customer_id, Enquiry.site_id],
        viewonly=True,
    )


from app.models.site import Site
