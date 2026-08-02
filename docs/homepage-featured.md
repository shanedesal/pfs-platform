# Homepage storefront data

## Overview

The storefront homepage loads featured products and category chips from dedicated homepage APIs. These stay separate from the general product catalog at `/products` (see `docs/product-listing.md`). Categories live in a `Category` table so admins can add or rename them later without schema changes.

## Behavior / rules

### Featured products

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Limit | At most 8 products |
| Order | Newest first (`createdAt` desc) |
| Visibility | Excludes `INACTIVE` |
| Fields | `id`, `name`, `description`, `price` (number), `stock`, `imageUrl`, `status`, `category` |
| Empty | Homepage shows a short empty-state message |
| Failure | Homepage shows a short error message; does not fall back to mock data |
| Browse more | “View all products” links to `/products` |

### Categories

| Rule | Detail |
|------|--------|
| Public | No auth required |
| Order | `sortOrder` ascending, then `name` ascending |
| Fields | `id`, `name` |
| Client “All” | Hardcoded chip prepended in the UI; not a DB row |
| Empty | Nav shows only the “All” chip |
| Failure | Homepage shows a short error message; does not fall back to static categories |
| Navigation | Chip click goes to `/products` or `/products?category=<id>` (full catalog) |

### Product ↔ category

| Rule | Detail |
|------|--------|
| Relation | Optional FK `Product.categoryId` → `Category.id` |
| On delete | Category delete sets product `categoryId` to null |

## Implementation

### Data model

- `Category` — `id`, `name` (unique), `sortOrder`, timestamps
- `Product.categoryId` — optional FK with index
- `Product.imageUrl` — required cover; gallery rows in `ProductImage` (see `docs/product-images.md`)

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/homepage/featured` | Public | Featured products for the homepage grid |
| GET | `/api/homepage/categories` | Public | Category chips for the homepage nav |

- Homepage controller/router: `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`
- Full catalog: `docs/product-listing.md` (`GET /api/products`)
- Seed: `server/prisma/seed.ts` upserts categories and sample products

### Web

- `web/src/app/page.tsx` — hero, category nav, featured grid
- `web/src/components/storefront/hero.tsx` — **Browse Products** → `/products`
- `web/src/components/storefront/featured-products.tsx` — featured grid + view-all link
- `web/src/components/storefront/category-nav.tsx` — chips navigate to the catalog
- `web/src/components/storefront/product-card.tsx` — product card
- `web/src/lib/product.ts` — shared `Product` type
- `web/src/lib/category.ts` — shared `Category` type

## Changes

- Homepage no longer filters/search-replaces itself; catalog lives at `/products`
- Category chips and hero CTA open the product listing page
- Featured response includes `status` + `category` and skips inactive products
