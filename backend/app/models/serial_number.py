"""Serial number tracking model."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SerialNumber(Base):
    """Equipment serial number tracking linked to product, order, customer, and site."""

    __tablename__ = "serial_number"

    __table_args__ = (
        Index("ix_serial_number_serial_number", "serial_number", unique=True),
        {"schema": "solarverse_legacy"},
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    product_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.product.id", ondelete="RESTRICT"),
        nullable=False,
    )
    order_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    customer_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.customer.id", ondelete="SET NULL"),
        nullable=True,
    )
    site_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.site.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="registered", server_default=text("'registered'"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
