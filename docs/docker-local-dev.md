# Docker local development (migrate + seed)

## Overview

Local stack is started with Docker Compose (`postgres`, `server`, `web`). The server container applies Prisma migrations on start and, in development, seeds demo users and products.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Migrate on start | `npx prisma migrate deploy` always runs in the server `CMD` |
| Seed on start | Runs only when `SEED_DB=true` |
| Dev default | `SEED_DB` defaults to `true` via `docker-compose.yml` (`${SEED_DB:-true}`) and is set in `server/.env` |
| Production | Set `SEED_DB=false` (or omit and override compose) so demo accounts are not inserted |
| Seed data | `admin@example.com` / `customer@example.com`, password `password123`; eight mock products |
| Idempotent seed | Uses `upsert`; existing users keep their current password (`update: {}`) |

## Implementation

- **Server startup:** `server/Dockerfile` — `migrate deploy` → optional `prisma db seed` → `npm run dev`
- **Compose default:** `docker-compose.yml` `server.environment.SEED_DB`
- **Env:** `server/.env` (`SEED_DB=true` for local development)
- **Seed script:** `server/prisma/seed.ts` (wired in `server/prisma.config.ts`)

## Changes

- Enabled `SEED_DB=true` for the development phase so fresh volumes get admin/customer accounts after `docker compose up`.
