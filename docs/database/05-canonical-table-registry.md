# SolarVerse Database Design v1.2 — Canonical Table Registry

**PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL**

This registry summarizes the exact 35 canonical `CREATE TABLE` definitions implemented by Alembic revision 006 from [`02-database-schema.md`](02-database-schema.md). It does not add tables or columns. Exact column types/nullability and named constraint/index definitions remain governed by that DDL and are explained in [`03-data-dictionary.md`](03-data-dictionary.md). Team approval is not recorded in this workspace. On the verified PostgreSQL 16 test database, these 35 tables are in `public`; the 16 pre-v1.2 tables are preserved in `solarverse_legacy`.

**Count check: 35 canonical tables.** Association tables count once as tables: `package_component`, `inventory_balance`, `installation_technician`, and `service_ticket_technician`.

| # | Canonical table | Purpose | Primary key | Foreign keys and relationships | Important constraints | Important indexes | Parent dependencies |
|---:|---|---|---|---|---|---|---|
| 1 | `customer` | Customer contact record | `id` | None | Phone is deliberately not unique | None specified | None |
| 2 | `site` | Customer-owned property/site | `id` | `customer_id → customer.id` | `UNIQUE(customer_id,id)` | `ix_site_customer_id` | customer |
| 3 | `enquiry` | Customer request for a site | `id` | `(customer_id,site_id) → site(customer_id,id)` | `UNIQUE(id,site_id)`; capacity, system type, bill/currency pairing, and 8-value status checks | customer, site, status/created indexes | site |
| 4 | `customer_interaction` | Contact history for enquiry | `id` | `enquiry_id → enquiry.id` | Interaction type limited to six values | `ix_interaction_enquiry_time` | enquiry |
| 5 | `enquiry_status_history` | Append-only enquiry transitions | `id` | `enquiry_id → enquiry.id` | From/to status checks | `ix_enquiry_history_enquiry_time` | enquiry |
| 6 | `site_survey` | Technical assessment of an enquiry's site | `id` | `(enquiry_id,site_id) → enquiry(id,site_id)` | Required non-null enquiry/site; `UNIQUE(id,enquiry_id)`; measurement, currency, status and current-approved checks; partial unique current-approved survey per enquiry | `ix_survey_enquiry`; partial unique index `uq_site_survey_current_approved_per_enquiry` | enquiry |
| 7 | `app_user` | Authenticated user and survey reviewer | `id` | None | Unique normalized email; normalized-email check | Unique index/constraint on `email_normalized` | None |
| 8 | `site_survey_review` | Append-only survey decisions | `id` | `survey_id → site_survey.id`; `reviewer_id → app_user.id` | Decision is approved/rejected; rejected decision requires nonblank reason | survey/reviewed time and reviewer indexes | site_survey, app_user |
| 9 | `solar_package` | Configurable solar offering | `id` | None | Positive capacity; on-grid/off-grid check | None specified | None |
| 10 | `product` | Catalog product/component | `id` | None | No additional row check specified | None specified | None |
| 11 | `package_component` | Product/quantity membership in package | `(package_id,product_id)` | `package_id → solar_package.id`; `product_id → product.id` | Composite PK; quantity > 0 | `ix_package_component_product` | solar_package, product |
| 12 | `quotation` | Versioned commercial quote | `id` | `enquiry_id → enquiry.id`; `(survey_id,enquiry_id) → site_survey(id,enquiry_id)`; optional `package_id → solar_package.id` | Unique enquiry/version; positive version; nonnegative amounts | survey and package indexes | enquiry, site_survey, solar_package |
| 13 | `quotation_line` | Historical product/price line snapshot | `id` | `quotation_id → quotation.id`; optional `product_id → product.id` | Positive quantity; nonnegative price/discount/tax/line total | quotation and product indexes | quotation, product |
| 14 | `sales_order` | Accepted quotation commercial snapshot | `id` | `quotation_id → quotation.id` | Nonnegative amounts; no unique quotation constraint (one quote may lead to multiple orders) | quotation and status/created indexes | quotation |
| 15 | `order_line` | Product/price snapshot for an order | `id` | `order_id → sales_order.id`; optional source quote line and product | Unique `(id,order_id,product_id)`; positive quantity and nonnegative amounts | order, product, source quote-line indexes | sales_order, quotation_line, product |
| 16 | `inventory_location` | Stock holding location | `id` | None | Active flag defaults true | None specified | None |
| 17 | `inventory_balance` | On-hand projection and reservation lock row | `(location_id,product_id)` | `location_id → inventory_location.id`; `product_id → product.id` | Composite PK; on-hand quantity ≥ 0 | `ix_inventory_balance_product` | inventory_location, product |
| 18 | `stock_movement` | Immutable stock event ledger | `id` | Location/product; optional `order_id → sales_order.id` | Nonzero quantity delta | Location/product/time, product, and order indexes | inventory_location, product, sales_order |
| 19 | `stock_reservation` | Stock allocated to an order line | `id` | Order; `(location_id,product_id) → inventory_balance`; `(order_line_id,order_id,product_id) → order_line(id,order_id,product_id)` | Positive quantity; consumed quantity from zero through reserved quantity | Order/status, order-line, location/product/status indexes | inventory_balance, sales_order, order_line |
| 20 | `dispatch` | Outbound shipment | `id` | `order_id → sales_order.id` | `UNIQUE(id,order_id)`; delivered time cannot precede dispatch time | `ix_dispatch_order` | sales_order |
| 21 | `dispatch_item` | Product quantity sent in dispatch | `id` | `(dispatch_id,order_id) → dispatch(id,order_id)`; optional `(order_line_id,order_id,product_id) → order_line`; product FK | Positive quantity; `UNIQUE(id,product_id)` | Dispatch, order-line, and product indexes | dispatch, order_line, product |
| 22 | `installation` | Site work scheduled for order | `id` | Optional `order_id → sales_order.id`; `site_id → site.id` | Start/completion times must follow schedule/start times | Site/status and order indexes | site, sales_order |
| 23 | `technician` | Technician contact/active record | `id` | None | Active flag defaults true | None specified | None |
| 24 | `installation_technician` | Technician assignment junction | `(installation_id,technician_id)` | Installation and technician FKs | Composite PK | `ix_installation_technician_technician` | installation, technician |
| 25 | `installation_checklist_item` | Installation checklist snapshot | `id` | `installation_id → installation.id` | Unique installation/item key; completion timestamp must agree with completion flag | `ix_checklist_installation` | installation |
| 26 | `equipment_unit` | Individual product/serialized unit | `id` | `product_id → product.id`; optional `(dispatch_item_id,product_id) → dispatch_item(id,product_id)` | Partial unique index for non-null serials | Product, dispatch-item, and partial serial unique indexes | product, dispatch_item |
| 27 | `equipment_event` | Equipment lifecycle history | `id` | Equipment unit; optional site and installation | No additional row check specified | Unit/time, site, installation indexes | equipment_unit, site, installation |
| 28 | `warranty` | Equipment coverage dates/terms | `id` | `equipment_unit_id → equipment_unit.id` | `ends_on >= starts_on` | Equipment unit and expiry indexes | equipment_unit |
| 29 | `service_ticket` | Customer service/maintenance case | `id` | Customer; optional `(customer_id,site_id) → site(customer_id,id)`; optional equipment unit | Close timestamp cannot precede open timestamp | Customer/status, site, equipment indexes | customer, site, equipment_unit |
| 30 | `service_ticket_technician` | Technician assignment junction for ticket | `(ticket_id,technician_id)` | Service ticket and technician FKs | Composite PK | `ix_service_ticket_technician` | service_ticket, technician |
| 31 | `service_activity` | Service action/status history | `id` | `ticket_id → service_ticket.id` | No additional row check specified | Ticket/time index | service_ticket |
| 32 | `service_part` | Replacement product used on ticket | `id` | Ticket and product FKs | Quantity > 0 | Ticket and product indexes | service_ticket, product |
| 33 | `file_asset` | Storage metadata for one supported parent | `id` | Optional survey, installation, or service ticket FK | Exactly one parent populated; unique bucket/key; size ≥ 0 | One index per parent FK | site_survey, installation, service_ticket |
| 34 | `payment` | Payment attempt/receipt for order | `id` | `order_id → sales_order.id` | Amount > 0 | Order/created index | sales_order |
| 35 | `payment_refund` | Refund/reversal against payment | `id` | `payment_id → payment.id` | Amount > 0; cumulative refund cap is transactional business logic | Payment index | payment |

## Relationship and migration notes

- `site_survey.enquiry_id` is required. `(enquiry_id,site_id)` must reference the matching `(id,site_id)` pair on `enquiry`; standalone surveys are not permitted.
- `app_user`, `sales_order`, and `service_ticket` are the canonical v1.2 names. Existing `users`, `orders`, and `support_ticket` tables are compatibility mappings only; no alternative canonical names are defined here.
- The existing implementation maps survey `enquiry_id` as nullable. Before enforcing the proposed non-null constraint, run the two read-only preflight queries in [`04-constraints-and-business-rules.md`](04-constraints-and-business-rules.md). Any null or missing/mismatched enquiry/site row must be explicitly resolved; do not delete or silently rewrite it.
- This proposal remains pending explicit team approval. Compatibility and data-preserving mapping requirements are in [`../DATABASE_RECONCILIATION.md`](../DATABASE_RECONCILIATION.md).
- Migration 006 preserves all 16 pre-v1.2 tables in the `solarverse_legacy` schema. It does not copy their rows into canonical tables; future conversion requires separately reviewed and validated mappings.
