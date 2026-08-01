# Changelog

Project change log. Updated whenever feature documentation under `docs/` is added or revised.

Entries are newest first.

## 2026-08-01 — Product cover images + gallery model

- **Doc:** `docs/product-images.md`
- **What changed:** `Product.imageUrl` is required (cover). Added empty `ProductImage` gallery table for future detail views. Seed fills covers from public Supabase Storage. Product cards render covers; `POST /api/products` requires `imageUrl`.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801070000_product_images_required_cover/`, `server/prisma/seed.ts`, `server/src/controllers/products.controller.ts`, `web/src/components/product-card.tsx`, `web/src/lib/product.ts`, `docs/homepage-featured.md`, `docs/product-search.md`, `docs/baseline-project-state.md`

## 2026-08-01 — Homepage category product filter

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Category chips navigate to `/?category=<id>` and load products from public `GET /api/products/by-category?categoryId=`. “All” restores featured products. Works logged out.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `web/src/components/category-nav.tsx`, `web/src/components/featured-products.tsx`, `web/src/app/page.tsx`, `docs/homepage-featured.md`

## 2026-08-01 — Public product search from header

- **Doc:** `docs/product-search.md`
- **What changed:** Added public `GET /api/products/search?q=` (name/description, case-insensitive). Header search navigates to `/?q=…`; homepage shows a results grid (works logged out). Uses `apiFetch`.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `web/src/components/header-search.tsx`, `web/src/components/header.tsx`, `web/src/components/search-results.tsx`, `web/src/app/page.tsx`, `docs/product-search.md`

## 2026-08-01 — Frontend API client logging (dev only)

- **Doc:** `docs/frontend-api-client.md`
- **What changed:** Added shared `apiFetch` that logs method/path/status in development only. String bodies default to `Content-Type: application/json` when unset (FormData/Blob unchanged). Existing homepage and auth fetches now use `apiFetch`/`authFetch` instead of raw `fetch`.
- **Files:** `web/src/lib/api.ts`, `web/src/lib/auth-context.tsx`, `web/src/components/category-nav.tsx`, `web/src/components/featured-products.tsx`, `web/src/app/login/page.tsx`, `web/src/app/register/page.tsx`, `.cursor/rules/frontend-api-logging.mdc`, `docs/frontend-api-client.md`

## 2026-08-01 — Prisma generate on server container start

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Server Docker `CMD` runs `npx prisma generate` before migrate/seed so the client matches the mounted schema (fixes missing models like `prisma.category` after schema changes).
- **Files:** `server/Dockerfile`, `docs/docker-local-dev.md`

## 2026-08-01 — Homepage categories from database

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Added `Category` table and optional `Product.categoryId`. Homepage category nav loads from `GET /api/homepage/categories`. Seed upserts categories and links mock products. No admin CRUD yet.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801050000_add_product_categories/`, `server/prisma/seed.ts`, `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`, `web/src/components/category-nav.tsx`, `web/src/lib/category.ts`, `docs/homepage-featured.md`

## 2026-08-01 — Homepage featured products from database

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Homepage “Trending now” grid loads from `GET /api/homepage/featured` (Product table, limit 8). Removed `web/src/lib/mock-data.ts`.
- **Files:** `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`, `server/src/index.ts`, `web/src/components/featured-products.tsx`, `web/src/components/product-card.tsx`, `web/src/components/category-nav.tsx`, `web/src/lib/product.ts`, `docs/homepage-featured.md`

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
