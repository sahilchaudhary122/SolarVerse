# Database and backend integration reconciliation

Database Design v1.2 remains **PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL**. No explicit team approval record was found. Stages 6–8 verified canonical SQLAlchemy mappings and the authorized workflow database without changing migrations/schema or converting legacy records.

## Database baseline

Revision `006_canonical_v12_schema` defines 35 canonical `public` tables and preserves 16 previous tables under `solarverse_legacy`. Canonical names include `app_user`, `sales_order`, and `service_ticket`. The registry is [05-canonical-table-registry.md](database/05-canonical-table-registry.md). `site_survey.enquiry_id` is mandatory and the composite `(enquiry_id, site_id)` foreign key ensures survey/site identity matches its enquiry.

The migration and PostgreSQL schema were previously checked on PostgreSQL 16.15 in `solarverse_migration_test` (historical Stage 5/6 evidence). Stage 8 verified `SELECT current_database()` returned exactly `solarverse_workflow_test` before running database-backed tests. The full suite passed **48 tests with 4 skips**; the skipped schema integration tests are pinned to the protected `solarverse_migration_test` and were not enabled. PostgreSQL workflow fixtures verify identity and roll back synthetic writes. No migration or schema operation was run. No connection was made to `solarverse_dev`, `solarverse_migration_test`, `safefinance`, production, or Supabase during Stage 8.

## Backend integration result

The FastAPI v1 routers now use canonical mappings for app users, customers, sites, enquiries/history, surveys/reviews, products/packages, quotations/lines, sales orders/order lines, equipment units, inventory, dispatch, installations, warranties, service tickets/activities/technicians, payment/refunds, file metadata, and dashboard queries. Legacy model files and migration revisions 001–006 remain unchanged and available. API details and unsupported field mapping notes are in [API_REFERENCE.md](API_REFERENCE.md) and [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md).

### Compatibility constraints and safe transitions

| Existing concept/field | Canonical mapping | Handling and data preservation |
|---|---|---|
| `users` / `User` | `app_user` | Legacy table remains in `solarverse_legacy`; no row copy. Passwords must be re-hashed/reset if hashes are incompatible. The schema has no customer FK, so account ownership currently uses normalized email and rejects ambiguity. |
| `orders` / `Order` | `sales_order` | Legacy rows remain archived. Conversion is only from an approved quotation; line snapshots are copied transactionally. Financial reconciliation and cutover are not automated. |
| `support_ticket` / `SupportTicket` | `service_ticket` | Legacy rows remain archived. Ticket notes can be represented as service activities; subject/description and customer resolution flag do not have direct canonical columns. |
| `serial_number` | `equipment_unit` | New serial assignment is unique through canonical equipment records; existing serials are not migrated. Dispatch/lifecycle matching needs a reviewed conversion. |
| Legacy product SKU/description/price/stock | `product`, quotation/order snapshots, inventory tables | There are no equivalent product columns for SKU, description, price, or count. Price and stock must be reviewed and migrated to their correct separate entities; payload values are not silently accepted. |
| Survey square-foot values/free-text grid suitability | canonical `site_survey` sqm/boolean fields | No automatic unit conversion or string-to-boolean inference. Review source records and obtain explicit conversion rules. |
| Warranty legacy serial/customer/month-count fields | `warranty` → `equipment_unit` | Canonical warranty stores equipment unit, start/end dates, and terms. Duration conversion and customer ownership require source validation; no automatic conversion. |
| Payment/refund legacy state | `payment`, `payment_refund` | Records only. No payment provider, settlement confirmation, or cross-row refund cap is implemented. |
| File upload path/evidence URL | `file_asset` metadata | No binary transfer or Supabase Storage integration. Validate and migrate object bytes/keys separately before exposing links. |

### Non-destructive legacy conversion plan (not executed)

Revision 006 lists these 16 source tables in `solarverse_legacy`. All conversion is a future approved project: inventory and snapshot source rows, transform into isolated staging tables, validate, and only then load canonical targets in dependency order. Preserve source rows unchanged. Do not run direct in-place renames. For equal table names (`customer`, `site`, `enquiry`, `site_survey`, `product`, `quotation`, `installation`, `solar_package`, `package_component`) use explicit schema-qualified source/target names and mapping manifests.

| Legacy source | Candidate canonical target(s) | Mapping and mandatory validation before a load |
|---|---|---|
| `customer` | `customer` | Preserve stable IDs where collision-free; normalize/validate email and phone, detect duplicate normalized emails, and reconcile required name/phone with null/invalid source values. |
| `site` | `site` | Preserve IDs; map address fields and country default only under approved rule; verify each `customer_id` resolves and no site ownership conflicts exist. |
| `enquiry` | `enquiry` | Preserve IDs; map customer/site and status; verify referenced customer/site and composite customer-site match; validate status and positive capacity/nonnegative bill; currency must accompany bill. |
| `customer_interaction` | `customer_interaction` | Preserve IDs and enquiry references; map interaction type, notes, occurred/created timestamps; reject unsupported types and missing parent enquiries. |
| `enquiry_status_history` | `enquiry_status_history` | Preserve IDs and enquiry links; validate from/to status values and timestamp order/meaning; reconcile current enquiry status with history without rewriting source history. |
| `site_survey` | `site_survey` | Candidate only when `enquiry_id` is non-null and `(enquiry_id, site_id)` matches an existing enquiry. Report every null/mismatch for manual disposition; no orphan or standalone survey may be silently assigned. Convert square feet to sqm only with an approved precision/rounding rule; map roof direction/type and grid suitability only with an explicit vocabulary map. |
| `users` | `app_user` | Preserve ID where safe; normalize/deduplicate emails; map only approved role names. Re-hash passwords if algorithms/formats differ or force reset; never copy unverifiable credentials. Resolve user-to-customer links against a future approved durable identity rule; do not assume email alone is sufficient for migration. |
| `product` | `product`, plus separately approved price/catalog/inventory targets | Preserve ID where valid; map name/category/serial tracking. SKU/description/price/stock have no direct canonical product fields; stage these values for review rather than dropping or forcing them into unrelated fields. Initial inventory requires approved opening movement/balance reconciliation. |
| `solar_package` | `solar_package` | Preserve ID; validate positive capacity and approved system-type vocabulary; pricing fields, if present in legacy data, need an approved separate pricing target/rule. |
| `package_component` | `package_component` | Preserve package/product IDs and quantities; ensure both parents are mapped and quantity is positive; detect duplicate package/product pairs before loading. |
| `quotation` | `quotation`, `quotation_line` | Preserve ID/version when unique; map enquiry and survey only after composite ownership validation; reconstruct lines only where source BOM/details are parseable and reviewed. Totals, currency, taxes, discounts, line rounding and version conflicts require approved policy; do not manufacture missing lines or totals. |
| `orders` | `sales_order`, `order_line` | Preserve ID where safe; map only orders traceable to the approved source quotation and ensure order snapshots reconcile under approved financial rules. Detect duplicate order-per-quotation semantics and all missing source quote lines. |
| `installation` | `installation`, `installation_technician`, `installation_checklist_item` | Preserve ID; derive required canonical `site_id` only through validated order→quotation→enquiry/site links. Map legacy assigned technician to association only after technician identity resolution. Translate checklist booleans/evidence only after reviewed rule; reject unresolved site/order/technician links. |
| `serial_number` | `equipment_unit`, optionally `equipment_event` | Preserve record ID if available; map product and serial, match dispatch/order item only with evidence. Detect duplicate/blank serials and product mismatch; do not invent dispatch relationships. |
| `warranty` | `warranty` and `equipment_unit` | Resolve legacy serial to exactly one canonical equipment unit. Convert month duration to end date only with approved inclusive/exclusive date rule and timezone/calendar rule; reconcile legacy customer with equipment/order owner and report conflicts. |
| `support_ticket` | `service_ticket`, `service_activity` | Preserve ticket ID; validate customer/site/equipment ownership and status/date values. Represent subject/description as an initial activity only if approved; preserve resolution-confirmation semantics in a migration exception report because canonical ticket has no direct field. |

**Validation and release gates:** (1) capture source row counts, checksums, sequences and backup/restore evidence; (2) produce a deterministic source-to-target map and exception report without writes; (3) resolve duplicate natural keys and invalid/missing parents with named owners; never auto-merge; (4) load a disposable rehearsal environment in dependency order (customers/users/sites/products/packages → enquiries/interactions/history/surveys → quotations/lines/orders/lines → inventory/dispatch/equipment/installations/warranties → tickets/activities/files/payments/refunds); (5) compare per-table counts, ID maps, required fields, uniqueness, composite relationships, FK orphan counts, money totals and inventory ledger/balance reconciliation; (6) obtain business and database owner sign-off; (7) take a verified production backup and define a maintenance window, cutover checks, and stop/go criteria. Rollback means stop writers, restore the pre-cutover backup or switch traffic back to the untouched legacy source, and reconcile any accepted post-cutover writes through an approved reverse-capture plan. Do not delete or mutate source rows as part of rollback. No conversion, staging load, or rollback rehearsal was run for Stage 8.

## Remaining blockers

1. Record explicit team approval of the v1.2 proposal and its canonical names/mandatory survey relationship.
2. Approve durable customer-account linkage. `app_user` has no `customer_id`; matching by email is a temporary application rule.
3. Review production first-`system_admin` provisioning and account recovery procedures; the repository script is local-test-only.
4. Resolve quote, tax, discount, cancellation, payment and refund rules; current financial API does not compute commercial totals or contact a gateway.
5. Decide and validate mappings for legacy fields with no canonical equivalent. No data conversion is included here.
6. Define customer document visibility and secure storage/download; file metadata has no share marker, so the portal endpoint returns HTTP 409.
7. Verify production PostgreSQL/Supabase connection, SSL, authorization, backups, issuer/audience/origin and deployment secrets. No hosted connection was attempted.

## Verification

See [TEST_RESULTS.md](TEST_RESULTS.md) for Stage 8 results and historical evidence. Stage 6 read-only comparisons covered the canonical table set, columns, nullability, primary keys, foreign keys/delete actions, check/unique constraints, indexes, numeric precision/scale and timestamp timezone metadata; 54 FK references had no orphans. Stage 8 made no model/schema changes and did not access the protected migration-test database. PostgreSQL-backed tests cover customer portal ownership paths, ticket access, role-scoped reports and admin operations. No populated legacy conversion rehearsal was performed; Supabase was not verified.
