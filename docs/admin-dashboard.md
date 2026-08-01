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

- `web/src/app/admin/layout.tsx` — role/auth guard (unchanged logic) plus a simple admin top bar (brand, back-to-store link, theme toggle, logout)
- `web/src/app/admin/page.tsx` — fetches `/api/admin/dashboard-stats` via `authFetch` and renders the six summary cards
- `web/src/components/admin-stat-card.tsx` — shared card: label, icon, value (or "—"), optional "Coming soon" hint, loading skeleton
- `web/src/lib/admin.ts` — `DashboardStats` type
- Same fonts/colors/tokens as the storefront (`--color-brand`, `--color-ink`, `--color-paper`, `--color-slate`, `font-display`); no new design tokens introduced

## Changes

- Added `GET /api/admin/dashboard-stats` (admin only): total products, total customers
- Replaced the placeholder admin dashboard page with six summary cards (products, orders, pending orders, completed orders, customers, sales)
- Added a minimal admin top bar in the admin layout (brand, back to store, theme toggle, logout)
- Order/sales cards are intentionally blank pending future `Order`/payments data model
