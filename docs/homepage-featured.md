# Homepage storefront data

## Overview

The storefront homepage loads featured products and category chips from dedicated homepage APIs. These are intentionally separate from a future general product catalog or admin CRUD API. Categories live in a `Category` table (not an enum) so admins can add or rename them later without schema changes.

## Behavior / rules

### Featured products

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Limit | At most 8 products |
| Order | Newest first (`createdAt` desc) |
| Fields | `id`, `name`, `description`, `price` (number), `stock`, `imageUrl` |
| Empty | Homepage shows a short empty-state message |
| Failure | Homepage shows a short error message; does not fall back to mock data |

### Categories

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Order | `sortOrder` ascending, then `name` ascending |
| Fields | `id`, `name` |
| Client “All” | Hardcoded chip prepended in the UI; not a DB row |
| Empty | Nav shows only the “All” chip |
| Failure | Homepage shows a short error message; does not fall back to static categories |
| Admin CRUD | Not implemented yet — seed provides initial categories |
| Filter UI | Chip click sets `/?category=<id>`; “All” clears to `/` |
| Filter API | `GET /api/products/by-category?categoryId=` (see below) |

### Category product filter

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Query | Required `categoryId`; missing → `400`; unknown id → `404` |
| Limit | At most 48 products |
| Order | Newest first (`createdAt` desc) |
| Fields | Same product shape as featured; response is `{ category, products }` |
| Empty | Homepage shows a short empty-state for that category |
| “All” | Uses featured endpoint (limit 8), not by-category |

### Product ↔ category

| Rule | Detail |
|------|--------|
| Relation | Optional FK `Product.categoryId` → `Category.id` |
| On delete | Category delete sets product `categoryId` to null |
| Featured | Homepage featured response does not include category |

## Implementation

### Data model

- `Category` — `id`, `name` (unique), `sortOrder`, timestamps
- `Product.categoryId` — optional FK with index

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/homepage/featured` | Public | Featured products for the homepage grid |
| GET | `/api/homepage/categories` | Public | Category chips for the homepage nav |
| GET | `/api/products/by-category?categoryId=` | Public | Products in a category (homepage filter) |

- Homepage controller/router: `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`
- Category filter: `getProductsByCategory` in `server/src/controllers/products.controller.ts`, route on `server/src/routes/products.ts`
- Seed: `server/prisma/seed.ts` upserts six categories and links mock products

### Web

- `web/src/components/featured-products.tsx` — featured when no category; by-category when `categoryId` prop set
- `web/src/components/category-nav.tsx` — loads chips; navigates to `/?category=<id>`
- `web/src/app/page.tsx` — passes `category` search param into nav + product grid
- `web/src/components/product-card.tsx` — renders name, description, price from `Product`
- `web/src/lib/product.ts` — shared `Product` type
- `web/src/lib/category.ts` — shared `Category` type

## Changes

- Added `Category` table and optional `Product.categoryId` FK (migration `20260801050000_add_product_categories`)
- Added `GET /api/homepage/categories`
- Category nav loads from the API instead of hardcoded strings
- Seed creates categories and assigns them to mock products
- Added `GET /api/products/by-category`; category chips filter the homepage product grid via `?category=`
