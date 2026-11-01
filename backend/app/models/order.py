"""Order model."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Order(Base):
    """Customer order created from an accepted quotation."""

    __tablename__ = "orders"

    __table_args__ = {"schema": "solarverse_legacy"}

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    quotation_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.quotation.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.customer.id", ondelete="RESTRICT"),
        nullable=False,
    )
    site_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.site.id", ondelete="RESTRICT"),
        nullable=False,
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="confirmed", server_default=text("'confirmed'"))
    delivery_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
