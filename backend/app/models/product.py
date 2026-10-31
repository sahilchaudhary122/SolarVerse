"""Product and Solar Package models."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    """Solar equipment product item (panel, inverter, battery, etc.)."""

    __tablename__ = "product"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # panel, inverter, battery, balance_of_system
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
