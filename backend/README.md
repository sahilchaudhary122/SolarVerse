# SolarVerse backend

FastAPI application using SQLAlchemy 2.x, Psycopg 3, PostgreSQL, and Alembic.

## Configure and start

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL database explicitly provisioned for local development. Replace `SECRET_KEY` with a locally generated secret. `CORS_ORIGINS` must contain the frontend origin as a JSON array (for Vite, `http://localhost:5173`). Do not place backend secrets in frontend variables.

```sh
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

The app does not create databases or apply Alembic revisions on startup. Open `http://localhost:8000/docs` for OpenAPI, `http://localhost:8000/api/v1/health` for liveness, and `http://localhost:8000/api/v1/health/database` for database readiness.

## Tests

Unit/API tests:

```sh
PYTHONPATH=. .venv/bin/pytest -q
```

The service-ticket PostgreSQL tests run only when explicitly enabled. They verify the database name is exactly `solarverse_workflow_test`, wrap API calls in an outer transaction, and roll back test rows:

```sh
env -u DEBUG \
  DATABASE_URL='postgresql+psycopg://localhost/solarverse_workflow_test' \
  SOLARVERSE_RUN_WORKFLOW_PG=1 \
  SECRET_KEY='use-a-local-random-secret-of-at-least-32-characters' \
  PYTHONPATH=. .venv/bin/pytest -q tests/test_support_workflows_pg.py
```

Never point this test command at a protected, hosted, or production database. See `../docs/TEST_RESULTS.md` and `../docs/SECURITY_REVIEW.md` for verified boundaries.

## First administrator

There is no public administrator registration route. A one-time local bootstrap script is available for the authorized test environment only. It rejects non-development mode, non-loopback hosts, URLs whose database name is not exactly `solarverse_workflow_test`, and a missing, placeholder, or short `SECRET_KEY` before opening a connection. Configure `backend/.env` with a random local secret of at least 32 characters first. The script then checks `SELECT current_database()`, refuses if any system administrator exists, and prompts for a 16-character password with `getpass` (confirmation required). It uses the project's password hasher and never prints the password.

Run it only when intentionally provisioning the isolated local test database:

```sh
cd backend
env -u DEBUG \
  ENVIRONMENT=development \
  DATABASE_URL='postgresql+psycopg://localhost/solarverse_workflow_test' \
  PYTHONPATH=. .venv/bin/python scripts/bootstrap_admin.py
```

This Stage 7 task did not execute the script or create an administrator. Production administrator provisioning requires a separate reviewed operational runbook, access controls, and audit trail; this local script rejects production and hosted databases.
