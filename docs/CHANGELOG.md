# Changelog

Project change log. Updated whenever feature documentation under `docs/` is added or revised.

Entries are newest first.

## 2026-08-01 — Enable DB seed by default in local Docker

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Set `SEED_DB=true` for development so server startup runs `prisma db seed` after migrations (admin/customer + mock products).
- **Files:** `server/.env`, `docker-compose.yml`, `docs/docker-local-dev.md`

## 2026-08-01 — Auth refresh race hardening + logout rate limit

- **Doc:** `docs/auth-sessions.md`
- **What changed:** Refresh rotation now atomically claims the presented token; mass logout on reuse only applies when a revoked token is replayed outside a 30s grace window. Frontend `authFetch` single-flights refresh. Logout is rate-limited.
- **Files:** `server/src/controllers/auth.controller.ts`, `server/src/middleware/rateLimiter.ts`, `server/src/routes/auth.ts`, `web/src/lib/api.ts`, `docs/auth-sessions.md`

## 2026-08-01 — Baseline project state documented

- **Doc:** `docs/baseline-project-state.md`
- **What changed:** Captured the initial operational basepoint of PFS before further Cursor-driven feature work — monorepo layout, auth/products APIs, storefront pages, data model, Docker topology, and known gaps/placeholders.
- **Files:** `docs/baseline-project-state.md`, `docs/CHANGELOG.md`

<!--
## YYYY-MM-DD — Short summary

- **Doc:** `docs/feature-name.md`
- **What changed:** concise explanation of behavior and implementation updates
- **Files:** key paths touched
-->
