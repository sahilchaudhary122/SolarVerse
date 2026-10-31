# 3. Data Dictionary

**TEAM-APPROVED INITIAL DATABASE DESIGN – VERSION 1.0**

This dictionary describes the purpose and meaning of every table and column in the approved initial design. `NULL` means the value is optional/not yet known. `DEFAULT now()` means PostgreSQL supplies the insertion timestamp when the application omits it.

## CUSTOMER — customer contact record

- `id` (UUID, PK, NOT NULL): unique customer record identifier.
- `name` (varchar(160), NOT NULL): customer's display/legal name.
- `phone_e164` (varchar(16), NOT NULL): normalized phone number in E.164 format, including `+` and country code. Not unique; duplicate phone numbers are allowed.
- `email` (varchar(254), NULL): optional email address.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): record creation time.

## SITE — customer installation/property location

- `id` (UUID, PK, NOT NULL): unique site identifier.
- `customer_id` (UUID, FK to customer, NOT NULL): owner/customer for this site.
- `label` (varchar(120), NULL): optional name such as Home or Factory.
- `address_line` (text, NOT NULL): street/building address submitted for the enquiry.
- `city` (varchar(100), NULL): city/locality.
- `state` (varchar(100), NULL): state/region.
- `postal_code` (varchar(20), NULL): postal/ZIP code.
- `country_code` (char(2), NOT NULL, DEFAULT 'IN'): ISO 3166-1 alpha-2 country code; MVP default India.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): record creation time.

## ENQUIRY — initial customer request for a solar solution

- `id` (UUID, PK, NOT NULL): enquiry identifier.
- `customer_id` (UUID, FK to customer, NOT NULL): customer created for this enquiry in MVP.
- `site_id` (UUID, FK to site, NOT NULL): new site created from the address submitted with this enquiry in MVP.
- `requested_capacity_kw` (numeric(8,3), NULL): requested system capacity in kilowatts.
- `requested_system_type` (varchar(20), NULL): requested type; allowed values `on-grid` or `off-grid`.
- `monthly_bill` (numeric(12,2), NULL): customer's initial estimated monthly electricity bill. Kept separately from the survey-confirmed amount.
- `requirements` (text, NULL): free-text requirements or notes.
- `status` (varchar(24), NOT NULL, DEFAULT 'new'): enquiry lifecycle state; allowed values `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): submission time.

## CUSTOMER_INTERACTION — contact/history log for an enquiry

- `id` (UUID, PK, NOT NULL): interaction identifier.
- `enquiry_id` (UUID, FK to enquiry, NOT NULL): related enquiry.
- `interaction_type` (varchar(40), NOT NULL): call, email, visit, note, or another agreed interaction category.
- `notes` (text, NULL): interaction details.
- `occurred_at` (timestamptz, NOT NULL, DEFAULT now()): when interaction occurred.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): when interaction was recorded.

## SITE_SURVEY — technical assessment of an installation site

- `id` (UUID, PK, NOT NULL): survey identifier.
- `enquiry_id` (UUID, FK to enquiry, NOT NULL): enquiry being assessed.
- `site_id` (UUID, FK to site, NOT NULL): site inspected.
- `scheduled_at` (timestamptz, NULL): scheduled survey time.
- `roof_area_sqm` (numeric(10,2), NULL): measured roof area in square metres.
- `roof_direction` (varchar(30), NULL): roof orientation.
- `roof_tilt_degrees` (numeric(5,2), NULL): measured tilt in degrees.
- `shadow_free_area_sqm` (numeric(10,2), NULL): usable unshaded area in square metres.
- `monthly_bill` (numeric(12,2), NULL): survey-confirmed monthly bill; distinct from enquiry estimate.
- `cable_distance_m` (numeric(10,2), NULL): estimated cable run in metres.
- `grid_suitability` (boolean, NULL): survey assessment of grid suitability.
- `status` (varchar(24), NOT NULL, DEFAULT 'draft'): survey workflow status.
- `submitted_at` (timestamptz, NULL): submission time.
- `approved_at` (timestamptz, NULL): approval time.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): record creation time.

## SOLAR_PACKAGE — configurable solar offering

- `id` (UUID, PK, NOT NULL): package identifier.
- `name` (varchar(120), NOT NULL): package name.
- `capacity_kw` (numeric(8,3), NOT NULL): package capacity in kW.
- `system_type` (varchar(20), NOT NULL): `on-grid` or `off-grid`.
- `active` (boolean, NOT NULL, DEFAULT true): whether available for new quotations.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## PRODUCT — catalog item or equipment/component

- `id` (UUID, PK, NOT NULL): product identifier.
- `name` (varchar(160), NOT NULL): product name.
- `category` (varchar(80), NOT NULL): product category.
- `tracks_serial_number` (boolean, NOT NULL, DEFAULT false): whether individual units require serial tracking.
- `active` (boolean, NOT NULL, DEFAULT true): whether selectable for new business.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## PACKAGE_COMPONENT — products and quantities in a package

- `package_id` (UUID, composite PK, FK to solar_package, NOT NULL): package.
- `product_id` (UUID, composite PK, FK to product, NOT NULL): included product.
- `quantity` (numeric(12,3), NOT NULL): configured quantity per package; must be positive.

## QUOTATION — one immutable revision of a commercial offer

- `id` (UUID, PK, NOT NULL): quotation revision identifier.
- `enquiry_id` (UUID, FK to enquiry, NOT NULL): originating enquiry.
- `survey_id` (UUID, FK to site_survey, NOT NULL): survey supporting this revision; must belong to same enquiry.
- `package_id` (UUID, FK to solar_package, NULL): optional configured package.
- `version` (integer, NOT NULL): revision number, starting at 1 and unique within enquiry.
- `status` (varchar(24), NOT NULL): quotation state, such as draft, sent, accepted, rejected, expired; final enum/check list to be coordinated with backend.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): revision creation time.
- `valid_until` (date, NULL): expiry date.
- `currency_code` (char(3), NOT NULL): ISO 4217 currency code.
- `total_amount` (numeric(14,2), NOT NULL): revision total; non-negative.

## QUOTATION_LINE — item/charge snapshot within a quotation revision

- `id` (UUID, PK, NOT NULL): quotation line identifier.
- `quotation_id` (UUID, FK to quotation, NOT NULL): parent revision.
- `product_id` (UUID, FK to product, NULL): optional link to current product catalog item.
- `description_snapshot` (text, NOT NULL): description as shown on this revision; preserved if catalog changes.
- `quantity` (numeric(12,3), NOT NULL): quoted quantity; positive.
- `unit_price` (numeric(14,2), NOT NULL): unit price snapshot; non-negative.
- `line_total` (numeric(14,2), NOT NULL): line amount snapshot; non-negative.

## SALES_ORDER — accepted commercial order

- `id` (UUID, PK, NOT NULL): order identifier.
- `quotation_id` (UUID, FK to quotation, NOT NULL): source quotation revision.
- `status` (varchar(24), NOT NULL): order workflow state.
- `confirmed_at` (timestamptz, NULL): confirmation time.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## ORDER_LINE — product/quantity/price ordered

- `id` (UUID, PK, NOT NULL): order line identifier.
- `order_id` (UUID, FK to sales_order, NOT NULL): parent order.
- `product_id` (UUID, FK to product, NOT NULL): ordered product.
- `quantity` (numeric(12,3), NOT NULL): ordered quantity; positive.
- `unit_price` (numeric(14,2), NOT NULL): agreed unit price snapshot; non-negative.

## STOCK_MOVEMENT — append-only stock quantity event

- `id` (UUID, PK, NOT NULL): movement identifier.
- `product_id` (UUID, FK to product, NOT NULL): affected product.
- `order_id` (UUID, FK to sales_order, NULL): related order, if any.
- `movement_type` (varchar(30), NOT NULL): receipt, dispatch, adjustment, return, or another approved movement type.
- `quantity_delta` (numeric(12,3), NOT NULL): signed stock change; cannot be zero.
- `occurred_at` (timestamptz, NOT NULL, DEFAULT now()): movement time.
- `notes` (text, NULL): reason/reference.

## STOCK_RESERVATION — stock allocated to an order line

- `id` (UUID, PK, NOT NULL): reservation identifier.
- `order_id` (UUID, FK to sales_order, NOT NULL): order owning reservation.
- `order_line_id` (UUID, FK to order_line, NOT NULL): order line allocated.
- `product_id` (UUID, FK to product, NOT NULL): reserved product; must match order line.
- `quantity` (numeric(12,3), NOT NULL): reserved quantity; positive.
- `status` (varchar(20), NOT NULL, DEFAULT 'active'): active, consumed, released, or another explicitly approved lifecycle state.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): reservation time.
- `released_at` (timestamptz, NULL): release/close time.

## DISPATCH — shipment/dispatch event for an order

- `id` (UUID, PK, NOT NULL): dispatch identifier.
- `order_id` (UUID, FK to sales_order, NOT NULL): order being dispatched.
- `status` (varchar(24), NOT NULL): dispatch state.
- `dispatched_at` (timestamptz, NULL): actual dispatch time.
- `notes` (text, NULL): dispatch notes.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## DISPATCH_ITEM — product quantity within a dispatch

- `id` (UUID, PK, NOT NULL): dispatch line identifier.
- `dispatch_id` (UUID, FK to dispatch, NOT NULL): parent dispatch.
- `order_line_id` (UUID, FK to order_line, NULL): order line fulfilled, if traceable.
- `product_id` (UUID, FK to product, NOT NULL): dispatched product.
- `quantity` (numeric(12,3), NOT NULL): dispatched quantity; positive.

## EQUIPMENT_UNIT — individual physical equipment unit

- `id` (UUID, PK, NOT NULL): unit identifier.
- `product_id` (UUID, FK to product, NOT NULL): product type.
- `dispatch_item_id` (UUID, FK to dispatch_item, NULL): dispatch item from which unit originated, if applicable.
- `serial_number` (varchar(120), NULL): manufacturer serial; required by application when product tracks serials; unique when non-null.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## EQUIPMENT_EVENT — equipment traceability history

- `id` (UUID, PK, NOT NULL): event identifier.
- `equipment_unit_id` (UUID, FK to equipment_unit, NOT NULL): tracked unit.
- `site_id` (UUID, FK to site, NULL): related site, if known.
- `installation_id` (UUID, FK to installation, NULL): related installation, if applicable.
- `event_type` (varchar(40), NOT NULL): received, dispatched, installed, moved, serviced, returned, etc.
- `occurred_at` (timestamptz, NOT NULL, DEFAULT now()): event time.
- `notes` (text, NULL): event detail.

## INSTALLATION — installation job at a site

- `id` (UUID, PK, NOT NULL): installation identifier.
- `order_id` (UUID, FK to sales_order, NULL): related order when available.
- `site_id` (UUID, FK to site, NOT NULL): installation location.
- `status` (varchar(24), NOT NULL): installation workflow state.
- `scheduled_at` (timestamptz, NULL): planned time.
- `started_at` (timestamptz, NULL): start time.
- `completed_at` (timestamptz, NULL): completion time.
- `customer_signed_off_at` (timestamptz, NULL): customer sign-off time.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## TECHNICIAN — installation/service worker

- `id` (UUID, PK, NOT NULL): technician identifier.
- `name` (varchar(160), NOT NULL): technician name.
- `phone_e164` (varchar(16), NULL): normalized phone, if provided.
- `active` (boolean, NOT NULL, DEFAULT true): availability flag.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): creation time.

## INSTALLATION_TECHNICIAN — technician assignment junction

- `installation_id` (UUID, composite PK, FK to installation, NOT NULL): installation job.
- `technician_id` (UUID, composite PK, FK to technician, NOT NULL): assigned technician.
- `assigned_at` (timestamptz, NOT NULL, DEFAULT now()): assignment time.

## WARRANTY — coverage period for an equipment unit

- `id` (UUID, PK, NOT NULL): warranty identifier.
- `equipment_unit_id` (UUID, FK to equipment_unit, NOT NULL): covered unit.
- `starts_on` (date, NOT NULL): warranty start date; business rule starts from recorded delivery date.
- `ends_on` (date, NOT NULL): warranty end date; must be on/after start.
- `terms` (text, NULL): coverage details.

## SERVICE_TICKET — customer support/service request

- `id` (UUID, PK, NOT NULL): ticket identifier.
- `customer_id` (UUID, FK to customer, NOT NULL): customer raising ticket.
- `site_id` (UUID, FK to site, NULL): related site, if known.
- `equipment_unit_id` (UUID, FK to equipment_unit, NULL): affected unit, if known.
- `status` (varchar(24), NOT NULL): ticket state; do not mark resolved/closed until customer confirms resolution.
- `opened_at` (timestamptz, NOT NULL, DEFAULT now()): opening time.
- `closed_at` (timestamptz, NULL): closure time.

## SERVICE_ACTIVITY — service ticket event log

- `id` (UUID, PK, NOT NULL): activity identifier.
- `ticket_id` (UUID, FK to service_ticket, NOT NULL): parent ticket.
- `occurred_at` (timestamptz, NOT NULL, DEFAULT now()): activity time.
- `activity_type` (varchar(40), NOT NULL): activity category.
- `notes` (text, NULL): work performed/communication.

## SERVICE_PART — part consumed for a service ticket

- `id` (UUID, PK, NOT NULL): part usage identifier.
- `ticket_id` (UUID, FK to service_ticket, NOT NULL): service ticket.
- `product_id` (UUID, FK to product, NOT NULL): part/product used.
- `quantity` (numeric(12,3), NOT NULL): quantity used; positive.

## FILE_ASSET — metadata for files in Supabase Storage

- `id` (UUID, PK, NOT NULL): file metadata identifier.
- `site_survey_id` (UUID, FK to site_survey, NULL): survey parent, when this is the attachment type.
- `installation_id` (UUID, FK to installation, NULL): installation parent, when this is the attachment type.
- `service_ticket_id` (UUID, FK to service_ticket, NULL): ticket parent, when this is the attachment type.
- `storage_key` (text, NOT NULL): object key/path in Supabase Storage; do not store file bytes here.
- `original_name` (varchar(255), NOT NULL): original uploaded filename.
- `content_type` (varchar(120), NULL): MIME type if known.
- `uploaded_at` (timestamptz, NOT NULL, DEFAULT now()): upload time.
- Exactly one of the three parent IDs must be populated.

## PAYMENT — payment attempt/receipt against an order

- `id` (UUID, PK, NOT NULL): payment identifier.
- `order_id` (UUID, FK to sales_order, NOT NULL): order receiving payment.
- `amount` (numeric(14,2), NOT NULL): positive payment amount.
- `currency_code` (char(3), NOT NULL): ISO 4217 currency.
- `paid_at` (timestamptz, NULL): actual paid timestamp; null until confirmed paid.
- `status` (varchar(20), NOT NULL): payment state such as pending, paid, failed, refunded; exact allowed values to be finalized with backend implementation.
- `created_at` (timestamptz, NOT NULL, DEFAULT now()): record creation time.

## Shared data conventions

- UUIDs are used for all surrogate identifiers.
- E.164 phone numbers include a leading `+` and country calling code. For MVP, frontend accepts a 10-digit Indian number; backend applies configurable default country `+91`, validates, and stores normalized E.164. Never infer identity from phone number.
- Monetary values use `numeric(12,2)` or `numeric(14,2)` and an associated currency code; do not use `float`/`double precision`.
- `monthly_bill` on enquiry is the customer's initial estimate; survey `monthly_bill` is the subsequently confirmed/updated value.
