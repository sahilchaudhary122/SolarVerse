# SolarVerse Database Design — Version 1.2

**PROPOSED – FINAL REVIEW VERSION – PENDING TEAM APPROVAL**

Version 1.2 is the final review design for the canonical 35-table PostgreSQL schema. Its status remains pending team approval. The design is implemented in SQLAlchemy metadata and forward-only Alembic revision 006; local PostgreSQL 16 migration and constraint checks are recorded in [`../DATABASE_RECONCILIATION.md`](../DATABASE_RECONCILIATION.md). Existing tables are preserved under the `solarverse_legacy` schema and are not silently copied into the new canonical tables.

The prior documentation identifies Version 1.0 at `f2b449c` and Version 1.1 at `307a14e`; the current workspace has no `.git` directory, so those commits cannot be verified here. Revisions 001–005 are preserved. Revision 006 archives their tables and creates the canonical schema. The migration test database was `solarverse_migration_test`; neither `solarverse_dev`, `safefinance`, nor Supabase was migrated.

## Documents

- [01-er-diagram.md](01-er-diagram.md) — Mermaid entity relationship diagram and cardinality notes.
- [02-database-schema.md](02-database-schema.md) — proposed PostgreSQL DDL, keys, constraints, indexes, cross-table checks, and unresolved schema decisions.
- [03-data-dictionary.md](03-data-dictionary.md) — explanation of every proposed table and column.
- [04-constraints-and-business-rules.md](04-constraints-and-business-rules.md) — the 14 backend review areas, business rules, implementation boundaries, and team approval questions.
- [05-canonical-table-registry.md](05-canonical-table-registry.md) — canonical names, keys, relationships, constraints, indexes, and dependencies for exactly 35 tables.

## Scope and standards

PostgreSQL is the proposed source of truth for relational data. SQLAlchemy 2.x and Alembic are the intended backend ORM/migration tools; Psycopg 3 is the documented PostgreSQL driver. Supabase Storage holds photo/document objects while PostgreSQL stores file metadata and storage keys.

The design aims to align the database-facing contract with the React/TypeScript/Zod frontend and FastAPI/Pydantic backend architecture. Backend business APIs still use legacy ORM mappings; frontend/backend integration with all 35 canonical tables is not implemented. API request/response shapes and data migration from the legacy schema require follow-up coordination with implementation owners.

The eight existing enquiry statuses are preserved: `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`. The six customer-interaction types and four site-survey statuses are documented in the schema. UUIDs are generated application-side with Python `uuid.uuid4()`; PostgreSQL UUID defaults are not used. Other new rules remain proposals unless explicitly confirmed by the team.

Authentication records are represented by `app_user`. Email is normalized and unique, password hashes are stored instead of passwords, and accounts are deactivated instead of deleted. Survey review history references its reviewer through `app_user` with `ON DELETE RESTRICT` and retains a reviewer-label snapshot.

## Change and review policy

Do not treat this version as approved until an explicit team approval record is available and the unresolved decisions in `02-database-schema.md` and `04-constraints-and-business-rules.md` are resolved. Proposed canonical names are `app_user`, `sales_order`, and `service_ticket`; `site_survey.enquiry_id` is required and its composite FK must match the enquiry's site. After any decision, update the five design documents and the registry together. Backend implementation owner: coordinate with the backend developer (Sahil/Member 3). Database design owner: Member 2.

## Local PostgreSQL and verification commands

Run commands from `backend/`. Use PostgreSQL 16 or later and a database dedicated to this project. The verified migration used `solarverse_migration_test`; the application database URL must be supplied through the environment or a local, untracked `backend/.env` file. Required production settings are `DATABASE_URL` with SSL, `SECRET_KEY` (at least 32 random characters), `ENVIRONMENT=production`, and `CORS_ORIGINS`. `JWT_ALGORITHM` defaults to `HS256`; `DEBUG` must be a boolean value. The frontend uses `VITE_API_BASE_URL` in its own environment.

```sh
cd backend
export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:PORT/solarverse_dev'
export SECRET_KEY='replace-with-at-least-32-random-characters'
export ENVIRONMENT=development
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload
```

Run unit and isolated PostgreSQL integration tests only when `DATABASE_URL` points to `solarverse_migration_test`:

```sh
cd backend
SOLARVERSE_RUN_PG_INTEGRATION=1 DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:PORT/solarverse_migration_test' .venv/bin/pytest -q
```

The current implementation is not production-ready: canonical schema and constraints were verified locally, but business workflows, canonical API integration, Supabase deployment, production secrets/SSL/pooling, backup/restore, and the explicit data-copy plan remain incomplete.
