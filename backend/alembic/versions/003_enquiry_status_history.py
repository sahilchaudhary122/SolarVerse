"""Persist enquiry status transitions.

Revision ID: 003_enquiry_status_history
Revises: 002_user_customer_link
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003_enquiry_status_history"
down_revision = "002_user_customer_link"
branch_labels = None
depends_on = None

STATUS_VALUES = "'new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled'"


def upgrade() -> None:
    op.create_table(
        "enquiry_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enquiry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_status", sa.String(length=24), nullable=True),
        sa.Column("to_status", sa.String(length=24), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["enquiry_id"], ["enquiry.id"], name="fk_enquiry_history_enquiry", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_enquiry_status_history"),
        sa.CheckConstraint(f"from_status IS NULL OR from_status IN ({STATUS_VALUES})", name="ck_enquiry_history_from_status"),
        sa.CheckConstraint(f"to_status IN ({STATUS_VALUES})", name="ck_enquiry_history_to_status"),
    )
    op.create_index("ix_enquiry_history_enquiry_time", "enquiry_status_history", ["enquiry_id", "changed_at"])


def downgrade() -> None:
    op.drop_index("ix_enquiry_history_enquiry_time", table_name="enquiry_status_history")
    op.drop_table("enquiry_status_history")
