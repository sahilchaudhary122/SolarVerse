# Constraints and Business Rules — Database Design Version 1.1

**PROPOSED – PENDING TEAM APPROVAL**
Version 1.0 is preserved in Git history at commit `f2b449c`. This file records the 14 backend review areas and identifies which behavior is represented by PostgreSQL constraints, which needs transactional backend logic, and which remains unresolved. No new team approval is implied by this proposal.

## Status of decisions

- **Preserved v1.0 decision:** the eight enquiry statuses are `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, and `cancelled`. Do not rename or remove them without explicit team approval.
- **Preserved v1.0 decisions:** UUID identifiers, phone stored normalized as E.164 but not globally unique, and the MVP enquiry flow creating a customer and site from a submitted enquiry. Other v1.0 rules remain candidates but are reconsidered below where the backend review requires clarification.
- **Proposed additions:** tables and rules in v1.1 are pending team and backend owner approval. Existing v1.0 content remains recoverable from Git history; this update does not commit changes.

## 1. Financial snapshots

The proposed `quotation` and `quotation_line` tables preserve the quoted currency, amounts, descriptions, quantities, and unit prices for each revision. `sales_order` and `order_line` copy the accepted commercial values as an order snapshot, with an optional `source_quotation_line_id` for traceability. Catalog edits must not silently change historical quotes or orders.

The DDL includes subtotal, discount, tax, and total amount fields, plus line-level snapshots. Amounts use `numeric`, not floating point. Formula consistency, rounding, currency, tax applicability, discount model, and whether totals are stored or computed require team approval. Until confirmed, backend transactions must calculate and persist a consistent snapshot and validate header/line reconciliation.

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

`site_survey_review` stores approval/rejection/return decisions, timestamps, reviewer label, and notes; `site_survey` stores current status and timestamps. The proposed decisions are an implementation candidate, not a confirmed workflow. The README requires survey submission and approval before a final quotation.

**Unresolved:** approver identity/roles, allowed review decisions, resubmission behavior, whether several approvers are needed, whether review records are immutable, and whether a quotation may reference a survey after a later rejection. Backend must check survey approval before sending/accepting a quotation according to the team-approved rule.

## 12. File assets

File bytes remain in Supabase Storage. PostgreSQL `file_asset` stores the bucket name, object key, original filename, content type, optional size/checksum, and exactly one parent FK among survey, installation, and service ticket. The CHECK constraint enforces one parent. A unique (`bucket_name`, `storage_key`) pair prevents duplicate object references.

Validate file size/type and authorization in the API. Object deletion requires application/storage coordination; a database FK cannot delete a Supabase object. Confirm bucket naming, storage-key format, retention, allowed parent types, and whether one file can be attached to several records.

## 13. Database standards and frontend/backend contracts

- Use PostgreSQL UUID IDs, lowercase snake_case, `timestamptz`, `date`, and exact `numeric` for financial/measurement values as proposed. Choose UUID generation consistently between app and DB before migration.
- Keep SQLAlchemy 2.x models, Pydantic request/response schemas, and Alembic migrations aligned with these names/types/nullability/constraints. Psycopg 3 is the documented PostgreSQL driver.
- Validate values at React/Zod and FastAPI/Pydantic boundaries; database constraints remain the final integrity guard for local row rules.
- Do not use phone as identity; preserve the v1.0 E.164 normalization behavior and no-unique-phone decision.
- Repository checkout inspected for v1.1 contains no React/FastAPI source contracts. Exact JSON casing/aliases, error responses, and frontend nullability cannot be verified from current files and must be checked with Member 3 before implementation.
- Dependency versions, UUID generation side, country default, currency support, and API field aliases need confirmation.

## 14. Documentation consistency and Version 1.0 preservation

- Version 1.1 is **PROPOSED – PENDING TEAM APPROVAL** across all five database documents.
- Version 1.0 is preserved in Git history at commit `f2b449c`; no unrelated files or application code are part of this design update.
- `02-database-schema.md` is the exact DDL/type/nullability/constraint/index reference. `03-data-dictionary.md` explains those same fields. `01-er-diagram.md` must show every table and relationship. This file explains rules/approval decisions. `README.md` is the index/status page.
- Any accepted schema change must be applied consistently across diagram, DDL, dictionary, rules, and index, then reviewed against API contracts.

## Indexing and deletion policy

The schema document proposes indexes for all join/filter paths, including FKs, status/date filters, inventory lookup, serial number uniqueness, and quotation revision lookup. PostgreSQL does not automatically index FK referencing columns. Review query plans and API access patterns before production tuning.

Use `RESTRICT` by default as shown in DDL. Archive/deactivate business records instead of hard-deleting records needed for financial, inventory, installation, warranty, or service history. File-object cleanup must be coordinated with Supabase Storage.

## Remaining approval decisions

Confirm the open decisions listed in `02-database-schema.md`, especially commercial amount formulas, discount/tax/currency policy, whether custom/non-catalog products are allowed in orders, partial delivery, warranty start date, reservation concurrency and location rules, checklist templates/gates, status vocabularies and transitions, refund handling, review identity, product/serial details, file policy, and actual React/FastAPI contracts. No pending point is silently treated as an approved business requirement.
