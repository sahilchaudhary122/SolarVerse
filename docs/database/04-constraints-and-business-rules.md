# 4. Constraints and Business Rules

**TEAM-APPROVED INITIAL DATABASE DESIGN – VERSION 1.0**

## A. Primary keys and identifiers

- Every entity uses a UUID primary key named `id`.
- `PACKAGE_COMPONENT` uses composite PK `(package_id, product_id)`.
- `INSTALLATION_TECHNICIAN` uses composite PK `(installation_id, technician_id)`.
- UUID generation must be consistent across SQLAlchemy and PostgreSQL. Decide whether the application or PostgreSQL generates UUIDs before the first Alembic migration.

## B. NOT NULL rules

The schema tables define exact nullability. Core required fields include:
- Customer name and E.164 phone.
- Site customer FK and address.
- Enquiry customer/site FKs and status.
- Survey enquiry/site FKs and status.
- Quotation enquiry/survey FKs, version, status, currency and total.
- Quotation line quotation FK, description snapshot, quantity, unit price and line total.
- Sales order quotation FK and status.
- Order line order/product FKs, quantity and unit price.
- Reservation order/order-line/product FKs, quantity and status.
- Payment order FK, amount, currency and status.
- File asset storage key, original name and exactly one parent FK.

## C. UNIQUE constraints

Recommended constraints/indexes:
- `UNIQUE (enquiry_id, version)` on `quotation`.
- Partial unique index on `equipment_unit(serial_number) WHERE serial_number IS NOT NULL`.
- Composite PK on `package_component(package_id, product_id)`.
- Composite PK on `installation_technician(installation_id, technician_id)`.
- No unique constraint on customer phone numbers.
- Do not add `UNIQUE(sales_order.quotation_id)` in v1.0: the approved relationship allows a quotation to lead to zero or more orders. Revisit only if the business confirms one order per accepted quotation.

## D. CHECK constraints

Recommended database checks:
- `enquiry.requested_capacity_kw IS NULL OR requested_capacity_kw > 0`.
- `enquiry.requested_system_type IS NULL OR requested_system_type IN ('on-grid','off-grid')`.
- `enquiry.monthly_bill IS NULL OR monthly_bill >= 0`.
- `enquiry.status IN ('new','contacted','survey_pending','qualified','quoted','converted','lost','cancelled')`.
- `solar_package.capacity_kw > 0`.
- `solar_package.system_type IN ('on-grid','off-grid')`.
- Package component, order, reservation, dispatch and service quantities are greater than zero.
- Survey dimensions/distances are non-negative; roof tilt is between 0 and 90 degrees.
- Quotation version > 0; quotation total and line prices/totals are non-negative.
- Stock movement `quantity_delta <> 0`.
- Warranty `ends_on >= starts_on`.
- Payment amount > 0.
- `FILE_ASSET`: exactly one of `site_survey_id`, `installation_id`, `service_ticket_id` is non-null.
- Add checks for lifecycle status columns once each module's allowed status set is finalized with backend implementation. Do not invent inconsistent status vocabularies across API and DB.

## E. Indexes

Create indexes for common FK joins and operational filters. PostgreSQL does not automatically create indexes on referencing FK columns.

Recommended indexes:
- `site(customer_id)`
- `enquiry(customer_id)`, `enquiry(site_id)`, `enquiry(status, created_at)`
- `customer_interaction(enquiry_id, occurred_at)`
- `site_survey(enquiry_id)`, `site_survey(site_id)`
- `quotation(enquiry_id, version DESC)` plus unique `(enquiry_id, version)`
- `quotation(survey_id)`, `quotation_line(quotation_id)`
- `sales_order(quotation_id)`, `sales_order(status, created_at)`
- `order_line(order_id)`, `order_line(product_id)`
- `stock_movement(product_id, occurred_at)`, `stock_movement(order_id)`
- `stock_reservation(order_id, status)`, `stock_reservation(order_line_id)`, `stock_reservation(product_id, status)`
- `dispatch(order_id)`, `dispatch_item(dispatch_id)`, `dispatch_item(order_line_id)`
- `equipment_unit(product_id)`, `equipment_unit(dispatch_item_id)`, partial unique serial index
- `equipment_event(equipment_unit_id, occurred_at)`
- `installation(order_id)`, `installation(site_id, status)`
- `installation_technician(technician_id)`
- `warranty(equipment_unit_id)`, `warranty(ends_on)`
- `service_ticket(customer_id, status)`, `service_ticket(site_id)`, `service_ticket(equipment_unit_id)`
- `service_activity(ticket_id, occurred_at)`, `service_part(ticket_id)`
- `file_asset(site_survey_id)`, `file_asset(installation_id)`, `file_asset(service_ticket_id)`
- `payment(order_id, created_at)`

## F. Foreign-key deletion behaviour

Use conservative deletion rules to preserve business history. Exact `ON DELETE` actions:
- `SITE.customer_id → CUSTOMER.id`: RESTRICT.
- `ENQUIRY.customer_id → CUSTOMER.id`: RESTRICT.
- `ENQUIRY.site_id → SITE.id`: RESTRICT.
- `CUSTOMER_INTERACTION.enquiry_id → ENQUIRY.id`: CASCADE only if enquiry hard deletion is allowed before business history exists; otherwise RESTRICT. Preferred operational policy: archive, don't hard-delete.
- `SITE_SURVEY.enquiry_id/site_id`: RESTRICT.
- `QUOTATION.enquiry_id/survey_id`: RESTRICT.
- `QUOTATION.package_id`: SET NULL if a package is retired/deleted; prefer deactivate package instead of deletion.
- `QUOTATION_LINE.quotation_id`: RESTRICT for immutable revision history; if draft-only deletion is supported, handle explicitly in service logic. `product_id`: SET NULL to preserve description snapshot if product is retired/deleted.
- `SALES_ORDER.quotation_id`: RESTRICT.
- `ORDER_LINE.order_id`: RESTRICT; `product_id`: RESTRICT.
- `STOCK_MOVEMENT.product_id`: RESTRICT; `order_id`: SET NULL only if retaining a movement without its order is acceptable, otherwise RESTRICT.
- `STOCK_RESERVATION.order_id/order_line_id/product_id`: RESTRICT while active/history is retained; release reservation instead of deleting.
- `DISPATCH.order_id`, `DISPATCH_ITEM.dispatch_id/product_id`: RESTRICT. `DISPATCH_ITEM.order_line_id`: SET NULL only if traceability snapshot remains sufficient; otherwise RESTRICT.
- `EQUIPMENT_UNIT.product_id`: RESTRICT; `dispatch_item_id`: SET NULL only if provenance is retained elsewhere.
- `EQUIPMENT_EVENT.equipment_unit_id`: RESTRICT; optional site/installation: SET NULL.
- `INSTALLATION.site_id`: RESTRICT; optional order_id: SET NULL only if installation history remains meaningful.
- `INSTALLATION_TECHNICIAN.installation_id/technician_id`: CASCADE for junction cleanup when parent deletion is explicitly permitted; normal operation deactivates technicians and retains assignments.
- `WARRANTY.equipment_unit_id`: RESTRICT.
- `SERVICE_TICKET.customer_id`: RESTRICT; optional site/equipment: SET NULL only when preserving the ticket remains meaningful.
- `SERVICE_ACTIVITY/SERVICE_PART.ticket_id`: RESTRICT for service history; `SERVICE_PART.product_id`: RESTRICT.
- `FILE_ASSET` parent FK: CASCADE only when deleting the owning draft/record is explicitly allowed and storage cleanup is coordinated; otherwise RESTRICT. Delete corresponding Storage object through controlled application workflow.
- `PAYMENT.order_id`: RESTRICT. Never cascade-delete payment history.

General policy: archive/deactivate business records rather than hard-delete. CASCADE is limited to dependent junction/ephemeral child rows where deletion is intentionally permitted. The backend must coordinate any Supabase Storage object deletion; a database FK cannot delete a Storage object.

## G. Phone normalization and customer/site workflow

- MVP frontend accepts a 10-digit Indian phone number.
- Backend validates the input and uses a configurable default country calling code `+91` to normalize it to E.164 before persistence.
- Store normalized value in `customer.phone_e164`; technician phone, when supplied, should use the same convention.
- Do not globally unique customer phone. Do not use phone as customer identity or automatic deduplication key.
- For every MVP enquiry submission: create a new customer; create a new site linked to that customer using submitted address; create enquiry linked to both records.
- Existing customer/site selection is explicitly deferred to a later enhancement. When added, frontend must submit customer/site identifiers and backend must authorize/validate their relationship.

## H. Enquiry statuses and transitions

Allowed values:
1. `new`
2. `contacted`
3. `survey_pending`
4. `qualified`
5. `quoted`
6. `converted`
7. `lost`
8. `cancelled`

Database CHECK ensures only these values are stored. FastAPI/Pydantic validates requests and service logic validates transitions. Suggested initial transitions:
- `new` → `contacted`, `survey_pending`, `cancelled`
- `contacted` → `survey_pending`, `qualified`, `lost`, `cancelled`
- `survey_pending` → `qualified`, `lost`, `cancelled`
- `qualified` → `quoted`, `lost`, `cancelled`
- `quoted` → `converted`, `lost`, `cancelled`
- `converted`, `lost`, `cancelled` are terminal for MVP unless an explicit reopen workflow is approved.
- A transition to `quoted` requires an approved survey and at least one quotation revision.
- A transition to `converted` requires an accepted quotation and a sales order.
- Keep transition history in `CUSTOMER_INTERACTION` or introduce a dedicated status-history table if a full audit trail is required. Current schema does not include a dedicated status history table.

## I. Quotation revision history

- Each revision is a separate `QUOTATION` row.
- `version` starts at 1 and increments per enquiry.
- Enforce `UNIQUE(enquiry_id, version)`.
- Every revision references the originating enquiry and supporting survey; the survey must belong to the same enquiry.
- Each revision owns its own quotation lines and price/description snapshots.
- Do not overwrite accepted/sent historical revision values. Create a new revision for changes.
- A sales order references the exact accepted quotation revision.
- In v1.0, a quotation may lead to multiple orders; add uniqueness only after a separate business decision.
- At least one quotation line must exist before sending/accepting a quotation; enforce in service logic/transaction.

## J. Inventory reservation and release lifecycle

- Stock on hand is derived from stock movement events; reservations represent committed allocation and must not be confused with physical stock movement.
- On order confirmation, in one database transaction: validate order lines; calculate available stock; lock relevant product/stock balance rows or use an equivalent concurrency-safe strategy; create active reservations; reject if requested quantity exceeds available stock.
- Available stock = on-hand quantity minus active reserved quantity.
- A reservation must reference the same order and product as its order line.
- On dispatch, consume/reconcile the relevant reservation and create the appropriate stock movement; update reservation status to `consumed` and set `released_at` as the reservation lifecycle closes.
- On order cancellation before dispatch, mark active reservations `released`, set `released_at`, and make the quantities available again. Do not delete reservation rows.
- Partial dispatches may consume part of a reservation; represent partial consumption using multiple reservation rows or add an explicit quantity-consumed field after backend review. Do not silently over-consume.
- Returns and stock corrections are new stock movement events, not edits to old movements.
- Ensure concurrent order confirmations cannot reserve the same stock twice.

## K. Partial payment relationships

- One sales order can have zero or many payment rows.
- Every payment belongs to exactly one sales order (`payment.order_id NOT NULL`).
- Record each installment/partial payment as a separate row.
- Payment amount must be positive and currency must match the order's commercial currency unless a conversion policy is explicitly implemented.
- `paid_at` is populated only when the payment is confirmed as paid; pending/failed records may have null `paid_at`.
- Do not delete successful payment history. Refunds/reversals should be represented with explicit status and/or separate reversal records as decided by backend implementation.
- Outstanding amount is calculated from the order total and successful payments; avoid storing a second mutable balance unless there is a clear reconciliation design.

## L. Other business rules

- Survey must be approved before a final quotation can be sent/accepted.
- Package contents are configurable through `PACKAGE_COMPONENT`; do not hardcode component lists or assume every on-grid package includes a battery.
- Quote/order lines preserve descriptions and prices as snapshots.
- Serial number required for equipment whose product has `tracks_serial_number = true`; validate in service logic.
- Warranty starts from the recorded delivery date. The current warranty table has `starts_on`; backend must derive it from delivery/dispatch business event. Warranty duration/terms are configurable.
- Service tickets remain open/in-progress until the customer confirms resolution; do not close solely because technician work is complete.
- Files are stored in Supabase Storage; PostgreSQL stores metadata and object key.
- Payment, tax, discount, currency conversion, reservation partial-consumption and status vocabularies must be implemented consistently with the backend API and reviewed before production use.
