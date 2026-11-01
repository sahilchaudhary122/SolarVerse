# Supabase setup

Supabase is not currently verified as connected. No credentials were supplied, and source defaults previously targeted local PostgreSQL. The backend reads `DATABASE_URL`; FastAPI and Alembic use the same settings source.

1. In the Supabase dashboard, obtain the PostgreSQL connection string appropriate for the deployment network/pooler.
2. Set backend-only `DATABASE_URL`, using the Psycopg 3 SQLAlchemy scheme (`postgresql+psycopg://...`) and required SSL mode (`sslmode=require` where applicable).
3. Set `ENVIRONMENT=production`, a random `SECRET_KEY` of at least 32 characters, and `CORS_ORIGINS` to a JSON list of exact trusted frontend origins.
4. Keep credentials in the hosting provider's secret manager; do not put them in frontend variables.
5. Verify connectivity with `GET /api/v1/health/database` in the configured environment. It runs `SELECT 1` and does not modify data.
6. Review `alembic current` against the intended database before applying any migration. Do not migrate production without explicit approval.

Supabase Storage remains NOT IMPLEMENTED. A private bucket, backend service-role credential, upload validation, signed URL policy, and `file_asset` persistence are still required. Never expose the service-role key to the browser.
