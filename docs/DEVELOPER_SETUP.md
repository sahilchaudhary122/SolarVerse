# Developer setup

## Backend

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
# Set DATABASE_URL to an explicitly provisioned local PostgreSQL database,
# replace SECRET_KEY with a random local secret, and configure CORS_ORIGINS.
# JWT_ISSUER and JWT_AUDIENCE are optional locally; required in production.
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

The example PostgreSQL URL is a placeholder. The application does not create a database or run migrations at startup. For a new developer environment, provision a disposable local PostgreSQL database and verify `SELECT current_database()` before considering any migration command. Review migration files and obtain required schema approval first. This documentation task did not apply migrations.

For a new database, migrations must be reviewed and applied only after approval, with the exact local database verified first. No migration command was run for this handoff.

## Frontend

```sh
cd frontend
npm ci
[ -f .env.local ] || cp .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root, for example `http://localhost:8000/api/v1`. Only public configuration belongs in Vite environment variables. Never expose secrets there.

## Verify local startup

With the backend running, open or request:

- `GET http://localhost:8000/api/v1/health` — application liveness.
- `GET http://localhost:8000/api/v1/health/database` — PostgreSQL readiness for the configured database.
- `http://localhost:8000/docs` — interactive OpenAPI.
- `http://localhost:5173` — Vite frontend.

Use the database readiness endpoint only after confirming `DATABASE_URL` targets the intended local database.

## Checks

```sh
cd frontend && npm run build && npm run lint
cd backend && PYTHONPATH=. pytest -q
```

The service-ticket PostgreSQL workflow suite is opt-in and guards `current_database()` against anything other than `solarverse_workflow_test`; its request data rolls back. The full suite also includes four schema integration tests pinned to the separately protected `solarverse_migration_test`; do not enable `SOLARVERSE_RUN_PG_INTEGRATION` as part of Stage 7. Current run details are in `TEST_RESULTS.md`. The local administrator bootstrap additionally requires a random `SECRET_KEY` of at least 32 characters in `backend/.env` and is documented in `../backend/README.md`.
