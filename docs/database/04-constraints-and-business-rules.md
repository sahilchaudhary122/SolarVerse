# Constraints and Business Rules — Database Design Version 1.2

**PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL**
Versions 1.0 and 1.1 are identified in historical documentation as `f2b449c` and `307a14e`; Git history is unavailable here to verify those commits. This file records the 14 backend review areas and identifies which behavior is represented by PostgreSQL constraints, which needs transactional backend logic, and which remains unresolved across the 35 implemented canonical tables. See `05-canonical-table-registry.md` for the table registry. PostgreSQL 16 constraint and schema checks passed on the isolated migration test database; this does not constitute team approval or production readiness.

## Status of decisions

- **Preserved v1.0 decision:** the eight enquiry statuses are `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, and `cancelled`. Do not rename or remove them without explicit team approval.
- **Preserved v1.0 decisions:** UUID identifiers, phone stored normalized as E.164 but not globally unique, and the MVP enquiry flow creating a customer and site from a submitted enquiry. Other v1.0 rules remain candidates but are reconsidered below where the backend review requires clarification.
- **Proposed additions:** tables and rules in v1.1/v1.2 remain pending team and backend owner approval. Earlier versions remain recoverable from Git history; this update does not commit changes.

## Validation responsibility categories

### PostgreSQL constraints and indexes

Use primary/foreign keys, unique constraints, `CHECK` constraints, and indexes for row-local rules and references described in `02-database-schema.md`. These include the site/enquiry composite keys, normalized unique user email, six allowed interaction types, four survey statuses, survey-current check and partial unique index, bill/currency pairing, review reviewer FK, and restrictive deletion behavior. The partial index is:

`CREATE UNIQUE INDEX ... ON site_survey(enquiry_id) WHERE is_current IS TRUE AND status = 'approved'`.

PostgreSQL enforces that index atomically. It ensures **at most one** current approved survey per enquiry, not that one must exist. CHECK constraints do not query other tables or validate an entire workflow.

### Transactional backend service logic

Use a single transaction for operations that update several rows or depend on other rows: recording a survey review and matching survey status; superseding the current survey while approving a new one; creating or revising quotation/order snapshots; stock reservation and balance updates; dispatch and delivery; and payment/refund aggregation. Insert review history rather than updating/deleting past decisions; expose corrections as additional review records according to the approved workflow. Service logic must handle concurrent updates with row locks or another reviewed strategy and roll back all related changes on failure.

### Application-level validation

Use FastAPI/Pydantic and frontend validation for request shape, required fields, email normalization, password hashing/authentication, active-user and role authorization, UUID creation with Python `uuid.uuid4()`, and user-facing error messages. Application checks complement database constraints; they do not replace transactional integrity. Passwords must never be stored in plaintext.

## 1. Financial snapshots

The proposed `quotation` and `quotation_line` tables preserve the quoted currency, amounts, descriptions, quantities, and unit prices for each revision. `sales_order` and `order_line` copy the accepted commercial values as an order snapshot, with an optional `source_quotation_line_id` for traceability. Catalog edits must not silently change historical quotes or orders.

The DDL includes subtotal, discount, tax, and total amount fields, plus line-level snapshots. Amounts use `numeric`, not floating point. Formula consistency, rounding, currency, tax applicability, discount model, and whether totals are stored or computed require team approval. Current API request contracts accept caller-supplied Decimal snapshots and enforce field precision/range; they do not reconcile header totals against lines or derive line totals. No calculation formula is approved in the proposal, so implementing one would invent commercial policy. This is an explicit implementation/approval blocker: do not use the current API as an authoritative priced quote until the team approves the formula and the API enforces it.

Initial and survey-confirmed electricity bill values also carry a nullable ISO currency code paired with the amount. The supported currency/default for the frontend contract remains unresolved.

## 2. Delivery and warranty dates

`dispatch` proposes `dispatched_at` and `delivered_at`. Equipment units link through `dispatch_item` to a dispatch. Warranty `starts_on` is proposed to reflect the recorded delivery date for its equipment; this link crosses rows and needs backend validation or an approved delivery-date snapshot.

**Unresolved:** whether one dispatch can be delivered in multiple partial batches at different times. The current proposal has one delivery-completion timestamp per dispatch. If partial delivery history is required, add delivery event/item records before implementing this rule. Warranty duration, coverage start policy, and multiple warranties per unit need confirmation.

## 3. Inventory concurrency

The proposed `inventory_balance` table holds one row per product/location and is the row to lock during concurrent reservations. `stock_movement` retains the dated physical stock ledger; `stock_reservation` records allocation separately. In one transaction, backend service logic should lock affected balance rows (for example `SELECT ... FOR UPDATE`), compute on-hand less active unconsumed reservations, reject oversubscription, create reservations, and update the balance/ledger consistently.

All dispatch, release, return, correction, and reservation changes must be transactional. Do not edit old movement rows to represent a correction. Concurrency strategy, isolation level/retry behavior, location scope, and exact reservation-consumption model require backend review. `inventory_balance` is a maintained projection; reconciliation against stock movements is needed to detect drift.

## 4. Installation checklists

`installation_checklist_item` stores a per-installation checklist entry and a description snapshot. The proposed unique (`installation_id`, `item_key`) prevents duplicate entries with the same key for one installation. `is_completed` and `completed_at` must be updated consistently.

**Unresolved:** template ownership/versioning, required checklist contents, who may mark items complete, whether all items must be complete before sign-off, and whether checklist edits need history. The DDL only checks that an incomplete row has no completion timestamp; it does not enforce installation-level completion gates.

## 5. Status values and transitions

Enquiry status is the only status list preserved as agreed from v1.0. Its CHECK constraint permits exactly:

`new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`.

The `enquiry_status_history` table records status changes. FastAPI/Pydantic should validate request values and service logic should validate allowed transitions and related workflow preconditions. Proposed v1.0 transition suggestions may be used as discussion material but are not expanded or changed here without team approval.

Survey, survey-review, quotation, order, reservation, dispatch, installation, service-ticket, payment, and refund statuses do not have final agreed vocabularies in this proposal. Add checks only after agreeing values. `service_activity` can record `from_status` and `to_status`; database CHECKs cannot enforce transition graphs on their own. Other status history needs must be confirmed.

### Site survey status and approval behavior

The proposed `site_survey.status` values are exactly `draft`, `submitted`, `approved`, and `rejected`. The proposed transitions are `draft -> submitted`, `submitted -> approved|rejected`, and `rejected -> submitted` for a resubmission. An approved survey remains approved as a historical record; it is superseded by changing its `is_current` flag to false, not by rewriting its approval. Treat resubmission and whether submitted surveys may be edited as decisions requiring team approval.

`is_current` defaults to false and may be true only for an approved survey. The partial unique index prevents two current approved surveys for one enquiry. It permits zero current approved surveys. When approving a replacement survey, in one transaction append the review, set the prior current survey to false, set the new survey to approved/current, and update related timestamps. The index is the final concurrency guard; service logic should lock the enquiry/current survey and translate a uniqueness conflict into a clear API response.

For an approval or rejection transition, service logic must insert the matching decision row in `site_survey_review` in the same transaction as the `site_survey.status` change. Confirm that the acting user is active and authorized; copy their display name into `reviewer_label`. A rejected decision must provide a non-blank rejection reason.

Every approval or rejection is retained as a separate `site_survey_review` row. `reviewer_id` is required and references `app_user` with `ON DELETE RESTRICT`; `reviewer_label` copies `app_user.display_name` at decision time. Rejection requires a non-empty `rejection_reason`. Deactivate user accounts rather than deleting them. Whether rejected surveys can be resubmitted and whether a review can be corrected by appending a later decision need team approval.

## 6. Payments and refunds

One order may have zero or many payment records; every payment references exactly one order. Each payment amount is positive, and payment currency should match the order currency unless an approved conversion model is added. A separate `payment_refund` table records one or more refund/reversal attempts against a payment; preserve payment and refund history rather than deleting rows.

**Unresolved:** payment/refund status values, whether failed attempts are persisted, partial refunds, provider references, refund timing, chargebacks, and whether cumulative refunds may equal but not exceed paid amount. Use a transaction locking the payment row when checking cumulative refunds. Outstanding amount should be derived from the approved order total and successful payments/refunds; do not maintain a second mutable balance without reconciliation rules.

## 7. Quotation revisions

- Each revision is a separate `quotation` row with a positive integer `version`.
- Enforce unique (`enquiry_id`, `version`).
- Each revision references both its enquiry and the survey used; a composite FK ensures the survey belongs to that enquiry.
- Each revision owns its own line/description/price snapshots. Never overwrite prior revision lines/prices when creating a new version.
- An order references the exact quotation revision from which it was created and snapshots its accepted financial values.
- No unique constraint on `sales_order.quotation_id` is proposed; whether one revision can lead to multiple orders remains unresolved.
- At least one line before sending/accepting a quotation cannot be enforced by a normal parent FK; validate in a transaction/service workflow.
- Version sequencing, draft editing/finalization, acceptance rules, and deletion/void policy require approval.

## 8. Service tickets

Tickets refer to a customer and may optionally identify that customer's site and a serialized equipment unit. A composite FK ensures a linked site belongs to the ticket's customer. `service_ticket_technician` supports multiple technicians per ticket and technicians across tickets. `service_activity` preserves work/status updates; `service_part` lists replacement products.

The README expects service to remain active until customer confirmation. The exact status transitions, whether closure requires a confirmation activity, warranty checks, technician assignment rules, and inventory deductions for replacement parts need confirmation. Backend logic should not close a ticket solely because technician work is complete unless the team changes that rule.

## 9. Cross-table integrity

The DDL uses composite unique keys and foreign keys to enforce:

- Enquiry customer/site ownership.
- Survey site matches the enquiry's site.
- Quotation survey belongs to the same enquiry.
- Reservation's order, order line, and product agree; reservation location/product has an inventory-balance row.
- Dispatch item belongs to the same order as its dispatch and (when present) its order line; product matches the order line.
- Equipment-unit product matches its dispatch item.
- Service-ticket site belongs to its customer.

Transactional service logic is still needed for: financial total reconciliation; copying the exact accepted quotation's amount/currency into an order; ensuring an `order_line.source_quotation_line_id` belongs to the quotation referenced by that order; stock balance/ledger updates; stock availability; delivery-to-warranty date consistency; status transitions and lifecycle preconditions; refund totals; checklist completion gates; and requirements involving aggregation across rows. PostgreSQL CHECK constraints should not query other tables.

## 10. Products and serialized equipment

`product` stores catalog type and `tracks_serial_number`; `equipment_unit` stores each individually tracked physical unit and optional serial. The DDL proposes a partial unique index making every non-null serial unique across the table. Backend validation must require a serial where the product flag is true; SQL CHECK constraints cannot directly inspect the product row. Retiring a product should normally set `active = false`, preserving historical references.

**Unresolved:** confirm whether global serial uniqueness is correct or uniqueness should be scoped by manufacturer/product; product attributes/variants (e.g. capacity/model), barcode needs, and whether un-serialized stock requires lot/batch tracking.

## 11. Survey approvals

`site_survey_review` stores only `approved` or `rejected` decisions, the required `app_user` reviewer FK, a required reviewer-label snapshot, the decision timestamp, optional notes, and a required reason for rejection. `site_survey` has exactly four statuses and a current flag. These detailed workflow rules are proposed pending approval; the README requires survey submission and approval before a final quotation.

**Unresolved:** approved user roles/permissions, resubmission and editing policy, whether several approvers are needed, how review corrections are appended, and whether a quotation may reference a survey that is no longer current. Backend must check that a survey is approved (and apply the agreed current-survey rule) before sending/accepting a quotation.

## 12. File assets

File bytes remain in Supabase Storage. PostgreSQL `file_asset` stores the bucket name, object key, original filename, content type, optional size/checksum, and exactly one parent FK among survey, installation, and service ticket. The CHECK constraint enforces one parent. A unique (`bucket_name`, `storage_key`) pair prevents duplicate object references.

Validate file size/type and authorization in the API. Object deletion requires application/storage coordination; a database FK cannot delete a Supabase object. Confirm bucket naming, storage-key format, retention, allowed parent types, and whether one file can be attached to several records.

## 13. Database standards and frontend/backend contracts

- Use PostgreSQL UUID IDs, lowercase snake_case, `timestamptz`, `date`, and exact `numeric` for financial/measurement values as proposed. Generate every UUID in the Python application with `uuid.uuid4()`; do not add database UUID-generation defaults.
- Keep SQLAlchemy 2.x models, Pydantic request/response schemas, and Alembic migrations aligned with these names/types/nullability/constraints. Psycopg 3 is the documented PostgreSQL driver.
- Validate values at React/Zod and FastAPI/Pydantic boundaries; database constraints remain the final integrity guard for local row rules.
- Do not use phone as identity; preserve the v1.0 E.164 normalization behavior and no-unique-phone decision.
- `app_user.email_normalized` is unique and must be trimmed/lowercase before storage; the DDL check rejects blank/non-normalized values. Use Argon2 password hashing via `pwdlib` as specified in the root README. `role` values and authorization policy require team/backend agreement. Set `is_active = false` instead of hard deleting users; review FKs restrict deletion. `display_name` is snapshotted into each review.
- The current repository contains React/FastAPI source, but its request/response contracts do not yet implement all v1.2 entities. Verify API field casing/aliases, errors, nullability, and the data-preserving mappings in `docs/DATABASE_RECONCILIATION.md` with the implementation owner before migrations.
- Dependency versions, `updated_at` ownership, country default, currency support, app-user role values, and API field aliases need confirmation. UUID generation is specified application-side with `uuid.uuid4()`.

## 14. Documentation consistency and Version 1.0 preservation

- Version 1.2 is **PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL** across the five database design documents and canonical registry.
- Canonical names in this proposal are `app_user`, `sales_order`, and `service_ticket`. Existing implementation names are compatibility concerns, not alternative names in the v1.2 schema.
- `site_survey.enquiry_id` is `NOT NULL`; every survey must reference an existing enquiry and that enquiry's site using `(enquiry_id, site_id) -> enquiry(id, site_id)`. Standalone site surveys are prohibited.
- Prior documentation identifies Version 1.0 at commit `f2b449c`; Git history is unavailable in the current workspace to verify it. This documentation freeze changes no application code or migrations.
- `02-database-schema.md` is the exact DDL/type/nullability/constraint/index reference. `03-data-dictionary.md` explains those same fields. `01-er-diagram.md` must show every table and relationship. This file explains rules/approval decisions. `README.md` is the index/status page.
- Any accepted schema change must be applied consistently across diagram, DDL, dictionary, rules, and index, then reviewed against API contracts.

## Indexing and deletion policy

The schema document proposes indexes for all join/filter paths, including FKs, status/date filters, inventory lookup, serial number uniqueness, and quotation revision lookup. PostgreSQL does not automatically index FK referencing columns. Review query plans and API access patterns before production tuning.

Use `RESTRICT` by default as shown in DDL. Archive/deactivate business records instead of hard-deleting records needed for financial, inventory, installation, warranty, or service history. File-object cleanup must be coordinated with Supabase Storage.

## Remaining approval decisions

Confirm the open decisions listed in `02-database-schema.md`, especially commercial amount formulas, discount/tax/currency policy, whether custom/non-catalog products are allowed in orders, partial delivery, warranty start date, reservation concurrency and location rules, checklist templates/gates, status vocabularies and transitions, refund handling, review identity, product/serial details, file policy, and actual React/FastAPI contracts. No pending point is silently treated as an approved business requirement.

### Survey non-null migration preflight

The existing implementation's `site_survey.enquiry_id` is nullable and does not prove that every existing survey references its own site's enquiry. Before making it `NOT NULL` and validating the composite FK, inspect existing rows without changing them:

```sql
SELECT id, site_id FROM site_survey WHERE enquiry_id IS NULL;

SELECT ss.id, ss.enquiry_id, ss.site_id, e.site_id AS enquiry_site_id
FROM site_survey AS ss
LEFT JOIN enquiry AS e ON e.id = ss.enquiry_id
WHERE e.id IS NULL OR e.site_id <> ss.site_id;
```

Any returned rows block the constraint migration. Resolve each row with an approved, auditable customer/business decision; do not delete rows or infer an enquiry automatically. A safe migration sequence is: inventory and back up affected rows; obtain an explicit mapping for every null/mismatched survey; apply reviewed updates in a separate data migration or maintenance procedure; verify both queries return zero rows; then add/validate the composite FK and set `enquiry_id NOT NULL`. Production execution requires a separate approval and rollback plan.
