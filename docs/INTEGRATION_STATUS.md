# Backend and canonical database integration status

Updated after Stage 8 verification. Database Design v1.2 remains **PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL**. Stage 7 implemented customer-scoped read APIs/UI, role-scoped summary reports, admin user detail/role assignment, a local-only bootstrap script, and production JWT issuer/audience configuration. Stage 8 reran the full backend suite and frontend lint/TypeScript/build. No migrations, schema changes, production connections, or non-workflow database connections were made. Test fixtures roll back their synthetic writes. The handoff workspace has no `.git` directory, so Git status/diff review is unavailable.

## Implemented against canonical mappings

The FastAPI v1 API now uses `app.models.canonical` mappings for authentication (`app_user`), customers, sites, enquiries/history, surveys/reviews, products/packages/components, quotations/lines, `sales_order`/order lines, inventory balances/movements/reservations, equipment units/serials, dispatches, installations/technicians/checklists, warranties, `service_ticket`/activities/assignments, payments/refunds, file metadata, and dashboard counts. The v1 router registers those endpoints.

Multi-row writes use a SQLAlchemy transaction where applicable. List APIs use bounded pagination. Passwords use a password hash; JWT authentication reloads current active account state from `app_user`. Role checks use canonical role names and do not translate legacy `ADMIN` to `system_admin`.

## Verified boundaries and limitations

- Revision `006_canonical_v12_schema` and the 35-table canonical schema were previously verified against PostgreSQL 16.15 in `solarverse_migration_test`; the full current test run is recorded in `TEST_RESULTS.md`.
- No legacy data has been converted or dual-written. Legacy ORM mappings and revisions 001–006 remain preserved.
- `app_user` has no customer FK. Customer ownership is resolved through normalized email; missing or ambiguous matches are rejected. This is not a durable relational identity mapping.
- Product schema has no SKU, description, price, or stock column. Price belongs to quote/order snapshots; stock is tracked through inventory ledger tables. Legacy product payloads using those fields are not accepted.
- Quote/order financial amounts are Decimal snapshots. The API does not infer tax, discount, or total formulas; callers supply quote snapshots. Provider-backed payment processing is not implemented.
- Survey inputs use the canonical units/fields. Legacy square-foot and free-text grid-suitability values are not converted automatically. Every survey requires an existing enquiry and matching site.
- Warranty identity is attached to `equipment_unit`; it has no direct customer field. Warranty endpoints are staff/technician scoped; customer-level warranty ownership cannot be safely inferred as a direct schema relation.
- Service ticket schema has no subject/description fields; details can be recorded as service activity notes. File endpoints record metadata only; no byte upload, download, or Supabase Storage integration exists.
- Dashboard returns database-derived counts and recorded payment amounts; it does not imply reconciliation or payment settlement.
- Administrator user directory, detail, provisioning, activation and staff-role assignment use admin-protected auth routes. Self deactivation/role change is rejected. Customer service tickets support ownership-filtered reads and customer-visible update activities; customers cannot change status or assign technicians. Staff ticket page supports activity review and role-gated status/assignment controls.
- Customer portal pages for quotations/lines, sales orders/lines/site, installation schedule/status/technician names/checklist summary, dispatched equipment/serials, warranties, and account dashboard counts use new customer-only read APIs. Records are filtered through a unique normalized-email match and canonical owner relationships; foreign record detail lookups return 404. No customer quotation acceptance action exists.
- Customer document screen is intentionally fail-closed (HTTP 409) because file metadata has no visibility/share marker and storage is not configured. It does not expose storage keys or claim bytes are available.
- Reports provide database-backed customer counts, status counts, and inventory quantity snapshots. Sections are role-limited; payments are grouped by status, not revenue/settlement. Inventory is a current snapshot and is not filtered by the requested dates.
- The one-time local bootstrap script is guarded to loopback development and the exact `solarverse_workflow_test` database. It was guard-tested against a mismatched URL without connecting; no administrator was provisioned.
- Production JWT configuration now requires issuer and audience; tokens include and validate those claims when configured. Development settings remain backward compatible when they are omitted.
- Frontend routes use lazy-loaded page modules; the production bundle no longer exceeds the configured 500 kB chunk warning threshold.
- No browser automation package/tool is available in this workspace. Browser interactions were not claimed as verified.

## Readiness

Stage 8 reran the full available backend suite against the identity-verified `solarverse_workflow_test`: 48 passed, 4 skipped. The skipped schema tests are pinned to the protected `solarverse_migration_test` and were not enabled. Frontend lint, TypeScript build, and production build passed; the largest emitted chunk was 333.34 kB. The opt-in PostgreSQL ticket/portal/admin/report tests ran as part of the suite and use rollback-scoped writes. No browser automation was available. Stage 6 schema parity remains historical evidence because no model/schema change was made. Customer documents remain unavailable pending an explicit sharing policy and storage service. Settings remain environment-managed, and production admin bootstrap still requires a separately reviewed operational runbook.

Production readiness still requires explicit database-design team approval, approved pricing/tax/discount/rounding and quote reconciliation rules, durable relational customer-account linkage, customer document visibility and secure storage, a reviewed/auditable production admin provisioning procedure, production infrastructure/secret verification, browser workflow verification, and an approved/rehearsed legacy cutover. Session tokens remain in `sessionStorage` with documented XSS exposure; cookie migration was not introduced. No populated legacy conversion or production readiness assessment was completed. Sales/surveyor demo dashboards are restricted to development preview routes; those demos are not production API workflows.
