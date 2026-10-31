"""Customer model."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.enquiry import Enquiry
    from app.models.site import Site


class Customer(Base):
    """Customer contact record created for an MVP enquiry."""

    __tablename__ = "customer"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone_e164: Mapped[str] = mapped_column(String(16), nullable=False)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    sites: Mapped[list["Site"]] = relationship(
        back_populates="customer",
        foreign_keys="Site.customer_id",
        passive_deletes=True,
    )
    enquiries: Mapped[list["Enquiry"]] = relationship(
        back_populates="customer",
        foreign_keys="Enquiry.customer_id",
        passive_deletes=True,
    )
