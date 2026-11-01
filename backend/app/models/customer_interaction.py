"""Customer interaction model."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.enquiry import Enquiry


class CustomerInteraction(Base):
    """Contact or communication history entry for an enquiry."""

    __tablename__ = "customer_interaction"
    __table_args__ = (
        CheckConstraint(
            "interaction_type IN ('call', 'email', 'visit', 'note', 'whatsapp', 'sms')",
            name="ck_customer_interaction_type_allowed",
        ),
        Index(
            "ix_customer_interaction_enquiry_occurred_at",
            "enquiry_id",
            "occurred_at",
        ),
        {"schema": "solarverse_legacy"})

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    enquiry_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.enquiry.id", ondelete="RESTRICT"),
        nullable=False,
    )
    interaction_type: Mapped[str] = mapped_column(String(40), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    enquiry: Mapped["Enquiry"] = relationship(
        back_populates="interactions",
        foreign_keys="CustomerInteraction.enquiry_id",
    )
