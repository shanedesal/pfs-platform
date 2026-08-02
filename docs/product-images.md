# Product images

## Overview

Products have a required **cover** image (`Product.imageUrl`) for storefront grids (homepage featured, category filter, search). A separate `ProductImage` table holds optional **gallery** shots (Shopee-style extra photos) for a future product detail page. Seed data currently uses public Supabase Storage URLs; admin upload and private buckets come later.

## Behavior / rules

### Cover (`Product.imageUrl`)

| Rule | Detail |
|------|--------|
| Required | Non-null, non-empty string on create and in the DB |
| Role | Thumbnail / card image on list UIs |
| List APIs | Returned on featured, by-category, and search responses |
| Seed | Eight mock products each have a public Supabase URL under `pfs-products` |
| Storage | Public bucket for now; tighten when admin create/upload ships |

### Gallery (`ProductImage`)

| Rule | Detail |
|------|--------|
| Optional | Zero or more rows per product |
| Fields | `url` (required), `sortOrder` (default 0), timestamps |
| Delete | Cascade when product is deleted |
| Seed | Empty for all products (no gallery rows yet) |
| List APIs | Not included in homepage/search responses (cover only) |
| Detail API | Not implemented yet |

### Create product (`POST /api/products`)

| Rule | Detail |
|------|--------|
| Auth | Admin only (existing) |
| `imageUrl` | Required; missing/blank → `400` |
| Gallery | Not accepted yet |

## Implementation

### Data model

- `Product.imageUrl` — required `String` (cover)
- `ProductImage` — `id`, `productId` (FK cascade), `url`, `sortOrder`, timestamps; index on `productId`

### Seed

- Base: `https://ifssdnnzyfmoiughbfky.supabase.co/storage/v1/object/public/pfs-products`
- Files mapped to mock products: headphones, ceramic coffee set, backpack, fitness band, linen blanket, knife, portable speaker, merino sweater

### Web

- `web/src/components/storefront/product-card.tsx` — renders cover via `<img>`; PFS placeholder if empty
- `web/src/lib/product.ts` — `imageUrl: string`

## Changes

- Migration `20260801070000_product_images_required_cover` — `ProductImage` table; `Product.imageUrl` NOT NULL
- Seed sets cover URLs; gallery left empty
- `createProduct` validates required `imageUrl`
- Product cards display cover images from the API
