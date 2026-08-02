# Docker local development (migrate + seed)

## Overview

Local stack is started with Docker Compose (`postgres`, `server`, `web`). The server container applies Prisma migrations on start and, in development, seeds demo users and products.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Generate on start | `npx prisma generate` always runs so the client matches the mounted schema |
| Migrate on start | `npx prisma migrate deploy` always runs in the server `CMD` |
| Seed on start | Runs only when `SEED_DB=true` |
| Dev default | `SEED_DB` defaults to `true` via `docker-compose.yml` (`${SEED_DB:-true}`) and is set in `server/.env` |
| Production | Set `SEED_DB=false` (or omit and override compose) so demo accounts are not inserted |
| Seed data | `admin@example.com` / `customer@example.com`, password `password123`; categories + eight mock products with Supabase cover URLs |
| Idempotent seed | Uses `upsert`; existing users keep their current password (`update: {}`) |

## Implementation

- **Server startup:** `server/Dockerfile` — `prisma generate` → `migrate deploy` → optional `prisma db seed` → `npm run dev`
- **Compose default:** `docker-compose.yml` `server.environment.SEED_DB`
- **Env:** `server/.env` (`SEED_DB=true` for local development)
- **Seed script:** `server/prisma/seed.ts` (wired in `server/prisma.config.ts`)
- **Web startup:** `web/Dockerfile` runs `next dev --webpack` (see performance notes below)

## Performance (web container)

| Symptom | Cause |
|---------|--------|
| `GET /` takes several seconds | Cold compile after a Next.js **dev server restart** |
| `Server is approaching the used memory threshold, restarting...` | Next.js exits when V8 heap exceeds ~80% of `heap_size_limit` |
| High container RAM/CPU (`pfs_web`) | Turbopack in Docker was growing memory quickly and thrashing |

Mitigations already applied:

- Docker web uses **webpack** (`next dev --webpack`) instead of default Turbopack
- `NODE_OPTIONS=--max-old-space-size=4096` on the web service

If pages are slow again after a bad hot-reload (e.g. mid-refactor):

```bash
docker compose restart web
# or wipe the anonymous .next volume cache:
docker compose down && docker volume ls | grep next
```

Warm navigations should land around sub-second; multi-second timings usually mean a fresh compile after restart.

Optional later: upgrade Next.js past 16.2.x for Turbopack memory-eviction improvements (needs explicit package approval).

## Changes

- Enabled `SEED_DB=true` for the development phase so fresh volumes get admin/customer accounts after `docker compose up`.
- Startup now runs `prisma generate` before migrate/seed so schema changes (e.g. `Category`) are reflected in the client inside the anonymous `node_modules` volume.
- Web container uses webpack + raised Node heap to avoid Turbopack memory-threshold restart loops that made storefront routes feel very slow.
