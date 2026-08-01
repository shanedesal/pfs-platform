# Admin dashboard

## Overview

The admin section (`/admin`) is gated to authenticated users with the `ADMIN` role. The first admin screen is a dashboard overview showing summary cards for store activity — products, orders, customers, and sales. Only metrics backed by an existing table (products, customers) are wired to real data for now; order and sales metrics are placeholders until those features exist.

## Behavior / rules

### Access

| Rule | Detail |
|------|--------|
| Auth | Must be logged in |
| Role | Must be `ADMIN`; non-admins are redirected to `/` |
| Unauthenticated | Redirected to `/login` |
| Shell | Admin pages share a top bar (brand, "Back to store", theme toggle, logout) separate from the storefront header |

### Dashboard summary cards

| Card | Source | Detail |
|------|--------|--------|
| Total Products | `GET /api/admin/dashboard-stats` | Count of all rows in `Product` |
| Total Orders | None yet | Shows "—" with a "Coming soon" hint; no `Order` table exists |
| Pending Orders | None yet | Shows "—" with a "Coming soon" hint |
| Completed Orders | None yet | Shows "—" with a "Coming soon" hint |
| Total Customers | `GET /api/admin/dashboard-stats` | Count of `User` rows with `role = CUSTOMER` (admins excluded) |
| Total Sales | None yet | Shows "—" with a "Coming soon" hint; no orders/payments data exists |

| Rule | Detail |
|------|--------|
| Auth | `dashboard-stats` requires `ADMIN` (401 if not authenticated, 403 if not admin) |
| Loading | Cards backed by the API show a skeleton pulse while loading |
| Failure | A short inline message is shown if the stats request fails; cards keep their placeholder dashes |

## Implementation

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/dashboard-stats` | Admin only | `{ totalProducts, totalCustomers }` |

- Controller/router: `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.ts`
- Registered in `server/src/index.ts` under `/api/admin`
- Uses existing `authenticate` + `authorize("ADMIN")` middleware (`server/src/middleware/auth.middleware.ts`)

### Web

- `web/src/app/admin/layout.tsx` — role/auth guard only (unchanged logic); renders `AdminHeader` + `children`
- `web/src/components/admin/` — admin-only components, kept separate from shared/storefront components in `web/src/components/`:
  - `admin/header.tsx` — admin top bar (logo, "Admin" badge, back-to-store link, theme toggle, logout); separate from the storefront `Header` since admin has no search/cart/account-dropdown concerns
  - `admin/stat-card.tsx` — dashboard summary card: label, icon, value (or "—"), optional "Coming soon" hint, loading skeleton
- `web/src/components/logo.tsx` — shared PFS wordmark (`/logo.svg`), used by both the storefront `Header` and `admin/header.tsx` so sizing/markup isn't duplicated
- `web/src/app/admin/page.tsx` — fetches `/api/admin/dashboard-stats` via `authFetch` and renders the six summary cards using `admin/stat-card.tsx`
- `web/src/lib/admin.ts` — `DashboardStats` type
- Same fonts/colors/tokens as the storefront (`--color-brand`, `--color-ink`, `--color-paper`, `--color-slate`, `font-display`); no new design tokens introduced

## Changes

- Added `GET /api/admin/dashboard-stats` (admin only): total products, total customers
- Replaced the placeholder admin dashboard page with six summary cards (products, orders, pending orders, completed orders, customers, sales)
- Added a dedicated `admin/header.tsx` component (logo, "Admin" badge, back to store, theme toggle, logout) instead of storefront `Header`, and instead of inlining markup in `admin/layout.tsx`
- Extracted a shared `Logo` component reused by both `Header` and `admin/header.tsx`
- Moved admin-only components into `web/src/components/admin/` (separate from shared/storefront components), dropping the redundant `admin-` filename prefix now that the folder namespaces them
- Order/sales cards are intentionally blank pending future `Order`/payments data model
