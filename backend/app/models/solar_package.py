"""Configurable solar offering and product component relationship."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SolarPackage(Base):
    __tablename__ = "solar_package"
    __table_args__ = (
        CheckConstraint("capacity_kw > 0", name="ck_package_capacity"),
        CheckConstraint("system_type IN ('on-grid','off-grid')", name="ck_package_system_type"),
        {"schema": "solarverse_legacy"})

    id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    capacity_kw: Mapped[Decimal] = mapped_column(Numeric(8, 3), nullable=False)
    system_type: Mapped[str] = mapped_column(String(20), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))


class PackageComponent(Base):
    __tablename__ = "package_component"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_package_component_quantity"),
        Index("ix_package_component_product", "product_id"),
        {"schema": "solarverse_legacy"},
    )

    package_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("solarverse_legacy.solar_package.id", ondelete="RESTRICT", name="fk_package_component_package_id_solar_package"), primary_key=True
    )
    product_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("solarverse_legacy.product.id", ondelete="RESTRICT", name="fk_package_component_product_id_product"), primary_key=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
