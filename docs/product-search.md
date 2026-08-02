# Product search

## Overview

Storefront product search lets visitors find products by name or description from the header search bar. Results render on the **product listing page** (`/products`). The API is public — no login required.

The dedicated `GET /api/products/search` endpoint remains available; the catalog page primarily uses the paginated `GET /api/products?q=` endpoint (see `docs/product-listing.md`).

## Behavior / rules

| Rule | Detail |
|------|--------|
| Public | No auth required |
| UI entry | Header search — inline form on md+; on smaller screens a search icon opens a full-width bar under the header |
| Navigation | Submits to `/products?q=…` (empty query → `/products`) |
| Mobile | Search icon (next to theme/cart) toggles the bar; Escape or submit closes it; input auto-focuses when opened |
| Catalog search | Also available on `/products` itself (same `q` param) |
| Match (catalog) | Case-insensitive `contains` on `name` **or** `description`; excludes `INACTIVE` |
| Legacy endpoint | `GET /api/products/search?q=` — required `q`, max 100 chars, limit 48, newest first |

## Implementation

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/products?q=&page=&pageSize=&sort=&categoryId=` | Public | Preferred: catalog search with pagination |
| GET | `/api/products/search?q=` | Public | Legacy/simple search (`{ q, products }`) |

### Web

- `web/src/components/storefront/header-search.tsx` — controlled search form; navigates to `/products?q=…`
- `web/src/components/storefront/header.tsx` — wraps search in `Suspense` for `useSearchParams`
- `web/src/components/storefront/product-catalog.tsx` — reads `q` from the URL and fetches the catalog API

## Changes

- Header search now targets `/products?q=…` instead of homepage `/?q=…`
- Homepage no longer renders a separate search-results mode
- Catalog page owns search UX together with category filter and sort
