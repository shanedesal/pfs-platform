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
| `can't infer type of chunk from URL app-pages-internals` | Browser still has Turbopack client chunks while the server runs webpack (stale `.next`) |

Mitigations already applied:

- Docker web uses **webpack** (`next dev --webpack`) instead of default Turbopack
- `NODE_OPTIONS=--max-old-space-size=4096` on the web service
- `web/.dockerignore` excludes `.next` / `node_modules` so image builds do not bake a Turbopack (or other) cache that Docker then copies into the anonymous `/app/.next` volume

### Stale `.next` / Turbopack–webpack mismatch

Compose mounts an anonymous volume at `/app/.next`. If that volume (or the image) still contains Turbopack output while the container runs `--webpack`, client navigations can throw `can't infer type of chunk from URL app-pages-internals` and fall back to a full browser navigation.

Hard reset (keeps Postgres data):

```bash
docker compose stop web
docker rm -f pfs_web
# remove the anonymous volume currently mounted at /app/.next (id from inspect):
docker inspect pfs_web --format '{{range .Mounts}}{{if eq .Destination "/app/.next"}}{{.Name}}{{end}}{{end}}'  # if container still exists
# or after rm: docker volume ls -f dangling=true
docker volume rm <volume-id>
docker compose build web
docker compose up -d web
```

Then hard-refresh the browser (or clear site data for `localhost:3000`) so old Turbopack scripts are not cached.

If pages are only slow after a bad hot-reload (e.g. mid-refactor):

```bash
docker compose restart web
```

Warm navigations should land around sub-second; multi-second timings usually mean a fresh compile after restart.

### Stale Prisma client after schema changes

If a new model or column was added (e.g. `Cart`, `User.phoneNumber`) while `pfs_server` was already running, API handlers may return generic `500` errors. Examples:

- Cart: `Failed to add item to cart` — logs show `Cannot read properties of undefined (reading 'findUnique')` on `prisma.cart`
- Auth: login returns `200` but the session never sticks — `/api/auth/me` returns `500` / `Failed to fetch user` because the generated client does not yet know about a new field (e.g. `phoneNumber`)

Migrations only run on container **start**, not when new migration files appear on the mounted volume. After pulling schema changes:

```bash
docker compose exec server npx prisma migrate deploy
docker compose exec server npx prisma generate
docker compose restart server
```

A restart alone also works if you prefer — startup runs `generate` → `migrate deploy` → seed → dev.

Optional later: upgrade Next.js past 16.2.x for Turbopack memory-eviction improvements (needs explicit package approval).

### API proxy inside Docker (`ECONNREFUSED` on `localhost:5000`)

Browser calls use same-origin `/api/*`. Next.js rewrites those to the Express API (`web/next.config.ts`). Host-only `NEXT_PUBLIC_API_URL=http://localhost:5000` is wrong **inside** `pfs_web`: `localhost` is the web container, so logs show `Failed to proxy http://localhost:5000/... ECONNREFUSED`.

Compose sets:

| Variable | Value | Purpose |
|----------|-------|---------|
| `API_PROXY_TARGET` | `http://server:5000` | Rewrite destination (compose DNS name for `pfs_server`) |
| `NEXT_PUBLIC_API_URL` | `http://server:5000` | SSR `apiFetch` when there is no `window` |

After changing these, restart web so Next reloads config: `docker compose up -d web`.

## Changes

- Enabled `SEED_DB=true` for the development phase so fresh volumes get admin/customer accounts after `docker compose up`.
- Startup now runs `prisma generate` before migrate/seed so schema changes (e.g. `Category`) are reflected in the client inside the anonymous `node_modules` volume.
- Web container uses webpack + raised Node heap to avoid Turbopack memory-threshold restart loops that made storefront routes feel very slow.
- Added `web/.dockerignore` and rebuild guidance so a host Turbopack `.next` is not copied into the image / anonymous volume (fixes chunk-type inference errors after switching to webpack).
- **2026-08-04:** Set `API_PROXY_TARGET` / `NEXT_PUBLIC_API_URL` to `http://server:5000` on the web service so Docker rewrites and SSR reach the API (fixes `ECONNREFUSED` proxy logs).
