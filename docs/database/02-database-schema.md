
The schema is based on the Version 1.0 database documents and the 14 review areas recorded in `04-constraints-and-business-rules.md`. The current checkout contains README and database documentation, but no React frontend contracts or FastAPI source/models. Consequently, field names retain the existing snake_case contract vocabulary where available; exact request/response shapes must be checked with the frontend/backend owners before implementation.

## PostgreSQL conventions

- Lowercase `snake_case` identifiers; `timestamptz` for instants; `date` for calendar dates; `numeric` for money/measurements; no floating-point money.
- Currency uses a three-letter ISO 4217 code. Currency and tax/discount treatment remain team decisions.
- Foreign keys default to `ON DELETE RESTRICT` unless explicitly documented otherwise. Preserve business history; prefer deactivate/archive over hard deletion.
- Status values are `text` plus `CHECK` where an agreed value list exists. Enquiry statuses are preserved exactly from v1.0. Other modules' status lists and transitions need approval.
- The DDL below is an executable-style PostgreSQL specification included in documentation, not a migration script. Apply only after team approval and review by backend/API owners.

## Proposed DDL

```sql
CREATE TABLE customer (
    name varchar(160) NOT NULL,
    phone_e164 varchar(16) NOT NULL,
    email varchar(254),
    created_at timestamptz NOT NULL DEFAULT now()
);
-- Deliberately no UNIQUE constraint on phone_e164.

CREATE TABLE site (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL,
    label varchar(120),
    address_line text NOT NULL,
    city varchar(100),
    state varchar(100),
    postal_code varchar(20),
    country_code char(2) NOT NULL DEFAULT 'IN',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_site_customer FOREIGN KEY (customer_id)
        REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT uq_site_customer_id UNIQUE (customer_id, id)
);

CREATE TABLE enquiry (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL,
    site_id uuid NOT NULL,
    requested_capacity_kw numeric(8,3),
    requested_system_type varchar(20),
    monthly_bill numeric(12,2),
    monthly_bill_currency_code char(3),
    requirements text,
    status varchar(24) NOT NULL DEFAULT 'new',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_enquiry_customer_site FOREIGN KEY (customer_id, site_id)
        REFERENCES site(customer_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_enquiry_id_site UNIQUE (id, site_id),
    CONSTRAINT ck_enquiry_capacity_positive CHECK
        (requested_capacity_kw IS NULL OR requested_capacity_kw > 0),
    CONSTRAINT ck_enquiry_system_type CHECK
        (requested_system_type IS NULL OR requested_system_type IN ('on-grid', 'off-grid')),
    CONSTRAINT ck_enquiry_monthly_bill CHECK (monthly_bill IS NULL OR monthly_bill >= 0),
    CONSTRAINT ck_enquiry_bill_currency CHECK
        ((monthly_bill IS NULL) = (monthly_bill_currency_code IS NULL)),
    CONSTRAINT ck_enquiry_status CHECK (status IN
        ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled'))
);

CREATE TABLE customer_interaction (
    id uuid PRIMARY KEY,
    enquiry_id uuid NOT NULL REFERENCES enquiry(id) ON DELETE RESTRICT,
    interaction_type varchar(40) NOT NULL,
    notes text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_customer_interaction_type CHECK
        (interaction_type IN ('call','email','visit','note','whatsapp','sms'))
);

CREATE TABLE enquiry_status_history (
    id uuid PRIMARY KEY,
    enquiry_id uuid NOT NULL REFERENCES enquiry(id) ON DELETE RESTRICT,
    from_status varchar(24),
    to_status varchar(24) NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    reason text,
    CONSTRAINT ck_enquiry_history_from_status CHECK
        (from_status IS NULL OR from_status IN
            ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')),
    CONSTRAINT ck_enquiry_history_to_status CHECK (to_status IN
        ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled'))
);

CREATE TABLE site_survey (
    id uuid PRIMARY KEY,
    enquiry_id uuid NOT NULL,
    site_id uuid NOT NULL,
    scheduled_at timestamptz,
    roof_area_sqm numeric(10,2),
    roof_direction varchar(30),
    roof_tilt_degrees numeric(5,2),
    shadow_free_area_sqm numeric(10,2),
    monthly_bill numeric(12,2),
    monthly_bill_currency_code char(3),
    cable_distance_m numeric(10,2),
    grid_suitability boolean,
    status varchar(24) NOT NULL DEFAULT 'draft',
    is_current boolean NOT NULL DEFAULT false,
    submitted_at timestamptz,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_survey_enquiry_site FOREIGN KEY (enquiry_id, site_id)
        REFERENCES enquiry(id, site_id) ON DELETE RESTRICT,
    CONSTRAINT uq_survey_id_enquiry UNIQUE (id, enquiry_id),
    CONSTRAINT ck_survey_roof_area CHECK (roof_area_sqm IS NULL OR roof_area_sqm >= 0),
    CONSTRAINT ck_survey_tilt CHECK
        (roof_tilt_degrees IS NULL OR roof_tilt_degrees BETWEEN 0 AND 90),
    CONSTRAINT ck_survey_shadow_area CHECK
        (shadow_free_area_sqm IS NULL OR shadow_free_area_sqm >= 0),
    CONSTRAINT ck_survey_monthly_bill CHECK (monthly_bill IS NULL OR monthly_bill >= 0),
    CONSTRAINT ck_survey_bill_currency CHECK
        ((monthly_bill IS NULL) = (monthly_bill_currency_code IS NULL)),
    CONSTRAINT ck_survey_cable_distance CHECK
        (cable_distance_m IS NULL OR cable_distance_m >= 0),
    CONSTRAINT ck_site_survey_status CHECK
        (status IN ('draft','submitted','approved','rejected')),
    CONSTRAINT ck_site_survey_current_approved CHECK
        (NOT is_current OR status = 'approved')
);

CREATE UNIQUE INDEX uq_site_survey_current_approved_per_enquiry
    ON site_survey(enquiry_id)
    WHERE is_current IS TRUE AND status = 'approved';

CREATE TABLE app_user (
    id uuid PRIMARY KEY,
    display_name varchar(160) NOT NULL,
    email_normalized varchar(254) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role varchar(40) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_app_user_email_normalized CHECK
        (email_normalized <> '' AND email_normalized = LOWER(BTRIM(email_normalized)))
);

CREATE TABLE site_survey_review (
    id uuid PRIMARY KEY,
    survey_id uuid NOT NULL REFERENCES site_survey(id) ON DELETE RESTRICT,
    reviewer_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    reviewer_label text NOT NULL,
    decision varchar(20) NOT NULL,
    reviewed_at timestamptz NOT NULL DEFAULT now(),
    rejection_reason text,
    notes text,
    CONSTRAINT ck_survey_review_decision CHECK (decision IN ('approved','rejected')),
    CONSTRAINT ck_survey_review_rejection_reason CHECK
        (decision <> 'rejected' OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL)
);

CREATE TABLE solar_package (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL,
    capacity_kw numeric(8,3) NOT NULL,
    system_type varchar(20) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_package_capacity CHECK (capacity_kw > 0),
    CONSTRAINT ck_package_system_type CHECK (system_type IN ('on-grid','off-grid'))
);

CREATE TABLE product (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    category varchar(80) NOT NULL,
    tracks_serial_number boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE package_component (
    package_id uuid NOT NULL REFERENCES solar_package(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity numeric(12,3) NOT NULL,
    CONSTRAINT pk_package_component PRIMARY KEY (package_id, product_id),
    CONSTRAINT ck_package_component_quantity CHECK (quantity > 0)
);

CREATE TABLE quotation (
    id uuid PRIMARY KEY,
    enquiry_id uuid NOT NULL REFERENCES enquiry(id) ON DELETE RESTRICT,
    survey_id uuid NOT NULL,
    package_id uuid REFERENCES solar_package(id) ON DELETE RESTRICT,
    version integer NOT NULL,
    status varchar(24) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    valid_until date,
    currency_code char(3) NOT NULL,
    subtotal_amount numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount numeric(14,2) NOT NULL DEFAULT 0,
    total_amount numeric(14,2) NOT NULL,
    CONSTRAINT fk_quotation_survey_enquiry FOREIGN KEY (survey_id, enquiry_id)
        REFERENCES site_survey(id, enquiry_id) ON DELETE RESTRICT,
    CONSTRAINT uq_quotation_enquiry_version UNIQUE (enquiry_id, version),
    CONSTRAINT ck_quotation_version CHECK (version > 0),
    CONSTRAINT ck_quotation_amounts CHECK
        (subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0)
);

CREATE TABLE quotation_line (
    id uuid PRIMARY KEY,
    quotation_id uuid NOT NULL REFERENCES quotation(id) ON DELETE RESTRICT,
    product_id uuid REFERENCES product(id) ON DELETE RESTRICT,
    description_snapshot text NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount numeric(14,2) NOT NULL DEFAULT 0,
    line_total numeric(14,2) NOT NULL,
    CONSTRAINT ck_quotation_line_values CHECK
        (quantity > 0 AND unit_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND line_total >= 0)
);

CREATE TABLE sales_order (
    id uuid PRIMARY KEY,
    quotation_id uuid NOT NULL REFERENCES quotation(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    confirmed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    currency_code char(3) NOT NULL,
    subtotal_amount numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount numeric(14,2) NOT NULL DEFAULT 0,
    total_amount numeric(14,2) NOT NULL,
    CONSTRAINT ck_sales_order_amounts CHECK
        (subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0)
);
-- No UNIQUE(quotation_id): one-order-per-quotation is unresolved.

CREATE TABLE order_line (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES sales_order(id) ON DELETE RESTRICT,
    source_quotation_line_id uuid REFERENCES quotation_line(id) ON DELETE RESTRICT,
    product_id uuid REFERENCES product(id) ON DELETE RESTRICT,
    description_snapshot text NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount numeric(14,2) NOT NULL DEFAULT 0,
    line_total numeric(14,2) NOT NULL,
    CONSTRAINT uq_order_line_id_order_product UNIQUE (id, order_id, product_id),
    CONSTRAINT ck_order_line_values CHECK
        (quantity > 0 AND unit_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND line_total >= 0)
);

CREATE TABLE inventory_location (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_balance (
    location_id uuid NOT NULL REFERENCES inventory_location(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity_on_hand numeric(12,3) NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_inventory_balance PRIMARY KEY (location_id, product_id),
    CONSTRAINT ck_inventory_on_hand CHECK (quantity_on_hand >= 0)
);

CREATE TABLE stock_movement (
    id uuid PRIMARY KEY,
    location_id uuid NOT NULL REFERENCES inventory_location(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    order_id uuid REFERENCES sales_order(id) ON DELETE RESTRICT,
    movement_type varchar(30) NOT NULL,
    quantity_delta numeric(12,3) NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    notes text,
    CONSTRAINT ck_stock_movement_nonzero CHECK (quantity_delta <> 0)
);

CREATE TABLE stock_reservation (
    id uuid PRIMARY KEY,
    location_id uuid NOT NULL,
    order_id uuid NOT NULL REFERENCES sales_order(id) ON DELETE RESTRICT,
    order_line_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(12,3) NOT NULL,
    quantity_consumed numeric(12,3) NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    released_at timestamptz,
    CONSTRAINT fk_reservation_balance FOREIGN KEY (location_id, product_id)
        REFERENCES inventory_balance(location_id, product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_reservation_order_line FOREIGN KEY (order_line_id, order_id, product_id)
        REFERENCES order_line(id, order_id, product_id) ON DELETE RESTRICT,
    CONSTRAINT ck_reservation_quantity CHECK
        (quantity > 0 AND quantity_consumed >= 0 AND quantity_consumed <= quantity)
);

CREATE TABLE dispatch (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES sales_order(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    dispatched_at timestamptz,
    delivered_at timestamptz,
    recipient_name varchar(160),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_dispatch_id_order UNIQUE (id, order_id),
    CONSTRAINT ck_dispatch_delivery_time CHECK
        (delivered_at IS NULL OR dispatched_at IS NULL OR delivered_at >= dispatched_at)
);

CREATE TABLE dispatch_item (
    id uuid PRIMARY KEY,
    dispatch_id uuid NOT NULL,
    order_id uuid NOT NULL,
    order_line_id uuid,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity numeric(12,3) NOT NULL,
    CONSTRAINT fk_dispatch_item_dispatch FOREIGN KEY (dispatch_id, order_id)
        REFERENCES dispatch(id, order_id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispatch_item_order_line FOREIGN KEY (order_line_id, order_id, product_id)
        REFERENCES order_line(id, order_id, product_id) ON DELETE RESTRICT,
    CONSTRAINT ck_dispatch_item_quantity CHECK (quantity > 0),
    CONSTRAINT uq_dispatch_item_id_product UNIQUE (id, product_id)
);

CREATE TABLE installation (
    id uuid PRIMARY KEY,
    order_id uuid REFERENCES sales_order(id) ON DELETE RESTRICT,
    site_id uuid NOT NULL REFERENCES site(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    scheduled_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    customer_signed_off_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_installation_times CHECK
        ((started_at IS NULL OR scheduled_at IS NULL OR started_at >= scheduled_at)
         AND (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at))
);

CREATE TABLE technician (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    phone_e164 varchar(16),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE installation_technician (
    installation_id uuid NOT NULL REFERENCES installation(id) ON DELETE RESTRICT,
    technician_id uuid NOT NULL REFERENCES technician(id) ON DELETE RESTRICT,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_installation_technician PRIMARY KEY (installation_id, technician_id)
);

CREATE TABLE installation_checklist_item (
    id uuid PRIMARY KEY,
    installation_id uuid NOT NULL REFERENCES installation(id) ON DELETE RESTRICT,
    item_key varchar(80) NOT NULL,
    description_snapshot text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    notes text,
    CONSTRAINT uq_installation_checklist_item UNIQUE (installation_id, item_key),
    CONSTRAINT ck_checklist_completion CHECK
        ((is_completed AND completed_at IS NOT NULL) OR (NOT is_completed AND completed_at IS NULL))
);

CREATE TABLE equipment_unit (
    id uuid PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    dispatch_item_id uuid,
    serial_number varchar(120),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_equipment_dispatch_product FOREIGN KEY (dispatch_item_id, product_id)
        REFERENCES dispatch_item(id, product_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX uq_equipment_serial_nonnull ON equipment_unit(serial_number)
    WHERE serial_number IS NOT NULL;

CREATE TABLE equipment_event (
    id uuid PRIMARY KEY,
    equipment_unit_id uuid NOT NULL REFERENCES equipment_unit(id) ON DELETE RESTRICT,
    site_id uuid REFERENCES site(id) ON DELETE RESTRICT,
    installation_id uuid REFERENCES installation(id) ON DELETE RESTRICT,
    event_type varchar(40) NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    notes text
);

CREATE TABLE warranty (
    id uuid PRIMARY KEY,
    equipment_unit_id uuid NOT NULL REFERENCES equipment_unit(id) ON DELETE RESTRICT,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    terms text,
    CONSTRAINT ck_warranty_dates CHECK (ends_on >= starts_on)
);

CREATE TABLE service_ticket (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
    site_id uuid,
    equipment_unit_id uuid REFERENCES equipment_unit(id) ON DELETE RESTRICT,
    status varchar(24) NOT NULL,
    opened_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    CONSTRAINT fk_service_ticket_site_customer FOREIGN KEY (customer_id, site_id)
        REFERENCES site(customer_id, id) ON DELETE RESTRICT,
    CONSTRAINT ck_service_ticket_dates CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

CREATE TABLE service_ticket_technician (
    ticket_id uuid NOT NULL REFERENCES service_ticket(id) ON DELETE RESTRICT,
    technician_id uuid NOT NULL REFERENCES technician(id) ON DELETE RESTRICT,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_service_ticket_technician PRIMARY KEY (ticket_id, technician_id)
);

CREATE TABLE service_activity (
    id uuid PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES service_ticket(id) ON DELETE RESTRICT,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    activity_type varchar(40) NOT NULL,
    from_status varchar(24),
    to_status varchar(24),
    notes text
);

CREATE TABLE service_part (
    id uuid PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES service_ticket(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity numeric(12,3) NOT NULL,
    CONSTRAINT ck_service_part_quantity CHECK (quantity > 0)
);

CREATE TABLE file_asset (
    id uuid PRIMARY KEY,
    site_survey_id uuid REFERENCES site_survey(id) ON DELETE RESTRICT,
    installation_id uuid REFERENCES installation(id) ON DELETE RESTRICT,
    service_ticket_id uuid REFERENCES service_ticket(id) ON DELETE RESTRICT,
    bucket_name varchar(120) NOT NULL,
    storage_key text NOT NULL,
    original_name varchar(255) NOT NULL,
    content_type varchar(120),
    size_bytes bigint,
    checksum_sha256 char(64),
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_file_asset_one_parent CHECK (num_nonnulls(
        site_survey_id, installation_id, service_ticket_id) = 1),
    CONSTRAINT uq_file_asset_bucket_key UNIQUE (bucket_name, storage_key),
    CONSTRAINT ck_file_asset_size CHECK (size_bytes IS NULL OR size_bytes >= 0)
);

CREATE TABLE payment (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES sales_order(id) ON DELETE RESTRICT,
    amount numeric(14,2) NOT NULL,
    currency_code char(3) NOT NULL,
    status varchar(20) NOT NULL,
    external_reference varchar(160),
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_payment_amount CHECK (amount > 0)
);

CREATE TABLE payment_refund (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES payment(id) ON DELETE RESTRICT,
    amount numeric(14,2) NOT NULL,
    status varchar(20) NOT NULL,
    reason text,
    external_reference varchar(160),
    refunded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_payment_refund_amount CHECK (amount > 0)
);
```

## Required indexes

PostgreSQL does not automatically index referencing FK columns. Proposed indexes (names subject to backend naming convention):

```sql
CREATE INDEX ix_site_customer_id ON site(customer_id);
CREATE INDEX ix_enquiry_customer_id ON enquiry(customer_id);
CREATE INDEX ix_enquiry_site_id ON enquiry(site_id);
CREATE INDEX ix_enquiry_status_created ON enquiry(status, created_at);
CREATE INDEX ix_interaction_enquiry_time ON customer_interaction(enquiry_id, occurred_at);
CREATE INDEX ix_enquiry_history_enquiry_time ON enquiry_status_history(enquiry_id, changed_at);
CREATE INDEX ix_survey_enquiry ON site_survey(enquiry_id);
CREATE INDEX ix_survey_review_survey_time ON site_survey_review(survey_id, reviewed_at);
CREATE INDEX ix_survey_review_reviewer ON site_survey_review(reviewer_id);
CREATE INDEX ix_quotation_survey ON quotation(survey_id);
CREATE INDEX ix_quotation_package ON quotation(package_id);
CREATE INDEX ix_quotation_line_quote ON quotation_line(quotation_id);
CREATE INDEX ix_quotation_line_product ON quotation_line(product_id);
CREATE INDEX ix_order_quote ON sales_order(quotation_id);
CREATE INDEX ix_order_status_created ON sales_order(status, created_at);
CREATE INDEX ix_order_line_order ON order_line(order_id);
CREATE INDEX ix_order_line_product ON order_line(product_id);
CREATE INDEX ix_order_line_source_quote ON order_line(source_quotation_line_id);
CREATE INDEX ix_package_component_product ON package_component(product_id);
CREATE INDEX ix_inventory_balance_product ON inventory_balance(product_id);
CREATE INDEX ix_stock_movement_location_product_time ON stock_movement(location_id, product_id, occurred_at);
CREATE INDEX ix_stock_movement_product ON stock_movement(product_id);
CREATE INDEX ix_stock_movement_order ON stock_movement(order_id);
CREATE INDEX ix_reservation_order_status ON stock_reservation(order_id, status);
CREATE INDEX ix_reservation_order_line ON stock_reservation(order_line_id);
CREATE INDEX ix_reservation_location_product_status ON stock_reservation(location_id, product_id, status);
CREATE INDEX ix_dispatch_order ON dispatch(order_id);
CREATE INDEX ix_dispatch_item_dispatch ON dispatch_item(dispatch_id);
CREATE INDEX ix_dispatch_item_order_line ON dispatch_item(order_line_id);
CREATE INDEX ix_dispatch_item_product ON dispatch_item(product_id);
CREATE INDEX ix_equipment_product ON equipment_unit(product_id);
CREATE INDEX ix_equipment_dispatch_item ON equipment_unit(dispatch_item_id);
CREATE INDEX ix_equipment_event_unit_time ON equipment_event(equipment_unit_id, occurred_at);
CREATE INDEX ix_equipment_event_site ON equipment_event(site_id);
CREATE INDEX ix_equipment_event_installation ON equipment_event(installation_id);
CREATE INDEX ix_installation_site_status ON installation(site_id, status);
CREATE INDEX ix_installation_order ON installation(order_id);
CREATE INDEX ix_installation_technician_technician ON installation_technician(technician_id);
CREATE INDEX ix_checklist_installation ON installation_checklist_item(installation_id);
CREATE INDEX ix_warranty_unit ON warranty(equipment_unit_id);
CREATE INDEX ix_warranty_ends ON warranty(ends_on);
CREATE INDEX ix_service_ticket_customer_status ON service_ticket(customer_id, status);
CREATE INDEX ix_service_ticket_site ON service_ticket(site_id);
CREATE INDEX ix_service_ticket_equipment ON service_ticket(equipment_unit_id);
CREATE INDEX ix_service_ticket_technician ON service_ticket_technician(technician_id);
CREATE INDEX ix_service_activity_ticket_time ON service_activity(ticket_id, occurred_at);
CREATE INDEX ix_service_part_ticket ON service_part(ticket_id);
CREATE INDEX ix_service_part_product ON service_part(product_id);
CREATE INDEX ix_file_survey ON file_asset(site_survey_id);
CREATE INDEX ix_file_installation ON file_asset(installation_id);
CREATE INDEX ix_file_service_ticket ON file_asset(service_ticket_id);
CREATE INDEX ix_payment_order_created ON payment(order_id, created_at);
CREATE INDEX ix_payment_refund_payment ON payment_refund(payment_id);
```

The unique constraints on `quotation(enquiry_id, version)`, the composite keys, and the partial unique equipment serial index are defined alongside their tables. Add other indexes only after checking API query patterns and expected data volume.

## Cross-table integrity

Composite keys/FKs in the DDL enforce these relationships: an enquiry's site belongs to its customer; a survey uses its enquiry's site; a quotation uses a survey from the same enquiry; a reservation matches its order line and product; a dispatch item matches the dispatch order and order line; a serialized unit's product matches its dispatch item; and a service ticket's site belongs to its customer.

Other rules require transaction/service logic: stock reservation availability under concurrent requests; quotation totals matching line snapshots; order financial snapshots matching the accepted quote at conversion; delivery date/warranty start linkage; checklist completion workflows; status transitions; payment/refund totals; and rules based on rows in multiple tables. Do not assume a `CHECK` constraint can query another table.

## Unresolved choices

- Current frontend contract files are not in this checkout, so field casing, response structures, and Zod/Pydantic constraints have not been independently verified.
- Whether one dispatch may be partially delivered over multiple dates. The proposed `dispatch.delivered_at` models one delivery completion timestamp; partial deliveries may require `delivery_event`/`delivery_item` history.
- Whether custom/non-catalog products are allowed on order lines; `order_line.product_id` is nullable to preserve a commercial snapshot if approved.
- Warehouse/location operating rules, stock adjustment types, reservation consumption and concurrency implementation.
- Tax, discounts, currency conversion, rounding, and order total calculation.
- Refund workflow, statuses, and whether aggregate refunds may exceed captured payments.
- Status values/transitions for modules other than the eight preserved enquiry values.
- Reviewer identity and authorization for survey approvals.
- Checklist templates, required items, and completion gates.
- Whether application updates all `updated_at` fields consistently; API field aliases and user-role vocabulary.
- Whether app or database generates UUIDs; timestamp ownership; API field aliases.
- Whether all proposed optional modules are needed for the hackathon MVP.
