"""Add customer ownership link to user accounts.

Revision ID: 002_user_customer_link
Revises: 001_initial_schema
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_user_customer_link"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True))
        batch_op.create_foreign_key(
            "fk_users_customer_id_customer", "customer", ["customer_id"], ["id"], ondelete="SET NULL"
        )
    op.create_index("ix_users_customer_id", "users", ["customer_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_customer_id", table_name="users")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("fk_users_customer_id_customer", type_="foreignkey")
        batch_op.drop_column("customer_id")
