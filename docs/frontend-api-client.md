# Frontend API client

## Overview

The web app talks to the backend through shared helpers in `web/src/lib/api.ts`. In development, every request and response is logged to the browser console so endpoint traffic is easy to trace. Logging is disabled in production builds.

## Behavior / rules

- Use `apiFetch(path, options?)` for ordinary credentialed calls.
- Use `authFetch(path, options?)` when a 401 should trigger a single-flight refresh and retry.
- Do not call `fetch(\`${API_URL}...\`)` from components or pages; that bypasses logging, cookie defaults, and JSON Content-Type handling.
- When `body` is a string and no `Content-Type` is set, `apiFetch` sets `Content-Type: application/json` so Express `express.json()` can parse it. `FormData` / `Blob` bodies are left alone so the browser can set the correct type.
- Logs run only when `process.env.NODE_ENV === "development"` (Next.js `next dev`). Production (`next build` / `next start`) emits no API console logs.
- Log format: `[api] → METHOD /path` on request, `[api] ← METHOD /path STATUS` on response.

## Implementation

- `API_URL` — at request time in the browser: `""` (same-origin `/api/*` via Next.js rewrites). Server-side fallback: `NEXT_PUBLIC_API_URL`, default `http://localhost:5000`.
- `apiFetch` — sets `credentials: "include"`, defaults JSON Content-Type for string bodies, performs the request, and applies the dev-only logger.
- `authFetch` — wraps `apiFetch` with refresh-on-401 (except for `/api/auth/refresh`).
- Refresh uses the same `apiFetch` path so it is logged in development too.

## Changes

- Browser `apiFetch` uses same-origin `/api/*` (Next.js rewrite proxy) so auth cookies work on Safari/iOS in production.
- Added `apiFetch` with development-only request/response logging.
- Default `Content-Type: application/json` for string bodies when the caller omits it.
- Routed existing homepage and auth call sites through `apiFetch` / `authFetch`.
- Documented the convention in `.cursor/rules/frontend-api-logging.mdc`.
