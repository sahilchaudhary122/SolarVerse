"""SQLAlchemy mappings for the proposed v1.2 canonical PostgreSQL schema.

Generated from the reviewed DDL in docs/database/02-database-schema.md.
These mappings are kept distinct from legacy API mappings during migration.
"""

from uuid import uuid4

from sqlalchemy import (
    BigInteger, Boolean, CHAR, CheckConstraint, Column, Date, DateTime,
    ForeignKey, ForeignKeyConstraint, Index, Integer, Numeric,
    PrimaryKeyConstraint, String, Table, Text, UniqueConstraint, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

TABLES: dict[str, Table] = {}
MODEL_CLASSES: dict[str, type] = {}

TABLES['customer'] = Table(
    'customer', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('name', String(160), nullable=False),
    Column('phone_e164', String(16), nullable=False),
    Column('email', String(254)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
)

TABLES['site'] = Table(
    'site', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('customer_id', UUID(as_uuid=True), nullable=False),
    Column('label', String(120)),
    Column('address_line', Text(), nullable=False),
    Column('city', String(100)),
    Column('state', String(100)),
    Column('postal_code', String(20)),
    Column('country_code', CHAR(2), nullable=False, server_default=text("'IN'")),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    ForeignKeyConstraint(['customer_id'], ['customer.id'], name='fk_site_customer', ondelete='RESTRICT'),
    UniqueConstraint('customer_id', 'id', name='uq_site_customer_id'),
)

TABLES['enquiry'] = Table(
    'enquiry', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('customer_id', UUID(as_uuid=True), nullable=False),
    Column('site_id', UUID(as_uuid=True), nullable=False),
    Column('requested_capacity_kw', Numeric(8, 3)),
    Column('requested_system_type', String(20)),
    Column('monthly_bill', Numeric(12, 2)),
    Column('monthly_bill_currency_code', CHAR(3)),
    Column('requirements', Text()),
    Column('status', String(24), nullable=False, server_default=text("'new'")),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    ForeignKeyConstraint(['customer_id', 'site_id'], ['site.customer_id', 'site.id'], name='fk_enquiry_customer_site', ondelete='RESTRICT'),
    UniqueConstraint('id', 'site_id', name='uq_enquiry_id_site'),
    CheckConstraint('requested_capacity_kw IS NULL OR requested_capacity_kw > 0', name='ck_enquiry_capacity_positive'),
    CheckConstraint("requested_system_type IS NULL OR requested_system_type IN ('on-grid', 'off-grid')", name='ck_enquiry_system_type'),
    CheckConstraint('monthly_bill IS NULL OR monthly_bill >= 0', name='ck_enquiry_monthly_bill'),
    CheckConstraint('(monthly_bill IS NULL) = (monthly_bill_currency_code IS NULL)', name='ck_enquiry_bill_currency'),
    CheckConstraint("status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')", name='ck_enquiry_status'),
)

TABLES['customer_interaction'] = Table(
    'customer_interaction', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('enquiry_id', UUID(as_uuid=True), ForeignKey('enquiry.id', ondelete='RESTRICT'), nullable=False),
    Column('interaction_type', String(40), nullable=False),
    Column('notes', Text()),
    Column('occurred_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint("interaction_type IN ('call','email','visit','note','whatsapp','sms')", name='ck_customer_interaction_type'),
)

TABLES['enquiry_status_history'] = Table(
    'enquiry_status_history', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('enquiry_id', UUID(as_uuid=True), ForeignKey('enquiry.id', ondelete='RESTRICT'), nullable=False),
    Column('from_status', String(24)),
    Column('to_status', String(24), nullable=False),
    Column('changed_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('reason', Text()),
    CheckConstraint("from_status IS NULL OR from_status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')", name='ck_enquiry_history_from_status'),
    CheckConstraint("to_status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')", name='ck_enquiry_history_to_status'),
)

TABLES['site_survey'] = Table(
    'site_survey', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('enquiry_id', UUID(as_uuid=True), nullable=False),
    Column('site_id', UUID(as_uuid=True), nullable=False),
    Column('scheduled_at', DateTime(timezone=True)),
    Column('roof_area_sqm', Numeric(10, 2)),
    Column('roof_direction', String(30)),
    Column('roof_tilt_degrees', Numeric(5, 2)),
    Column('shadow_free_area_sqm', Numeric(10, 2)),
    Column('monthly_bill', Numeric(12, 2)),
    Column('monthly_bill_currency_code', CHAR(3)),
    Column('cable_distance_m', Numeric(10, 2)),
    Column('grid_suitability', Boolean()),
    Column('status', String(24), nullable=False, server_default=text("'draft'")),
    Column('is_current', Boolean(), nullable=False, server_default=text('false')),
    Column('submitted_at', DateTime(timezone=True)),
    Column('approved_at', DateTime(timezone=True)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    ForeignKeyConstraint(['enquiry_id', 'site_id'], ['enquiry.id', 'enquiry.site_id'], name='fk_survey_enquiry_site', ondelete='RESTRICT'),
    UniqueConstraint('id', 'enquiry_id', name='uq_survey_id_enquiry'),
    CheckConstraint('roof_area_sqm IS NULL OR roof_area_sqm >= 0', name='ck_survey_roof_area'),
    CheckConstraint('roof_tilt_degrees IS NULL OR roof_tilt_degrees BETWEEN 0 AND 90', name='ck_survey_tilt'),
    CheckConstraint('shadow_free_area_sqm IS NULL OR shadow_free_area_sqm >= 0', name='ck_survey_shadow_area'),
    CheckConstraint('monthly_bill IS NULL OR monthly_bill >= 0', name='ck_survey_monthly_bill'),
    CheckConstraint('(monthly_bill IS NULL) = (monthly_bill_currency_code IS NULL)', name='ck_survey_bill_currency'),
    CheckConstraint('cable_distance_m IS NULL OR cable_distance_m >= 0', name='ck_survey_cable_distance'),
    CheckConstraint("status IN ('draft','submitted','approved','rejected')", name='ck_site_survey_status'),
    CheckConstraint("NOT is_current OR status = 'approved'", name='ck_site_survey_current_approved'),
)

TABLES['app_user'] = Table(
    'app_user', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('display_name', String(160), nullable=False),
    Column('email_normalized', String(254), nullable=False, unique=True),
    Column('password_hash', Text(), nullable=False),
    Column('role', String(40), nullable=False),
    Column('is_active', Boolean(), nullable=False, server_default=text('true')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('updated_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint("email_normalized <> '' AND email_normalized = LOWER(BTRIM(email_normalized))", name='ck_app_user_email_normalized'),
)

TABLES['site_survey_review'] = Table(
    'site_survey_review', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('survey_id', UUID(as_uuid=True), ForeignKey('site_survey.id', ondelete='RESTRICT'), nullable=False),
    Column('reviewer_id', UUID(as_uuid=True), ForeignKey('app_user.id', ondelete='RESTRICT'), nullable=False),
    Column('reviewer_label', Text(), nullable=False),
    Column('decision', String(20), nullable=False),
    Column('reviewed_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('rejection_reason', Text()),
    Column('notes', Text()),
    CheckConstraint("decision IN ('approved','rejected')", name='ck_survey_review_decision'),
    CheckConstraint("decision <> 'rejected' OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL", name='ck_survey_review_rejection_reason'),
)

TABLES['solar_package'] = Table(
    'solar_package', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('name', String(120), nullable=False),
    Column('capacity_kw', Numeric(8, 3), nullable=False),
    Column('system_type', String(20), nullable=False),
    Column('active', Boolean(), nullable=False, server_default=text('true')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint('capacity_kw > 0', name='ck_package_capacity'),
    CheckConstraint("system_type IN ('on-grid','off-grid')", name='ck_package_system_type'),
)

TABLES['product'] = Table(
    'product', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('name', String(160), nullable=False),
    Column('category', String(80), nullable=False),
    Column('tracks_serial_number', Boolean(), nullable=False, server_default=text('false')),
    Column('active', Boolean(), nullable=False, server_default=text('true')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
)

TABLES['package_component'] = Table(
    'package_component', Base.metadata,
    Column('package_id', UUID(as_uuid=True), ForeignKey('solar_package.id', ondelete='RESTRICT'), nullable=False),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    PrimaryKeyConstraint('package_id', 'product_id', name='pk_package_component'),
    CheckConstraint('quantity > 0', name='ck_package_component_quantity'),
)

TABLES['quotation'] = Table(
    'quotation', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('enquiry_id', UUID(as_uuid=True), ForeignKey('enquiry.id', ondelete='RESTRICT'), nullable=False),
    Column('survey_id', UUID(as_uuid=True), nullable=False),
    Column('package_id', UUID(as_uuid=True), ForeignKey('solar_package.id', ondelete='RESTRICT')),
    Column('version', Integer(), nullable=False),
    Column('status', String(24), nullable=False),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('valid_until', Date()),
    Column('currency_code', CHAR(3), nullable=False),
    Column('subtotal_amount', Numeric(14, 2), nullable=False),
    Column('discount_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('tax_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('total_amount', Numeric(14, 2), nullable=False),
    ForeignKeyConstraint(['survey_id', 'enquiry_id'], ['site_survey.id', 'site_survey.enquiry_id'], name='fk_quotation_survey_enquiry', ondelete='RESTRICT'),
    UniqueConstraint('enquiry_id', 'version', name='uq_quotation_enquiry_version'),
    CheckConstraint('version > 0', name='ck_quotation_version'),
    CheckConstraint('subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0', name='ck_quotation_amounts'),
)

TABLES['quotation_line'] = Table(
    'quotation_line', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('quotation_id', UUID(as_uuid=True), ForeignKey('quotation.id', ondelete='RESTRICT'), nullable=False),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT')),
    Column('description_snapshot', Text(), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    Column('unit_price', Numeric(14, 2), nullable=False),
    Column('discount_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('tax_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('line_total', Numeric(14, 2), nullable=False),
    CheckConstraint('quantity > 0 AND unit_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND line_total >= 0', name='ck_quotation_line_values'),
)

TABLES['sales_order'] = Table(
    'sales_order', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('quotation_id', UUID(as_uuid=True), ForeignKey('quotation.id', ondelete='RESTRICT'), nullable=False),
    Column('status', String(24), nullable=False),
    Column('confirmed_at', DateTime(timezone=True)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('currency_code', CHAR(3), nullable=False),
    Column('subtotal_amount', Numeric(14, 2), nullable=False),
    Column('discount_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('tax_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('total_amount', Numeric(14, 2), nullable=False),
    CheckConstraint('subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0', name='ck_sales_order_amounts'),
)

TABLES['order_line'] = Table(
    'order_line', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT'), nullable=False),
    Column('source_quotation_line_id', UUID(as_uuid=True), ForeignKey('quotation_line.id', ondelete='RESTRICT')),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT')),
    Column('description_snapshot', Text(), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    Column('unit_price', Numeric(14, 2), nullable=False),
    Column('discount_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('tax_amount', Numeric(14, 2), nullable=False, server_default=text('0')),
    Column('line_total', Numeric(14, 2), nullable=False),
    UniqueConstraint('id', 'order_id', 'product_id', name='uq_order_line_id_order_product'),
    CheckConstraint('quantity > 0 AND unit_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND line_total >= 0', name='ck_order_line_values'),
)

TABLES['inventory_location'] = Table(
    'inventory_location', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('name', String(120), nullable=False),
    Column('active', Boolean(), nullable=False, server_default=text('true')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
)

TABLES['inventory_balance'] = Table(
    'inventory_balance', Base.metadata,
    Column('location_id', UUID(as_uuid=True), ForeignKey('inventory_location.id', ondelete='RESTRICT'), nullable=False),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('quantity_on_hand', Numeric(12, 3), nullable=False, server_default=text('0')),
    Column('updated_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    PrimaryKeyConstraint('location_id', 'product_id', name='pk_inventory_balance'),
    CheckConstraint('quantity_on_hand >= 0', name='ck_inventory_on_hand'),
)

TABLES['stock_movement'] = Table(
    'stock_movement', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('location_id', UUID(as_uuid=True), ForeignKey('inventory_location.id', ondelete='RESTRICT'), nullable=False),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT')),
    Column('movement_type', String(30), nullable=False),
    Column('quantity_delta', Numeric(12, 3), nullable=False),
    Column('occurred_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('notes', Text()),
    CheckConstraint('quantity_delta <> 0', name='ck_stock_movement_nonzero'),
)

TABLES['stock_reservation'] = Table(
    'stock_reservation', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('location_id', UUID(as_uuid=True), nullable=False),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT'), nullable=False),
    Column('order_line_id', UUID(as_uuid=True), nullable=False),
    Column('product_id', UUID(as_uuid=True), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    Column('quantity_consumed', Numeric(12, 3), nullable=False, server_default=text('0')),
    Column('status', String(20), nullable=False, server_default=text("'active'")),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('released_at', DateTime(timezone=True)),
    ForeignKeyConstraint(['location_id', 'product_id'], ['inventory_balance.location_id', 'inventory_balance.product_id'], name='fk_reservation_balance', ondelete='RESTRICT'),
    ForeignKeyConstraint(['order_line_id', 'order_id', 'product_id'], ['order_line.id', 'order_line.order_id', 'order_line.product_id'], name='fk_reservation_order_line', ondelete='RESTRICT'),
    CheckConstraint('quantity > 0 AND quantity_consumed >= 0 AND quantity_consumed <= quantity', name='ck_reservation_quantity'),
)

TABLES['dispatch'] = Table(
    'dispatch', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT'), nullable=False),
    Column('status', String(24), nullable=False),
    Column('dispatched_at', DateTime(timezone=True)),
    Column('delivered_at', DateTime(timezone=True)),
    Column('recipient_name', String(160)),
    Column('notes', Text()),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    UniqueConstraint('id', 'order_id', name='uq_dispatch_id_order'),
    CheckConstraint('delivered_at IS NULL OR dispatched_at IS NULL OR delivered_at >= dispatched_at', name='ck_dispatch_delivery_time'),
)

TABLES['dispatch_item'] = Table(
    'dispatch_item', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('dispatch_id', UUID(as_uuid=True), nullable=False),
    Column('order_id', UUID(as_uuid=True), nullable=False),
    Column('order_line_id', UUID(as_uuid=True)),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    ForeignKeyConstraint(['dispatch_id', 'order_id'], ['dispatch.id', 'dispatch.order_id'], name='fk_dispatch_item_dispatch', ondelete='RESTRICT'),
    ForeignKeyConstraint(['order_line_id', 'order_id', 'product_id'], ['order_line.id', 'order_line.order_id', 'order_line.product_id'], name='fk_dispatch_item_order_line', ondelete='RESTRICT'),
    CheckConstraint('quantity > 0', name='ck_dispatch_item_quantity'),
    UniqueConstraint('id', 'product_id', name='uq_dispatch_item_id_product'),
)

TABLES['installation'] = Table(
    'installation', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT')),
    Column('site_id', UUID(as_uuid=True), ForeignKey('site.id', ondelete='RESTRICT'), nullable=False),
    Column('status', String(24), nullable=False),
    Column('scheduled_at', DateTime(timezone=True)),
    Column('started_at', DateTime(timezone=True)),
    Column('completed_at', DateTime(timezone=True)),
    Column('customer_signed_off_at', DateTime(timezone=True)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint('(started_at IS NULL OR scheduled_at IS NULL OR started_at >= scheduled_at) AND (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)', name='ck_installation_times'),
)

TABLES['technician'] = Table(
    'technician', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('name', String(160), nullable=False),
    Column('phone_e164', String(16)),
    Column('active', Boolean(), nullable=False, server_default=text('true')),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
)

TABLES['installation_technician'] = Table(
    'installation_technician', Base.metadata,
    Column('installation_id', UUID(as_uuid=True), ForeignKey('installation.id', ondelete='RESTRICT'), nullable=False),
    Column('technician_id', UUID(as_uuid=True), ForeignKey('technician.id', ondelete='RESTRICT'), nullable=False),
    Column('assigned_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    PrimaryKeyConstraint('installation_id', 'technician_id', name='pk_installation_technician'),
)

TABLES['installation_checklist_item'] = Table(
    'installation_checklist_item', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('installation_id', UUID(as_uuid=True), ForeignKey('installation.id', ondelete='RESTRICT'), nullable=False),
    Column('item_key', String(80), nullable=False),
    Column('description_snapshot', Text(), nullable=False),
    Column('is_completed', Boolean(), nullable=False, server_default=text('false')),
    Column('completed_at', DateTime(timezone=True)),
    Column('notes', Text()),
    UniqueConstraint('installation_id', 'item_key', name='uq_installation_checklist_item'),
    CheckConstraint('(is_completed AND completed_at IS NOT NULL) OR (NOT is_completed AND completed_at IS NULL)', name='ck_checklist_completion'),
)

TABLES['equipment_unit'] = Table(
    'equipment_unit', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('dispatch_item_id', UUID(as_uuid=True)),
    Column('serial_number', String(120)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    ForeignKeyConstraint(['dispatch_item_id', 'product_id'], ['dispatch_item.id', 'dispatch_item.product_id'], name='fk_equipment_dispatch_product', ondelete='RESTRICT'),
)

TABLES['equipment_event'] = Table(
    'equipment_event', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('equipment_unit_id', UUID(as_uuid=True), ForeignKey('equipment_unit.id', ondelete='RESTRICT'), nullable=False),
    Column('site_id', UUID(as_uuid=True), ForeignKey('site.id', ondelete='RESTRICT')),
    Column('installation_id', UUID(as_uuid=True), ForeignKey('installation.id', ondelete='RESTRICT')),
    Column('event_type', String(40), nullable=False),
    Column('occurred_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('notes', Text()),
)

TABLES['warranty'] = Table(
    'warranty', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('equipment_unit_id', UUID(as_uuid=True), ForeignKey('equipment_unit.id', ondelete='RESTRICT'), nullable=False),
    Column('starts_on', Date(), nullable=False),
    Column('ends_on', Date(), nullable=False),
    Column('terms', Text()),
    CheckConstraint('ends_on >= starts_on', name='ck_warranty_dates'),
)

TABLES['service_ticket'] = Table(
    'service_ticket', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('customer_id', UUID(as_uuid=True), ForeignKey('customer.id', ondelete='RESTRICT'), nullable=False),
    Column('site_id', UUID(as_uuid=True)),
    Column('equipment_unit_id', UUID(as_uuid=True), ForeignKey('equipment_unit.id', ondelete='RESTRICT')),
    Column('status', String(24), nullable=False),
    Column('opened_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('closed_at', DateTime(timezone=True)),
    ForeignKeyConstraint(['customer_id', 'site_id'], ['site.customer_id', 'site.id'], name='fk_service_ticket_site_customer', ondelete='RESTRICT'),
    CheckConstraint('closed_at IS NULL OR closed_at >= opened_at', name='ck_service_ticket_dates'),
)

TABLES['service_ticket_technician'] = Table(
    'service_ticket_technician', Base.metadata,
    Column('ticket_id', UUID(as_uuid=True), ForeignKey('service_ticket.id', ondelete='RESTRICT'), nullable=False),
    Column('technician_id', UUID(as_uuid=True), ForeignKey('technician.id', ondelete='RESTRICT'), nullable=False),
    Column('assigned_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    PrimaryKeyConstraint('ticket_id', 'technician_id', name='pk_service_ticket_technician'),
)

TABLES['service_activity'] = Table(
    'service_activity', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('ticket_id', UUID(as_uuid=True), ForeignKey('service_ticket.id', ondelete='RESTRICT'), nullable=False),
    Column('occurred_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    Column('activity_type', String(40), nullable=False),
    Column('from_status', String(24)),
    Column('to_status', String(24)),
    Column('notes', Text()),
)

TABLES['service_part'] = Table(
    'service_part', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('ticket_id', UUID(as_uuid=True), ForeignKey('service_ticket.id', ondelete='RESTRICT'), nullable=False),
    Column('product_id', UUID(as_uuid=True), ForeignKey('product.id', ondelete='RESTRICT'), nullable=False),
    Column('quantity', Numeric(12, 3), nullable=False),
    CheckConstraint('quantity > 0', name='ck_service_part_quantity'),
)

TABLES['file_asset'] = Table(
    'file_asset', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('site_survey_id', UUID(as_uuid=True), ForeignKey('site_survey.id', ondelete='RESTRICT')),
    Column('installation_id', UUID(as_uuid=True), ForeignKey('installation.id', ondelete='RESTRICT')),
    Column('service_ticket_id', UUID(as_uuid=True), ForeignKey('service_ticket.id', ondelete='RESTRICT')),
    Column('bucket_name', String(120), nullable=False),
    Column('storage_key', Text(), nullable=False),
    Column('original_name', String(255), nullable=False),
    Column('content_type', String(120)),
    Column('size_bytes', BigInteger()),
    Column('checksum_sha256', CHAR(64)),
    Column('uploaded_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint('num_nonnulls( site_survey_id, installation_id, service_ticket_id) = 1', name='ck_file_asset_one_parent'),
    UniqueConstraint('bucket_name', 'storage_key', name='uq_file_asset_bucket_key'),
    CheckConstraint('size_bytes IS NULL OR size_bytes >= 0', name='ck_file_asset_size'),
)

TABLES['payment'] = Table(
    'payment', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('order_id', UUID(as_uuid=True), ForeignKey('sales_order.id', ondelete='RESTRICT'), nullable=False),
    Column('amount', Numeric(14, 2), nullable=False),
    Column('currency_code', CHAR(3), nullable=False),
    Column('status', String(20), nullable=False),
    Column('external_reference', String(160)),
    Column('paid_at', DateTime(timezone=True)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint('amount > 0', name='ck_payment_amount'),
)

TABLES['payment_refund'] = Table(
    'payment_refund', Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid4),
    Column('payment_id', UUID(as_uuid=True), ForeignKey('payment.id', ondelete='RESTRICT'), nullable=False),
    Column('amount', Numeric(14, 2), nullable=False),
    Column('status', String(20), nullable=False),
    Column('reason', Text()),
    Column('external_reference', String(160)),
    Column('refunded_at', DateTime(timezone=True)),
    Column('created_at', DateTime(timezone=True), nullable=False, server_default=text('now()')),
    CheckConstraint('amount > 0', name='ck_payment_refund_amount'),
)

Index('uq_site_survey_current_approved_per_enquiry', TABLES['site_survey'].c.enquiry_id, unique=True, postgresql_where=text("is_current IS TRUE AND status = 'approved'"))
Index('uq_equipment_serial_nonnull', TABLES['equipment_unit'].c.serial_number, unique=True, postgresql_where=text('serial_number IS NOT NULL'))

Index('ix_site_customer_id', TABLES['site'].c.customer_id)
Index('ix_enquiry_customer_id', TABLES['enquiry'].c.customer_id)
Index('ix_enquiry_site_id', TABLES['enquiry'].c.site_id)
Index('ix_enquiry_status_created', TABLES['enquiry'].c.status, TABLES['enquiry'].c.created_at)
Index('ix_interaction_enquiry_time', TABLES['customer_interaction'].c.enquiry_id, TABLES['customer_interaction'].c.occurred_at)
Index('ix_enquiry_history_enquiry_time', TABLES['enquiry_status_history'].c.enquiry_id, TABLES['enquiry_status_history'].c.changed_at)
Index('ix_survey_enquiry', TABLES['site_survey'].c.enquiry_id)
Index('ix_survey_review_survey_time', TABLES['site_survey_review'].c.survey_id, TABLES['site_survey_review'].c.reviewed_at)
Index('ix_survey_review_reviewer', TABLES['site_survey_review'].c.reviewer_id)
Index('ix_quotation_survey', TABLES['quotation'].c.survey_id)
Index('ix_quotation_package', TABLES['quotation'].c.package_id)
Index('ix_quotation_line_quote', TABLES['quotation_line'].c.quotation_id)
Index('ix_quotation_line_product', TABLES['quotation_line'].c.product_id)
Index('ix_order_quote', TABLES['sales_order'].c.quotation_id)
Index('ix_order_status_created', TABLES['sales_order'].c.status, TABLES['sales_order'].c.created_at)
Index('ix_order_line_order', TABLES['order_line'].c.order_id)
Index('ix_order_line_product', TABLES['order_line'].c.product_id)
Index('ix_order_line_source_quote', TABLES['order_line'].c.source_quotation_line_id)
Index('ix_package_component_product', TABLES['package_component'].c.product_id)
Index('ix_inventory_balance_product', TABLES['inventory_balance'].c.product_id)
Index('ix_stock_movement_location_product_time', TABLES['stock_movement'].c.location_id, TABLES['stock_movement'].c.product_id, TABLES['stock_movement'].c.occurred_at)
Index('ix_stock_movement_product', TABLES['stock_movement'].c.product_id)
Index('ix_stock_movement_order', TABLES['stock_movement'].c.order_id)
Index('ix_reservation_order_status', TABLES['stock_reservation'].c.order_id, TABLES['stock_reservation'].c.status)
Index('ix_reservation_order_line', TABLES['stock_reservation'].c.order_line_id)
Index('ix_reservation_location_product_status', TABLES['stock_reservation'].c.location_id, TABLES['stock_reservation'].c.product_id, TABLES['stock_reservation'].c.status)
Index('ix_dispatch_order', TABLES['dispatch'].c.order_id)
Index('ix_dispatch_item_dispatch', TABLES['dispatch_item'].c.dispatch_id)
Index('ix_dispatch_item_order_line', TABLES['dispatch_item'].c.order_line_id)
Index('ix_dispatch_item_product', TABLES['dispatch_item'].c.product_id)
Index('ix_equipment_product', TABLES['equipment_unit'].c.product_id)
Index('ix_equipment_dispatch_item', TABLES['equipment_unit'].c.dispatch_item_id)
Index('ix_equipment_event_unit_time', TABLES['equipment_event'].c.equipment_unit_id, TABLES['equipment_event'].c.occurred_at)
Index('ix_equipment_event_site', TABLES['equipment_event'].c.site_id)
Index('ix_equipment_event_installation', TABLES['equipment_event'].c.installation_id)
Index('ix_installation_site_status', TABLES['installation'].c.site_id, TABLES['installation'].c.status)
Index('ix_installation_order', TABLES['installation'].c.order_id)
Index('ix_installation_technician_technician', TABLES['installation_technician'].c.technician_id)
Index('ix_checklist_installation', TABLES['installation_checklist_item'].c.installation_id)
Index('ix_warranty_unit', TABLES['warranty'].c.equipment_unit_id)
Index('ix_warranty_ends', TABLES['warranty'].c.ends_on)
Index('ix_service_ticket_customer_status', TABLES['service_ticket'].c.customer_id, TABLES['service_ticket'].c.status)
Index('ix_service_ticket_site', TABLES['service_ticket'].c.site_id)
Index('ix_service_ticket_equipment', TABLES['service_ticket'].c.equipment_unit_id)
Index('ix_service_ticket_technician', TABLES['service_ticket_technician'].c.technician_id)
Index('ix_service_activity_ticket_time', TABLES['service_activity'].c.ticket_id, TABLES['service_activity'].c.occurred_at)
Index('ix_service_part_ticket', TABLES['service_part'].c.ticket_id)
Index('ix_service_part_product', TABLES['service_part'].c.product_id)
Index('ix_file_survey', TABLES['file_asset'].c.site_survey_id)
Index('ix_file_installation', TABLES['file_asset'].c.installation_id)
Index('ix_file_service_ticket', TABLES['file_asset'].c.service_ticket_id)
Index('ix_payment_order_created', TABLES['payment'].c.order_id, TABLES['payment'].c.created_at)
Index('ix_payment_refund_payment', TABLES['payment_refund'].c.payment_id)

for _table_name, _table in TABLES.items():
    _model_name = "V12" + "".join(part.title() for part in _table_name.split("_"))
    MODEL_CLASSES[_table_name] = type(_model_name, (Base,), {"__table__": _table, "__module__": __name__})

# Expose read-only parent relationships for every documented foreign key.
for _table_name, _table in TABLES.items():
    _model = MODEL_CLASSES[_table_name]
    _seen: set[str] = set()
    for _constraint in _table.foreign_key_constraints:
        _elements = list(_constraint.elements)
        _target_name = _elements[0].column.table.name
        _relation_name = "to_" + _target_name
        if _relation_name in _seen:
            _relation_name += "_" + "_".join(column.name for column in _constraint.columns)
        _seen.add(_relation_name)
        setattr(_model, _relation_name, relationship(MODEL_CLASSES[_target_name], foreign_keys=[_table.c[column.name] for column in _constraint.columns], viewonly=True))

AppUser = MODEL_CLASSES["app_user"]
SalesOrder = MODEL_CLASSES["sales_order"]
ServiceTicket = MODEL_CLASSES["service_ticket"]

__all__ = ["TABLES", "MODEL_CLASSES", "AppUser", "SalesOrder", "ServiceTicket"]
