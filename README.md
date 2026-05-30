# CookieCare

CookieCare is a full-stack TypeScript app (React + Express) for legal document workflows and website security/cookie scanning.

## Quick start

```bash
npm ci
npm run dev
```

App/API runs on `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and set keys as needed:

- Frontend (`VITE_API_BASE_URL`) points to backend API URL.
- Backend:
  - `DATABASE_URL` (optional; local JSON fallback when absent)
  - `GEMINI_API_KEY` (optional; AI fallback responses when absent)
  - `CORS_ORIGIN` (comma-separated frontend origins)
  - `SERVE_STATIC_FRONTEND=false` for backend-only Render deploys
  - `COOKIECARE_DEMO_MODE=true` for deterministic scanner fixtures

## MVP validation commands

```bash
npm run lint
npm run test
npm run build
```

## Production run

```bash
npm run build
npm run start
```

## Split deployment (Vercel + Render)

- Deploy frontend to Vercel with `VITE_API_BASE_URL` set to Render backend.
- Deploy backend to Render with `NODE_ENV=production` and `SERVE_STATIC_FRONTEND=false`.
- Verify backend health at `GET /api/health`.

## Offline fallback mode

When `DATABASE_URL` is missing, CookieCare persists to local JSON.  
When `GEMINI_API_KEY` is missing, AI-assisted flows return deterministic fallback content.