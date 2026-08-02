# Product listing (storefront catalog)

## Overview

The storefront product listing page at `/products` is the full catalog: search, category filter, price sorting, and paginated results. The homepage stays a marketing surface (hero + featured ≤8) and links into this page.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Route | `/products` with optional `?q=`, `?category=`, `?sort=`, `?page=` |
| Public | No auth required |
| Page size | Default **12** products per page (max 48 via `pageSize`) |
| Visibility | Excludes `INACTIVE` products; `OUT_OF_STOCK` still listed |
| Search | Case-insensitive `contains` on name/description (`q`, max 100 chars) |
| Category | Optional `categoryId` (API) / `category` (URL); unknown id → `404` |
| Sort | `newest` (default), `price-asc`, `price-desc` |
| Card fields | Image, name, price, category, stock availability, View Details, Add to Cart |
| View Details | Links to `/products/[id]` (public detail endpoint) |
| Add to Cart | UI only for now (disabled when unavailable) |
| Sample data | Seed includes at least 12 products |

### Stock availability

| Condition | Label |
|-----------|--------|
| `status === OUT_OF_STOCK` or `stock <= 0` | Out of stock |
| Otherwise | In stock (shows quantity on card/detail) |

## Implementation

### API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/products?page=&pageSize=&q=&categoryId=&sort=` | Public | Paginated catalog |
| GET | `/api/products/:id` | Public | Single product (detail) |

Response shape for list:

```json
{
  "items": [{ "id", "name", "description", "price", "stock", "imageUrl", "status", "category" }],
  "total": 12,
  "page": 1,
  "pageSize": 12,
  "sort": "newest",
  "q": "optional",
  "categoryId": "optional"
}
```

- Controller: `getProducts`, `getProductById` in `server/src/controllers/products.controller.ts`
- Router: `server/src/routes/products.ts`

### Web

- `web/src/app/products/page.tsx` — catalog page shell
- `web/src/app/products/[id]/page.tsx` — detail page shell
- `web/src/components/storefront/product-catalog.tsx` — search, category chips, sort, grid, pagination (URL-driven)
- `web/src/components/storefront/product-detail.tsx` — detail fetch/render
- `web/src/components/storefront/product-card.tsx` — card used on homepage featured + catalog
- `web/src/lib/product.ts` — `Product`, `ProductCatalogResponse`, `isProductAvailable`

### Homepage entry points

- Hero **Browse Products** → `/products`
- Header **Products** link → `/products`
- Header search → `/products?q=…`
- Category chips → `/products` / `/products?category=…`
- Featured **View all products** → `/products`

## Changes

- Replaced unbounded `GET /api/products` dump with paginated catalog (search, category, sort)
- Added `GET /api/products/:id` for storefront detail
- Added `/products` listing page and `/products/[id]` detail page
- Wired homepage/header navigation and search into the catalog
- Expanded seed to 12 sample products
- Catalog/featured responses include `status` and `category`; inactive products excluded from public lists
