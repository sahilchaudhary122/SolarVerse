# Authentication and authorization review

## Verified implementation

- Passwords are hashed using `pwdlib.PasswordHash.recommended()`; login compares the submitted password with the stored hash and returns a generic invalid-credentials response.
- JWTs are signed with configured `SECRET_KEY` and `JWT_ALGORITHM`, contain a subject, role, and expiration (60 minutes), and are decoded with the configured algorithm allowlist. Optional `JWT_ISSUER` and `JWT_AUDIENCE` claims are added and verified when configured; production mode requires both. Current-user lookup reloads the account and rejects missing or inactive users.
- Production configuration rejects the placeholder/short secret, local PostgreSQL URL, missing HTTPS database SSL mode, an empty exact-origin CORS allowlist, or missing JWT issuer/audience. CORS is configured with `CORS_ORIGINS`.
- Customer account ownership has no canonical FK from `app_user` to `customer`; code uses normalized email. Portal and ticket operations fail closed unless exactly one customer matches. Portal quotations, orders, installations, dispatched equipment, warranties, and tickets use canonical ownership paths; cross-customer detail requests return 404. Ticket create/read/update ownership, customer status/assignment denial, report role restrictions, and admin role behavior are covered by PostgreSQL tests.
- `GET /auth/users`, provisioning, and activation require `system_admin`. User list responses omit password hashes. A system administrator cannot deactivate their own account.
- Staff ticket status/activity writes are restricted to the service staff role set; technician assignment requires `system_admin` or `service_manager`.

## Remaining risks and design decisions

- **Bearer token storage:** the frontend stores JWT in `sessionStorage`. It is scoped to the tab/session but remains accessible to same-origin JavaScript; XSS can disclose it. Review CSP and XSS defenses. HttpOnly `Secure` cookies would require coordinated backend cookie issuance/clearing, `SameSite` and CSRF protection, CORS credential handling, and frontend auth-client changes. No cookie migration was introduced.
- **Email-based identity linkage:** changing a customer's email is currently restricted because it is the account join key. Duplicate/ambiguous customer emails fail closed. A durable app-user/customer relationship needs team-approved schema and migration work.
- **Customer portal scope:** customer-scoped list/detail reads exist for quotations, orders, installations, dispatched equipment and warranties, plus dashboard counts. Customer document listing intentionally returns HTTP 409 until sharing authorization and secure storage/download behavior are approved. File routes store metadata only, not private file bytes. These are test-client/PostgreSQL workflow verified, not browser verified.
- **Operational account lifecycle:** no rate limiting, email verification, password reset, MFA, or admin action audit trail is implemented. Public customer registration is separate from staff provisioning; there is no public administrator-registration endpoint.
- **API docs:** OpenAPI/Swagger is enabled in all environments by application configuration. Production exposure policy remains to be decided.
- **Production identity configuration:** Set `ENVIRONMENT=production`, a random secret of at least 32 characters, a PostgreSQL URL with SSL verification, the exact HTTPS frontend origin in `CORS_ORIGINS`, and deployment-specific `JWT_ISSUER`/`JWT_AUDIENCE`. The repository contains no production values; deployment must set them out-of-band. Production first-admin creation requires an authorized, reviewed, one-time operational runbook, dual control or equivalent approval, secret-safe credential delivery, identity verification, audit logging, and a tested recovery path. The local bootstrap script must not be used for production and was not run in Stage 8.
- **Not verified:** Supabase RLS/network restrictions, backup/restore, production TLS and secret deployment, live hosted behavior, and deployed CORS configuration.

## First administrator bootstrap

Do not expose an unauthenticated administrator-creation API. For local setup, use a trusted local Python process and a `getpass` prompt, hash the password with the same application password hasher, and insert a canonical `app_user` with `role='system_admin'`. Before commit, assert `SELECT current_database()` equals the explicitly intended local database. Do not put plaintext passwords in shell history or logs. A production bootstrap needs a reviewed, auditable one-time operational procedure and authorized access; this repository has not established that procedure.
