# Product search

## Overview

Storefront product search lets visitors find products by name or description from the header search bar. Results render on the homepage. The API is public — no login required.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Query | Required `q` query param (trimmed); empty → `400` |
| Max query length | 100 characters (excess truncated) |
| Match | Case-insensitive `contains` on `name` **or** `description` |
| Limit | At most 48 products |
| Order | Newest first (`createdAt` desc) |
| Fields | Same product shape as homepage featured: `id`, `name`, `description`, `price` (number), `stock`, `imageUrl` (required cover) |
| Response | `{ q, products }` |
| Empty results | Homepage shows a short empty-state message |
| Failure | Homepage shows a short error message; does not fall back to mock data |
| UI entry | Header search form (md+); submits to `/?q=…` |
| Clear | “Clear search” link returns to `/` (hero + featured) |

## Implementation

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/products/search?q=` | Public | Search products by name/description |

- Controller: `searchProducts` in `server/src/controllers/products.controller.ts`
- Router: `GET /search` on `server/src/routes/products.ts` (mounted at `/api/products`)

### Web

- `web/src/components/header-search.tsx` — controlled search form; navigates to `/?q=…`
- `web/src/components/header.tsx` — wraps search in `Suspense` for `useSearchParams`
- `web/src/components/search-results.tsx` — fetches via `apiFetch`, renders `ProductCard` grid
- `web/src/app/page.tsx` — when `q` is present, shows search results instead of hero/categories/featured

## Changes

- Added public `GET /api/products/search`
- Wired header search to homepage `?q=` flow
- Added search results section on the homepage
