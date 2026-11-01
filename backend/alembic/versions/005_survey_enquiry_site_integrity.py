"""Enforce survey/enquiry/site consistency for linked surveys.

Revision ID: 005_survey_enquiry_site_integrity
Revises: 004_solar_packages
"""
from alembic import op
import sqlalchemy as sa

revision = "005_survey_enquiry_site_integrity"
down_revision = "004_solar_packages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("enquiry") as batch_op:
        batch_op.create_unique_constraint("uq_enquiry_id_site", ["id", "site_id"])
    with op.batch_alter_table("site_survey") as batch_op:
        batch_op.create_foreign_key(
            "fk_survey_enquiry_site", "enquiry", ["enquiry_id", "site_id"], ["id", "site_id"], ondelete="RESTRICT"
        )


def downgrade() -> None:
    with op.batch_alter_table("site_survey") as batch_op:
        batch_op.drop_constraint("fk_survey_enquiry_site", type_="foreignkey")
    with op.batch_alter_table("enquiry") as batch_op:
        batch_op.drop_constraint("uq_enquiry_id_site", type_="unique")
