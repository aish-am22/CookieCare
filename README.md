# CookieCare

## Local development

```bash
npm ci
npm run dev
```

The app now dynamically selects available ports for both Express (`server.ts`) and Vite (`vite.config.ts`) so it can run in Codespaces and local environments without manual port conflict fixes.

## Environment variables

- `GEMINI_API_KEY` (required for AI features)
- `DATABASE_URL` (optional; when absent/unavailable the app falls back to local JSON storage)
- `PORT` / `SERVER_PORT` (optional preferred backend start port)
- `VITE_PORT` (optional preferred frontend start port)
- `CORS_ORIGIN` (optional comma-separated origins for split frontend/backend dev)
- `SESSION_COOKIE_DOMAIN` (optional cookie domain override)
- `SESSION_TTL_SECONDS` (optional session cookie lifetime)

## Reliability behavior

- DB init retries on startup when `DATABASE_URL` is provided, then gracefully falls back to local storage if unavailable.
- Auth now supports both Authorization headers and HTTP-only session cookies, improving behavior behind reverse proxies (including Codespaces).