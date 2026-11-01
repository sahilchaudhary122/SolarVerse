# SolarVerse frontend

React, TypeScript, Vite, React Router, and TanStack Query application. Production routes use a shared typed API client; customer portal pages cover owned quotations, orders, installations, dispatched equipment, warranties, and service requests. Reports and account administration use role-protected APIs.

## Local development

```sh
cd frontend
npm ci
[ -f .env.local ] || cp .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` to the FastAPI API root, such as `http://localhost:8000/api/v1`. Vite variables are public and bundled into browser code: never place database credentials, JWT signing secrets, or provider service keys here.

## Quality checks

```sh
npm run lint
npm run build
```

The build runs the TypeScript project build before Vite emits production assets. Production routes are split into lazy-loaded page chunks. Authenticated API requests use the shared `src/lib/apiClient.ts` client and token held in `sessionStorage`; see `../docs/SECURITY_REVIEW.md` for XSS implications and `../docs/API_REFERENCE.md` for customer document and pricing policy limits. Customer document sharing returns a clear unavailable response until a visibility policy and storage service exist.
