# Changelog

Project change log. Updated whenever feature documentation under `docs/` is added or revised.

Entries are newest first.

## 2026-08-02 — Storefront vs admin component folders

- **Doc:** `docs/frontend-components.md` (paths updated in homepage/product/admin docs)
- **What changed:** Moved customer-facing UI into `web/src/components/storefront/`, keeping `web/src/components/admin/` for admin-only UI and shared `logo` / `theme-toggle` at the components root. Import paths and docs updated accordingly; no behavior change.
- **Files:** `web/src/components/storefront/*`, `web/src/app/page.tsx`, `web/src/app/products/page.tsx`, `web/src/app/products/[id]/page.tsx`, `docs/frontend-components.md`, `docs/product-listing.md`, `docs/product-search.md`, `docs/homepage-featured.md`, `docs/homepage-footer.md`, `docs/product-images.md`, `docs/admin-dashboard.md`

## 2026-08-02 — Storefront product listing page

- **Doc:** `docs/product-listing.md` (also updated `docs/product-search.md`, `docs/homepage-featured.md`)
- **What changed:** Added a dedicated `/products` catalog with search, category filter, price sorting, and pagination (default 12/page). `GET /api/products` is now a paginated public catalog (excludes inactive); added `GET /api/products/:id` plus a simple detail page. Homepage/header CTAs and search now route into the catalog; seed expanded to 12 sample products.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `server/src/controllers/homepage.controller.ts`, `server/prisma/seed.ts`, `web/src/app/products/page.tsx`, `web/src/app/products/[id]/page.tsx`, `web/src/components/product-catalog.tsx`, `web/src/components/product-detail.tsx`, `web/src/components/product-card.tsx`, `web/src/components/featured-products.tsx`, `web/src/components/category-nav.tsx`, `web/src/components/hero.tsx`, `web/src/components/header.tsx`, `web/src/components/header-search.tsx`, `web/src/app/page.tsx`, `web/src/lib/product.ts`, `docs/product-listing.md`, `docs/product-search.md`, `docs/homepage-featured.md`

## 2026-08-01 — Admin product filter selects dark-mode fix

- **Doc:** `docs/admin-products.md`
- **What changed:** Category/status filter dropdowns (and the matching selects in the product form) used `bg-transparent` with tight horizontal padding, so in dark mode the native option list was hard to read and the caret sat flush against the border. Selects now use solid `bg-paper` / `dark:bg-ink-soft`, extra right padding, global `color-scheme`, and option colors for readable popups.
- **Files:** `web/src/app/admin/products/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/app/globals.css`, `docs/admin-products.md`

## 2026-08-01 — Mobile header product search

- **Doc:** `docs/product-search.md`
- **What changed:** Storefront header search was desktop-only (`hidden` below `md`). On mobile, a search icon now sits with the theme/cart actions and opens a full-width search bar under the header (auto-focus, Escape/submit to close). Same `/?q=…` flow as desktop.
- **Files:** `web/src/components/header-search.tsx`, `web/src/components/header.tsx`, `docs/product-search.md`

## 2026-08-01 — Admin `lib` code moved under `lib/admin/`

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Moved the admin-only frontend data modules into `web/src/lib/admin/` (`lib/admin.ts` → `lib/admin/dashboard.ts`, `lib/admin-products.ts` → `lib/admin/products.ts`, `lib/admin-categories.ts` → `lib/admin/categories.ts`), mirroring the existing `web/src/components/admin/` split so admin-only code is grouped separately from shared/storefront `lib` code. No behavior change — updated all importers accordingly.
- **Files:** `web/src/lib/admin/dashboard.ts`, `web/src/lib/admin/products.ts`, `web/src/lib/admin/categories.ts`, `web/src/app/admin/page.tsx`, `web/src/app/admin/products/page.tsx`, `web/src/app/admin/categories/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/components/admin/category-form.tsx`, `docs/admin-dashboard.md`, `docs/admin-products.md`, `docs/admin-categories.md`

## 2026-08-01 — Admin category management

- **Doc:** `docs/admin-categories.md`
- **What changed:** Added admin category CRUD (`GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/:id`) with product counts. Deletion is hard-blocked (`409`) while any product still references the category; the `/admin/categories` page shows a table with add/edit modal and a delete confirmation whose button is disabled (with a tooltip) when the category is in use.
- **Files:** `server/src/controllers/admin-categories.controller.ts`, `server/src/routes/admin.ts`, `web/src/app/admin/categories/page.tsx`, `web/src/components/admin/category-form.tsx`, `web/src/lib/category.ts`, `web/src/lib/admin-categories.ts`, `docs/admin-categories.md`

## 2026-08-01 — Admin product management + image uploads

- **Doc:** `docs/admin-products.md`
- **What changed:** Added full admin product CRUD (view/search/filter/add/edit/delete) at `/admin/products`, with a confirmation dialog before delete. Added a `ProductStatus` enum (`Active`/`Inactive`/`Out of Stock`, manually set, independent of stock) and admin endpoints under `/api/admin/products` (list with search/category/status filters + pagination, get, create, update, delete). Product images (cover + optional gallery, backed by the existing `ProductImage` table) are now real file uploads to Supabase Storage via a new `POST /api/admin/products/upload-image` endpoint, instead of a plain URL field. Removed the old public admin-create route on `POST /api/products` (superseded by `/api/admin/products`). Bumped the server Docker image to `node:22-alpine` (required by `@supabase/supabase-js`).
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801071445_add_product_status/`, `server/src/config/supabase.ts`, `server/src/middleware/upload.middleware.ts`, `server/src/controllers/admin-products.controller.ts`, `server/src/routes/admin.ts`, `server/src/routes/products.ts`, `server/src/controllers/products.controller.ts`, `server/src/utils/env.ts`, `server/Dockerfile`, `server/package.json`, `web/src/app/admin/products/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/lib/product.ts`, `web/src/lib/admin-products.ts`, `docs/admin-products.md`

## 2026-08-01 — Admin sidebar shell + shared dialog primitives

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Restyled the admin shell with a left sidebar (`Dashboard` / `Products` / `Categories`) alongside the existing top bar, shared by all `/admin/*` pages. Added reusable `Modal` and `ConfirmDialog` components used by the new Products and Categories management pages.
- **Files:** `web/src/app/admin/layout.tsx`, `web/src/components/admin/sidebar.tsx`, `web/src/components/admin/modal.tsx`, `web/src/components/admin/confirm-dialog.tsx`, `docs/admin-dashboard.md`

## 2026-08-01 — Homepage footer contact + social links

- **Doc:** `docs/homepage-footer.md`
- **What changed:** Expanded the homepage footer with a Contact column (dummy email/phone/address) and a Follow us column (dummy Facebook/Instagram/X/LinkedIn links), keeping the existing copyright + Help/Terms/Privacy row. Added small inline SVG brand icons since `lucide-react` doesn't ship trademarked social logos.
- **Files:** `web/src/components/footer.tsx`, `web/src/components/social-icons.tsx`, `docs/homepage-footer.md`

## 2026-08-01 — Admin dashboard overview

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Overhauled the placeholder `/admin` page into a dashboard with six summary cards (Total Products, Total Orders, Pending Orders, Completed Orders, Total Customers, Total Sales). Added admin-only `GET /api/admin/dashboard-stats` returning product and customer counts; order/sales cards are placeholders pending an orders data model. Admin chrome now lives in a dedicated `admin/header.tsx` component (logo, "Admin" badge, back to store, theme toggle, logout), keeping `admin/layout.tsx` limited to the auth/role guard; extracted a shared `Logo` component reused by both the storefront `Header` and `admin/header.tsx`. Admin-only components live under `web/src/components/admin/` (separate from shared/storefront components) to keep the components folder from getting mixed.
- **Files:** `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.ts`, `server/src/index.ts`, `web/src/app/admin/page.tsx`, `web/src/app/admin/layout.tsx`, `web/src/components/admin/header.tsx`, `web/src/components/admin/stat-card.tsx`, `web/src/components/logo.tsx`, `web/src/components/header.tsx`, `web/src/lib/admin.ts`, `docs/admin-dashboard.md`

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
