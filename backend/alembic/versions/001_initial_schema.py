"""Initial schema revision for SolarVerse tables with exact model parity.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=254), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), server_default="'ADMIN'", nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. customer
    op.create_table(
        'customer',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('phone_e164', sa.String(length=16), nullable=False),
        sa.Column('email', sa.String(length=254), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 3. site
    op.create_table(
        'site',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('label', sa.String(length=120), nullable=True),
        sa.Column('address_line', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('country_code', sa.CHAR(length=2), server_default="'IN'", nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('customer_id', 'id', name='uq_site_customer_id_id'),
    )
    op.create_index('ix_site_customer_id', 'site', ['customer_id'], unique=False)

    # 4. enquiry
    op.create_table(
        'enquiry',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('requested_capacity_kw', sa.Numeric(precision=8, scale=3), nullable=True),
        sa.Column('requested_system_type', sa.String(length=20), nullable=True),
        sa.Column('monthly_bill', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=24), server_default="'new'", nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('requested_capacity_kw IS NULL OR requested_capacity_kw > 0', name='ck_enquiry_requested_capacity_positive'),
        sa.CheckConstraint("requested_system_type IS NULL OR requested_system_type IN ('on-grid', 'off-grid')", name='ck_enquiry_requested_system_type_allowed'),
        sa.CheckConstraint('monthly_bill IS NULL OR monthly_bill >= 0', name='ck_enquiry_monthly_bill_non_negative'),
        sa.CheckConstraint("status IN ('new', 'contacted', 'survey_pending', 'qualified', 'quoted', 'converted', 'lost', 'cancelled')", name='ck_enquiry_status_allowed'),
        sa.ForeignKeyConstraint(['customer_id', 'site_id'], ['site.customer_id', 'site.id'], name='fk_enquiry_site_owned_by_customer', ondelete='RESTRICT'),
    )
    op.create_index('ix_enquiry_customer_id', 'enquiry', ['customer_id'], unique=False)
    op.create_index('ix_enquiry_site_id', 'enquiry', ['site_id'], unique=False)
    op.create_index('ix_enquiry_status_created_at', 'enquiry', ['status', 'created_at'], unique=False)

    # 5. customer_interaction
    op.create_table(
        'customer_interaction',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('enquiry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enquiry.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('interaction_type', sa.String(length=40), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("interaction_type IN ('call', 'email', 'visit', 'note', 'whatsapp', 'sms')", name='ck_customer_interaction_type_allowed'),
    )
    op.create_index('ix_customer_interaction_enquiry_occurred_at', 'customer_interaction', ['enquiry_id', 'occurred_at'], unique=False)

    # 6. site_survey
    op.create_table(
        'site_survey',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('site.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('enquiry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enquiry.id', ondelete='SET NULL'), nullable=True),
        sa.Column('roof_area_sqft', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('roof_type', sa.String(length=50), nullable=True),
        sa.Column('tilt_angle', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('shadow_free_area_sqft', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('monthly_bill', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('cable_distance_meters', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('grid_suitability', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=24), server_default="'pending'", nullable=False),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 7. product
    op.create_table(
        'product',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('sku', sa.String(length=64), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), server_default='0', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_product_sku'), 'product', ['sku'], unique=True)

    # 8. quotation
    op.create_table(
        'quotation',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('enquiry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('enquiry.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('survey_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('site_survey.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('system_capacity_kw', sa.Numeric(precision=8, scale=3), nullable=False),
        sa.Column('system_type', sa.String(length=20), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('status', sa.String(length=24), server_default="'draft'", nullable=False),
        sa.Column('bom_details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 9. orders
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('quotation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotation.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('site.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('status', sa.String(length=24), server_default="'confirmed'", nullable=False),
        sa.Column('delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 10. serial_number
    op.create_table(
        'serial_number',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('serial_number', sa.String(length=100), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='SET NULL'), nullable=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('site.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=24), server_default="'registered'", nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_serial_number_serial_number'), 'serial_number', ['serial_number'], unique=True)

    # 11. installation
    op.create_table(
        'installation',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('assigned_technician_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=24), server_default="'scheduled'", nullable=False),
        sa.Column('checklist_completed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('evidence_url', sa.Text(), nullable=True),
        sa.Column('customer_signoff', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 12. warranty
    op.create_table(
        'warranty',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('serial_number_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('serial_number.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('warranty_period_months', sa.Integer(), server_default='60', nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=24), server_default="'active'", nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 13. support_ticket
    op.create_table(
        'support_ticket',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('subject', sa.String(length=160), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=24), server_default="'open'", nullable=False),
        sa.Column('customer_confirmed_resolution', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('support_ticket')
    op.drop_table('warranty')
    op.drop_table('installation')
    op.drop_index(op.f('ix_serial_number_serial_number'), table_name='serial_number')
    op.drop_table('serial_number')
    op.drop_table('orders')
    op.drop_table('quotation')
    op.drop_index(op.f('ix_product_sku'), table_name='product')
    op.drop_table('product')
    op.drop_table('site_survey')
    op.drop_index('ix_customer_interaction_enquiry_occurred_at', table_name='customer_interaction')
    op.drop_table('customer_interaction')
    op.drop_index('ix_enquiry_status_created_at', table_name='enquiry')
    op.drop_index('ix_enquiry_site_id', table_name='enquiry')
    op.drop_index('ix_enquiry_customer_id', table_name='enquiry')
    op.drop_table('enquiry')
    op.drop_index('ix_site_customer_id', table_name='site')
    op.drop_table('site')
    op.drop_table('customer')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
