"""Add solar packages and package components.

Revision ID: 004_solar_packages
Revises: 003_enquiry_status_history
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_solar_packages"
down_revision = "003_enquiry_status_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "solar_package",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("capacity_kw", sa.Numeric(precision=8, scale=3), nullable=False),
        sa.Column("system_type", sa.String(length=20), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("capacity_kw > 0", name="ck_package_capacity"),
        sa.CheckConstraint("system_type IN ('on-grid','off-grid')", name="ck_package_system_type"),
        sa.PrimaryKeyConstraint("id", name="pk_solar_package"),
    )
    op.create_table(
        "package_component",
        sa.Column("package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=12, scale=3), nullable=False),
        sa.ForeignKeyConstraint(["package_id"], ["solar_package.id"], name="fk_package_component_package_id_solar_package", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"], name="fk_package_component_product_id_product", ondelete="RESTRICT"),
        sa.CheckConstraint("quantity > 0", name="ck_package_component_quantity"),
        sa.PrimaryKeyConstraint("package_id", "product_id", name="pk_package_component"),
    )
    op.create_index("ix_package_component_product", "package_component", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_package_component_product", table_name="package_component")
    op.drop_table("package_component")
    op.drop_table("solar_package")
