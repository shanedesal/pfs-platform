# Homepage featured products

## Overview

The storefront homepage loads its “Trending now” grid from the database via a dedicated homepage API. This is intentionally separate from a future general product catalog endpoint.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Limit | At most 8 products |
| Order | Newest first (`createdAt` desc) |
| Fields | `id`, `name`, `description`, `price` (number), `stock`, `imageUrl` |
| Empty | Homepage shows a short empty-state message |
| Failure | Homepage shows a short error message; does not fall back to mock data |
| Category nav | Still static UI on the client (not driven by this endpoint) |

## Implementation

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/homepage/featured` | Public | Featured products for the homepage grid |

- Controller: `server/src/controllers/homepage.controller.ts`
- Router: `server/src/routes/homepage.ts` (mounted at `/api/homepage` in `server/src/index.ts`)
- Data: Prisma `Product` rows; `Decimal` price serialized as a JS number

### Web

- `web/src/components/featured-products.tsx` — client fetch to `/api/homepage/featured`
- `web/src/components/product-card.tsx` — renders name, description, price from `Product`
- `web/src/lib/product.ts` — shared `Product` type
- Category chips remain local constants in `category-nav.tsx` (mock catalog file removed)

## Changes

- Added homepage featured endpoint backed by the Product table
- Replaced `web/src/lib/mock-data.ts` usage on the homepage with live API data
- Product cards no longer show mock-only fields (rating, review count, badge, category)
