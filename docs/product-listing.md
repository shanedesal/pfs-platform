# Product listing (storefront catalog)

## Overview

The storefront product listing page at `/products` is the full catalog: search, category filter, price sorting, and paginated results. The homepage stays a marketing surface (hero + featured ≤8) and links into this page.

## Behavior / rules

| Rule | Detail |
|------|--------|
| Route | `/products` with optional `?q=`, `?category=`, `?sort=` |
| Public | No auth required |
| Page size | Fetches **12** products per request (max 48 via `pageSize`); UI accumulates pages instead of paging |
| Loading more | "Show more products" button fetches the next page and appends it to the grid (no page reload, no `?page=` in the URL) |
| Visibility | Excludes `INACTIVE` products; `OUT_OF_STOCK` still listed |
| Search | Case-insensitive `contains` on name/description (`q`, max 100 chars) |
| Category | Optional `categoryId` (API) / `category` (URL); unknown id → `404` |
| Sort | `newest` (default), `price-asc`, `price-desc` |
| Changing filters | Search/category/sort changes reset the grid back to the first page (no leftover items from a previous filter) |
| Card fields | Image, name, price, category, stock availability, View Details, Add to Cart |
| View Details | Links to `/products/[id]` (public detail endpoint) |
| Add to Cart | Customers only — adds to server-backed cart (guests → login; admins hidden). Catalog cards add 1; detail page has a quantity selector (1–stock). See `docs/shopping-cart.md` |
| Detail image gallery | Cover image + any `ProductImage` gallery shots as clickable thumbnails; main image switches on click |
| Detail description | Long descriptions collapse to ~1 paragraph (or first 480 chars) with a "See more" / "See less" toggle; text always wraps (`break-words`) so an unbroken run of characters can't force horizontal scroll |
| Description length | Admin create/edit form caps descriptions at 4,000 characters (`PRODUCT_DESCRIPTION_MAX_LENGTH`), enforced client-side (`maxLength` + live counter) and server-side (`400` if exceeded) |
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
- `web/src/components/storefront/product-detail.tsx` — detail fetch/render, image gallery (cover + `ProductImage`s), description preview/expand
- `web/src/components/storefront/product-card.tsx` — card used on homepage featured + catalog
- `web/src/components/admin/product-form.tsx` — description `maxLength` + character counter
- `web/src/lib/product.ts` — `Product`, `ProductCatalogResponse`, `isProductAvailable`, `PRODUCT_DESCRIPTION_MAX_LENGTH`, `PRODUCT_DESCRIPTION_PREVIEW_LENGTH`, `getDescriptionPreview`

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
- Detail page redesigned: category pill, in-stock/out-of-stock pill, clickable image gallery, "See more/less" description toggle, restyled Add to Cart
- Fixed a layout bug where a description with no whitespace (e.g. one long unbroken run of characters) would force the page into endless horizontal scroll; description text now always wraps and description length is capped at 4,000 characters on both the admin form and the API
- `admin-products.controller.ts` rejects `description` over 4,000 characters on create/update
- Replaced Previous/Next page-number pagination on `/products` with a "Show more products" button that appends results to the existing grid; `?page=` dropped from the URL, filter changes still reset to page one
