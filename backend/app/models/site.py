"""Site model."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CHAR,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    and_,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.enquiry import Enquiry


class Site(Base):
    """Customer-owned installation or property location."""

    __tablename__ = "site"
    __table_args__ = (
        UniqueConstraint(
            "customer_id",
            "id",
            name="uq_site_customer_id_id",
        ),
        Index("ix_site_customer_id", "customer_id"),
        {"schema": "solarverse_legacy"})

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    customer_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.customer.id", ondelete="RESTRICT"),
        nullable=False,
    )
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    address_line: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country_code: Mapped[str] = mapped_column(
        CHAR(2),
        nullable=False,
        server_default=text("'IN'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    customer: Mapped["Customer"] = relationship(
        back_populates="sites",
        foreign_keys="Site.customer_id",
    )
    enquiries: Mapped[list["Enquiry"]] = relationship(
        back_populates="site",
        primaryjoin=lambda: and_(
            Site.customer_id == Enquiry.customer_id,
            Site.id == Enquiry.site_id,
        ),
        foreign_keys=lambda: [Enquiry.customer_id, Enquiry.site_id],
        viewonly=True,
    )


from app.models.enquiry import Enquiry
