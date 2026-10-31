# SolarVerse Data Dictionary — Database Design Version 1.2

**PROPOSED – PENDING TEAM APPROVAL**
This dictionary describes every table and column in the proposed PostgreSQL DDL in `02-database-schema.md`. It is documentation, not implemented schema. Versions 1.0 and 1.1 are preserved in Git history at `f2b449c` and `307a14e`.

`PK` = primary key; `FK` = foreign key; `NULL` = optional. `DEFAULT now()` records insertion time when omitted. Every UUID primary key is generated in the Python application with `uuid.uuid4()`; PostgreSQL columns have no UUID-generation default. Exact API field casing/aliases need confirmation against frontend/backend source, which is not present in this documentation checkout.

## Customer, site, and enquiry

### CUSTOMER — customer contact record
- `id` (`uuid`, PK): customer identifier.
- `name` (`varchar(160)`, required): customer display/legal name.
- `phone_e164` (`varchar(16)`, required): normalized phone. **Not globally unique; duplicates are permitted.**
- `email` (`varchar(254)`, nullable): optional email.
- `created_at` (`timestamptz`, required, default `now()`): record creation.

### SITE — customer property/installation location
- `id` (`uuid`, PK): site identifier.
- `customer_id` (`uuid`, FK -> `customer.id`, required): owning customer.
- `label` (`varchar(120)`, nullable): optional site name.
- `address_line` (`text`, required), `city` (`varchar(100)`, nullable), `state` (`varchar(100)`, nullable), `postal_code` (`varchar(20)`, nullable): address parts.
- `country_code` (`char(2)`, required, default `IN`): proposed ISO 3166-1 alpha-2 code.
- `created_at` (`timestamptz`, required, default `now()`): record creation.
- Unique (`customer_id`, `id`) supports the enquiry composite foreign key.

### ENQUIRY — initial customer request
- `id` (`uuid`, PK): enquiry identifier.
- `customer_id` (`uuid`, required) and `site_id` (`uuid`, required): composite FK (`customer_id`, `site_id`) -> `site(customer_id, id)` ensures the selected site belongs to that customer.
- `requested_capacity_kw` (`numeric(8,3)`, nullable): customer-requested capacity in kW; positive when supplied.
- `requested_system_type` (`varchar(20)`, nullable): proposed values `on-grid` or `off-grid`.
- `monthly_bill` (`numeric(12,2)`, nullable): initial customer estimate; not the survey-confirmed amount.
- `monthly_bill_currency_code` (`char(3)`, nullable): ISO currency for the initial estimate; present exactly when `monthly_bill` is present.
- `requirements` (`text`, nullable): free-text requirements.
- `status` (`varchar(24)`, required, default `new`): constrained to the existing eight values `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`.
- `created_at` (`timestamptz`, required, default `now()`): submission time.
- Unique (`id`, `site_id`) supports a survey's composite FK.

### CUSTOMER_INTERACTION — contact/history entry
- `id` (`uuid`, PK); `enquiry_id` (`uuid`, FK -> `enquiry.id`, required).
- `interaction_type` (`varchar(40)`, required; CHECK): exactly `call`, `email`, `visit`, `note`, `whatsapp`, or `sms`.
- `notes` (`text`, nullable); `occurred_at` and `created_at` (`timestamptz`, required, default `now()`).

### ENQUIRY_STATUS_HISTORY — enquiry transition history
- `id` (`uuid`, PK); `enquiry_id` (`uuid`, FK -> `enquiry.id`, required).
- `from_status` (`varchar(24)`, nullable for initial status); `to_status` (`varchar(24)`, required).
- `changed_at` (`timestamptz`, required, default `now()`); `reason` (`text`, nullable).
- `from_status` and `to_status` are constrained to the eight enquiry statuses (the former may be null for initial status); transition validity is service logic, not just a value check.

## Survey and approval

### SITE_SURVEY — technical site assessment
- `id` (`uuid`, PK); `enquiry_id` and `site_id` (`uuid`, required composite FK -> `enquiry(id, site_id)`).
- `scheduled_at` (`timestamptz`, nullable).
- `roof_area_sqm` (`numeric(10,2)`, nullable, >= 0); `roof_direction` (`varchar(30)`, nullable); `roof_tilt_degrees` (`numeric(5,2)`, nullable, 0–90); `shadow_free_area_sqm` (`numeric(10,2)`, nullable, >= 0).
- `monthly_bill` (`numeric(12,2)`, nullable, >= 0): survey-confirmed amount, separate from enquiry estimate.
- `monthly_bill_currency_code` (`char(3)`, nullable): ISO currency for the survey-confirmed bill; present exactly when its amount is present.
- `cable_distance_m` (`numeric(10,2)`, nullable, >= 0); `grid_suitability` (`boolean`, nullable).
- `status` (`varchar(24)`, required, default `draft`; CHECK allows exactly `draft`, `submitted`, `approved`, `rejected`); `is_current` (`boolean`, required, default `false`); `submitted_at`, `approved_at` (`timestamptz`, nullable); `created_at` (`timestamptz`, required, default `now()`).
- CHECK requires `is_current = false` unless status is `approved`. A partial unique index allows at most one row with `is_current = true` and approved status per enquiry. Older approved surveys remain stored with `is_current = false`.
- Unique (`id`, `enquiry_id`) supports quotation cross-check.

### APP_USER — authenticated SolarVerse user
- `id` (`uuid`, PK): application-generated with Python `uuid.uuid4()`.
- `display_name` (`varchar(160)`, required): current account display name; copied to `site_survey_review.reviewer_label` when a decision is recorded.
- `email_normalized` (`varchar(254)`, required, unique): stored trimmed and lowercase; database CHECK rejects empty or non-normalized values. Application normalizes before persistence.
- `password_hash` (`text`, required): password hash only; README specifies Argon2 via `pwdlib`, not plaintext passwords.
- `role` (`varchar(40)`, required): authorization role; allowed role names need team/backend agreement.
- `is_active` (`boolean`, required, default `true`): deactivate accounts instead of hard deletion.
- `created_at`, `updated_at` (`timestamptz`, required, default `now()`): creation and last-update times; backend updates `updated_at`.

### SITE_SURVEY_REVIEW — append-only approval decision history
- `id` (`uuid`, PK); `survey_id` (`uuid`, FK -> `site_survey.id`, required, ON DELETE RESTRICT).
- `reviewer_id` (`uuid`, FK -> `app_user.id`, required, ON DELETE RESTRICT): authenticated reviewer. Deactivated users remain referenced for history.
- `reviewer_label` (`text`, required): display-name snapshot at review time, retained even if the user later changes their profile.
- `decision` (`varchar(20)`, required; CHECK allows exactly `approved` or `rejected`); `reviewed_at` (`timestamptz`, required, default `now()`).
- `rejection_reason` (`text`, nullable, required by CHECK for rejected decisions); `notes` (`text`, nullable).
- Preserve each decision as a separate history row; corrections should append a new decision according to the approved workflow rather than erase history.

## Catalog, packages, and quotations

### SOLAR_PACKAGE — configurable solar offering
- `id` (`uuid`, PK); `name` (`varchar(120)`, required); `capacity_kw` (`numeric(8,3)`, required, > 0); `system_type` (`varchar(20)`, required, `on-grid` or `off-grid`); `active` (`boolean`, required, default `true`); `created_at` (`timestamptz`, required, default `now()`).

### PRODUCT — catalog product/component
- `id` (`uuid`, PK); `name` (`varchar(160)`, required); `category` (`varchar(80)`, required); `tracks_serial_number` and `active` (`boolean`, required, default `false` and `true` respectively); `created_at` (`timestamptz`, required, default `now()`).

### PACKAGE_COMPONENT — package/product junction
- `package_id` (`uuid`, PK part, FK -> `solar_package.id`); `product_id` (`uuid`, PK part, FK -> `product.id`); `quantity` (`numeric(12,3)`, required, > 0).
- Composite PK (`package_id`, `product_id`).

### QUOTATION — one quotation revision
- `id` (`uuid`, PK); `enquiry_id` (`uuid`, FK -> `enquiry.id`, required); `survey_id` (`uuid`, required composite FK -> `site_survey(id, enquiry_id)`); optional `package_id` (`uuid`, FK -> `solar_package.id`).
- `version` (`integer`, required, > 0); unique (`enquiry_id`, `version`).
- `status` (`varchar(24)`, required; values/transition policy need confirmation); `created_at` (`timestamptz`, required, default `now()`); `valid_until` (`date`, nullable).
- `currency_code` (`char(3)`, required); `subtotal_amount`, `discount_amount`, `tax_amount`, `total_amount` (`numeric(14,2)`, required, nonnegative; amount formulas and applicability of discount/tax need approval).
- Each revision is a separate row. Keep its own quotation lines and prices; do not overwrite older revisions.

### QUOTATION_LINE — historical item/price snapshot
- `id` (`uuid`, PK); `quotation_id` (`uuid`, FK -> `quotation.id`, required); optional `product_id` (`uuid`, FK -> `product.id`).
- `description_snapshot` (`text`, required); `quantity` (`numeric(12,3)`, required, > 0); `unit_price`, `discount_amount`, `tax_amount`, `line_total` (`numeric(14,2)`, required, nonnegative).
- The values describe the specific quotation revision even if catalog data later changes.

## Orders and financial snapshots

### SALES_ORDER — accepted commercial snapshot
- `id` (`uuid`, PK); `quotation_id` (`uuid`, FK -> `quotation.id`, required); `status` (`varchar(24)`, required; values need approval).
- `confirmed_at` (`timestamptz`, nullable); `created_at` (`timestamptz`, required, default `now()`).
- `currency_code` (`char(3)`, required); `subtotal_amount`, `discount_amount`, `tax_amount`, `total_amount` (`numeric(14,2)`, required, nonnegative).
- No unique constraint on `quotation_id`; whether one quotation can produce multiple orders remains unresolved.

### ORDER_LINE — product/price snapshot for an order
- `id` (`uuid`, PK); `order_id` (`uuid`, FK -> `sales_order.id`, required).
- Optional `source_quotation_line_id` (`uuid`, FK -> `quotation_line.id`) traces the accepted quote line; optional `product_id` (`uuid`, FK -> `product.id`) supports a snapshot if a catalog item is retired.
- `description_snapshot` (`text`, required); `quantity` (`numeric(12,3)`, required, > 0); `unit_price`, `discount_amount`, `tax_amount`, `line_total` (`numeric(14,2)`, required, nonnegative).

## Inventory, reservations, dispatch, and equipment

### INVENTORY_LOCATION — stock holding location
- `id` (`uuid`, PK); `name` (`varchar(120)`, required); `active` (`boolean`, required, default `true`); `created_at` (`timestamptz`, required, default `now()`).
- Whether multiple locations are needed is unresolved; one can be configured for a single-location MVP.

### INVENTORY_BALANCE — concurrency lock/current on-hand projection
- Composite PK `location_id` (`uuid`, FK -> `inventory_location.id`) and `product_id` (`uuid`, FK -> `product.id`).
- `quantity_on_hand` (`numeric(12,3)`, required, default 0, >= 0); `updated_at` (`timestamptz`, required, default `now()`).
- Maintained transactionally with stock movements. Active reservations are separate; availability is on-hand less active, unconsumed reservations.

### STOCK_MOVEMENT — immutable stock event
- `id` (`uuid`, PK); `location_id` (`uuid`, FK -> `inventory_location.id`, required); `product_id` (`uuid`, FK -> `product.id`, required); optional `order_id` (`uuid`, FK -> `sales_order.id`).
- `movement_type` (`varchar(30)`, required; values need approval); `quantity_delta` (`numeric(12,3)`, required, nonzero); `occurred_at` (`timestamptz`, required, default `now()`); `notes` (`text`, nullable).

### STOCK_RESERVATION — quantity allocated to an order line
- `id` (`uuid`, PK); `location_id` (`uuid`); `order_id` (`uuid`, FK -> `sales_order.id`); `order_line_id` and `product_id` (`uuid`); composite FKs ensure balance and order-line consistency.
- `quantity` (`numeric(12,3)`, required, > 0); `quantity_consumed` (`numeric(12,3)`, required, default 0, between 0 and quantity).
- `status` (`varchar(20)`, required, default `active`; values need approval); `created_at` (`timestamptz`, required, default `now()`); `released_at` (`timestamptz`, nullable).

### DISPATCH — outbound shipment record
- `id` (`uuid`, PK); `order_id` (`uuid`, FK -> `sales_order.id`, required); `status` (`varchar(24)`, required; values need approval).
- `dispatched_at`, `delivered_at` (`timestamptz`, nullable); `recipient_name` (`varchar(160)`, nullable); `notes` (`text`, nullable); `created_at` (`timestamptz`, required, default `now()`).
- Unique (`id`, `order_id`) supports dispatch-item integrity.

### DISPATCH_ITEM — product quantity on a dispatch
- `id` (`uuid`, PK); `dispatch_id`, `order_id` (`uuid`, required composite FK -> `dispatch(id, order_id)`).
- Optional `order_line_id` plus `order_id` and `product_id` form a composite FK to the matching order line. `product_id` (`uuid`, FK -> `product.id`, required).
- `quantity` (`numeric(12,3)`, required, > 0); unique (`id`, `product_id`) supports equipment consistency.

### EQUIPMENT_UNIT — individual serialized product unit
- `id` (`uuid`, PK); `product_id` (`uuid`, FK -> `product.id`, required); optional `dispatch_item_id` with composite FK to `(dispatch_item.id, product_id)`; `serial_number` (`varchar(120)`, nullable); `created_at` (`timestamptz`, required, default `now()`).
- A partial unique index makes non-null serials unique. Required serial presence for products marked `tracks_serial_number` is validated in service logic.

### EQUIPMENT_EVENT — serial-unit history event
- `id` (`uuid`, PK); `equipment_unit_id` (`uuid`, FK -> `equipment_unit.id`, required); optional `site_id` (`uuid`, FK -> `site.id`) and `installation_id` (`uuid`, FK -> `installation.id`).
- `event_type` (`varchar(40)`, required; values need approval); `occurred_at` (`timestamptz`, required, default `now()`); `notes` (`text`, nullable).

## Installation and warranty

### INSTALLATION — scheduled project work
- `id` (`uuid`, PK); optional `order_id` (`uuid`, FK -> `sales_order.id`); `site_id` (`uuid`, FK -> `site.id`, required).
- `status` (`varchar(24)`, required; values need approval); `scheduled_at`, `started_at`, `completed_at`, `customer_signed_off_at` (`timestamptz`, nullable); `created_at` (`timestamptz`, required, default `now()`).

### TECHNICIAN — worker record
- `id` (`uuid`, PK); `name` (`varchar(160)`, required); optional `phone_e164` (`varchar(16)`); `active` (`boolean`, required, default `true`); `created_at` (`timestamptz`, required, default `now()`).

### INSTALLATION_TECHNICIAN — installation assignment junction
- `installation_id` (`uuid`, composite PK part and FK -> `installation.id`); `technician_id` (`uuid`, composite PK part and FK -> `technician.id`); `assigned_at` (`timestamptz`, required, default `now()`).

### INSTALLATION_CHECKLIST_ITEM — checklist entry for an installation
- `id` (`uuid`, PK); `installation_id` (`uuid`, FK -> `installation.id`, required).
- `item_key` (`varchar(80)`, required); `description_snapshot` (`text`, required); unique (`installation_id`, `item_key`).
- `is_completed` (`boolean`, required, default `false`); `completed_at` (`timestamptz`, nullable); `notes` (`text`, nullable).
- Required checklist template/items and completion gating need approval.

### WARRANTY — coverage record for equipment
- `id` (`uuid`, PK); `equipment_unit_id` (`uuid`, FK -> `equipment_unit.id`, required); `starts_on`, `ends_on` (`date`, required; end >= start); `terms` (`text`, nullable).
- Proposed start date is the delivered date recorded for the equipment's dispatch. Because that is cross-table data, validate in transactional service logic or retain an approved delivery-date snapshot.

## Service, files, payments

### SERVICE_TICKET — complaint/repair request
- `id` (`uuid`, PK); `customer_id` (`uuid`, FK -> `customer.id`, required); optional `site_id` (`uuid`) uses composite FK (`customer_id`, `site_id`) -> `site(customer_id, id)`; optional `equipment_unit_id` (`uuid`, FK -> `equipment_unit.id`).
- `status` (`varchar(24)`, required; values need approval); `opened_at` (`timestamptz`, required, default `now()`); `closed_at` (`timestamptz`, nullable).

### SERVICE_TICKET_TECHNICIAN — service assignment junction
- `ticket_id` (`uuid`, composite PK part and FK -> `service_ticket.id`); `technician_id` (`uuid`, composite PK part and FK -> `technician.id`); `assigned_at` (`timestamptz`, required, default `now()`).

### SERVICE_ACTIVITY — service action/status history
- `id` (`uuid`, PK); `ticket_id` (`uuid`, FK -> `service_ticket.id`, required); `occurred_at` (`timestamptz`, required, default `now()`); `activity_type` (`varchar(40)`, required).
- Optional `from_status`/`to_status` (`varchar(24)`) capture transitions; `notes` (`text`, nullable).

### SERVICE_PART — replacement part usage
- `id` (`uuid`, PK); `ticket_id` (`uuid`, FK -> `service_ticket.id`, required); `product_id` (`uuid`, FK -> `product.id`, required); `quantity` (`numeric(12,3)`, required, > 0).

### FILE_ASSET — Supabase Storage metadata
- `id` (`uuid`, PK); nullable `site_survey_id`, `installation_id`, `service_ticket_id` each references the corresponding table. A CHECK requires exactly one parent.
- `bucket_name` (`varchar(120)`, required) and `storage_key` (`text`, required); unique (`bucket_name`, `storage_key`). `original_name` (`varchar(255)`, required); optional `content_type` (`varchar(120)`), `size_bytes` (`bigint`, >= 0), and `checksum_sha256` (`char(64)`).
- `uploaded_at` (`timestamptz`, required, default `now()`). File bytes remain in Supabase Storage.

### PAYMENT — payment attempt/receipt
- `id` (`uuid`, PK); `order_id` (`uuid`, FK -> `sales_order.id`, required); `amount` (`numeric(14,2)`, required, > 0); `currency_code` (`char(3)`, required).
- `status` (`varchar(20)`, required; allowed values need approval); optional `external_reference` (`varchar(160)`), `paid_at` (`timestamptz`); `created_at` (`timestamptz`, required, default `now()`).

### PAYMENT_REFUND — refund/reversal record
- `id` (`uuid`, PK); `payment_id` (`uuid`, FK -> `payment.id`, required); `amount` (`numeric(14,2)`, required, > 0); `status` (`varchar(20)`, required; values need approval).
- Optional `reason` (`text`), `external_reference` (`varchar(160)`), `refunded_at` (`timestamptz`); `created_at` (`timestamptz`, required, default `now()`).
- Aggregate refunds must not exceed the eligible paid amount; enforce transactionally.

## Shared decisions and caveats

- Customer phone is not globally unique. Store as text in E.164 form after backend normalization; do not use it as identity.
- The README's React/Zod and FastAPI/Pydantic architecture suggests API validation at both boundaries. The actual frontend source/contracts were unavailable during this documentation update; align names, nullability, allowed values, and JSON aliases with Member 3 before freezing API behavior.
- `numeric` scales, India as the default country, ISO currency handling, statuses outside enquiry, reviewer identity, refund rules, and single/partial delivery behavior require team review.
- Canonical column names and exact nullability are the PostgreSQL DDL in `02-database-schema.md`; if this dictionary differs, the mismatch is a documentation defect to fix before implementation.
