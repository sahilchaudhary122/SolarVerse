# Stage 8 verification results

Verified on 2026-11-01 in the handoff workspace. Before running database-backed tests, a direct read-only query returned `solarverse_workflow_test` from `SELECT current_database()`. The PostgreSQL tests use the exact local workflow database URL; fixtures guard database identity and roll back synthetic writes. No migrations, schema changes, resets, or non-workflow database connections were performed.

## Executed in Stage 8

| Check | Result | Evidence / limits |
|---|---|---|
| Full backend suite | **PASS: 48 passed, 4 skipped** | `env -u DEBUG DATABASE_URL='postgresql+psycopg://localhost/solarverse_workflow_test' SOLARVERSE_RUN_WORKFLOW_PG=1 SECRET_KEY='(local test secret)' PYTHONPATH=. .venv/bin/pytest -q` from `backend/`. No test failures were hidden. |
| Skipped schema PostgreSQL tests | **SKIPPED: 4** | `tests/test_canonical_schema.py` requires `SOLARVERSE_RUN_PG_INTEGRATION=1` and hard-codes `solarverse_migration_test`; enabling it would violate Stage 8's database restriction. The pure metadata registration test in that module ran as part of the suite. |
| Ticket, portal, admin and reporting workflow tests | **PASS: included in full suite** | The full run includes the opt-in `tests/test_support_workflows_pg.py` under `SOLARVERSE_RUN_WORKFLOW_PG=1`, including ticket ownership/regression, portal ownership, reports, and admin operations. Request data rolls back. |
| Database identity after test run | **PASS** | Database target was explicitly `solarverse_workflow_test`; test fixtures perform an identity assertion before database operations. No migration was run. |
| ESLint | **PASS** | `npm run lint` from `frontend/`. |
| TypeScript | **PASS** | `npm run build` runs `tsc -b` before Vite. |
| Production build | **PASS** | `npm run build`; largest emitted JavaScript chunk: 333.34 kB (below 500 kB advisory). Route-level page modules remain lazy-loaded. |
| Backend Python syntax | **PASS** | `python -m compileall -q app scripts` (from `backend/`) was run in the preceding finalization pass. |
| OpenAPI / canonical API workflows | **PASS, test-client scope** | Prior Stage 7 evidence generated 69 paths and PostgreSQL-backed tests exercised new portal/report behavior. This is not a browser or live-server verification. |
| Browser automation | **NOT TESTED** | No browser binary or installed Playwright/Puppeteer/Cypress package was found. Browser package/binary installation was not attempted. |
| Full 25-workflow browser or end-to-end rerun | **NOT TESTED** | Stage 5 historical workflow reports were not repeated in this sprint; Stage 8 reran the full backend suite and frontend static/build checks. |
| Production / Supabase | **NOT TESTED** | No hosted credentials or connection were used. |

The suite emitted one Starlette deprecation warning concerning its `httpx` TestClient integration; it did not fail the run. The skipped tests do not count as passed.

## Frontend inspection notes

Production pages in `App.tsx` use lazy-loaded modules. The API client reads `VITE_API_BASE_URL`, attaches the session bearer token, clears it on 401 and inactive-account rejection, and surfaces API detail/validation/network errors. A 403 is not treated as session expiry and is surfaced as an authorization error. `SalesDashboard` and `SurveyorDashboard` demo/local-state screens are only mounted at development-only `*-preview` routes; they are not production workflow pages. Customer document UI states that sharing is unavailable, and notification/settings placeholders do not claim persisted functionality.

## Historical evidence and limits

Stage 6 verified canonical schema parity against PostgreSQL `solarverse_migration_test` (35 tables, metadata/columns/nullability/PK/FK/check/unique/index/numeric/timezone parity and 54 FK orphan checks). That database was not connected during Stage 8. Stage 7 ran the same full backend suite with 48 passed and 4 skipped; Stage 8 has now repeated it against the authorized workflow database.

Neither this report nor the successful build establishes browser behavior, financial reconciliation, customer document sharing, a populated legacy conversion, production configuration, or production readiness.
