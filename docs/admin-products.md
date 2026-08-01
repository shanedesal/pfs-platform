# Admin product management

## Overview

Admins manage the full product catalog from `/admin/products`: view, search, filter, add, edit, and delete products. Each product has a required cover image plus an optional image gallery, both uploaded to Supabase Storage. Product visibility/availability is controlled by an explicit, admin-set status rather than being derived from stock count.

## Behavior / rules

### Access

Same as the rest of `/admin` — requires an authenticated `ADMIN` user (see [`docs/admin-dashboard.md`](./admin-dashboard.md)).

### Fields

| Field | Detail |
|-------|--------|
| Product Name | Required, non-empty |
| Product Image (cover) | Required; uploaded file, stored in Supabase Storage, `Product.imageUrl` |
| Additional Images (gallery) | Optional, zero or more; stored in `ProductImage`, uploaded the same way as the cover |
| Category | Required in the admin form (select from existing categories); stored as nullable `Product.categoryId` for backward compatibility with pre-existing data |
| Description | Optional text |
| Price | Required, non-negative number |
| Stock Quantity | Required, non-negative integer |
| Product Status | `Active` / `Inactive` / `Out of Stock` — set independently by the admin, **not** auto-derived from stock quantity |

### List, search, filter

| Rule | Detail |
|------|--------|
| Search | Matches `name` or `description`, case-insensitive |
| Filter | By `categoryId` and/or `status`, combinable with search |
| Pagination | Server-side, default page size 10 |

### Delete

A confirmation dialog is always shown before a product is deleted. Deleting a product cascades to delete its gallery (`ProductImage`) rows.

### Images

| Rule | Detail |
|------|--------|
| Upload flow | Frontend uploads each file individually to `POST /api/admin/products/upload-image` (multipart), gets back a public URL, then includes that URL in the product create/update JSON payload |
| Storage | Supabase Storage, public bucket (`SUPABASE_STORAGE_BUCKET`, default `pfs-products`) |
| Limits | 5MB per file; JPEG/PNG/WEBP/GIF only |
| Gallery ordering | Follows upload order (`sortOrder` = index); no drag-to-reorder yet |
| Gallery sync | On update, sending `images: string[]` fully replaces the gallery (delete then recreate) — simplest way to support add/remove without diffing |

### Known gap

The public storefront (`GET /api/products/*`) does not yet filter out `INACTIVE` products — status is currently admin/catalog-management only. Follow-up if/when storefront visibility rules are needed.

## Implementation

### Data model

- `Product.status` — new `ProductStatus` enum (`ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`), default `ACTIVE`, indexed
- `Product.imageUrl` — cover (existing, required)
- `ProductImage` — gallery (existing table, now writable via the admin API)

### API (`/api/admin/products`, admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/products` | List — `search`, `categoryId`, `status`, `page`, `pageSize` query params |
| GET | `/api/admin/products/:id` | Single product, including gallery (`images`) |
| POST | `/api/admin/products` | Create |
| PUT | `/api/admin/products/:id` | Update |
| DELETE | `/api/admin/products/:id` | Delete |
| POST | `/api/admin/products/upload-image` | Upload one image (cover or gallery), returns `{ url }` |

- Controller: `server/src/controllers/admin-products.controller.ts`
- Routes: `server/src/routes/admin.ts` (mounted at `/api/admin`, `authenticate` + `authorize("ADMIN")` applied to the whole router)
- Upload middleware: `server/src/middleware/upload.middleware.ts` (multer, memory storage, 5MB limit, image-only filter)
- Supabase client: `server/src/config/supabase.ts` (service-role key, server-only)
- Removed the old public `POST /api/products` admin-create route (`server/src/routes/products.ts`, `products.controller.ts`) — superseded by `/api/admin/products`

### Web

- `web/src/app/admin/products/page.tsx` — table, search/filter toolbar, pagination, add/edit modal, delete confirmation
- `web/src/components/admin/product-form.tsx` — create/edit form; handles cover + gallery upload
- `web/src/components/admin/modal.tsx`, `confirm-dialog.tsx` — shared dialog primitives (new)
- `web/src/lib/product.ts` — `ProductStatus`, `PRODUCT_STATUSES`, `AdminProduct` type (superset of the public `Product`)
- `web/src/lib/admin/products.ts` — typed `authFetch` wrappers: list/get/create/update/delete/uploadImage (admin-only `lib` code lives under `web/src/lib/admin/`, alongside `web/src/components/admin/`)

### Environment

New required server env vars (`server/.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`. See [`docs/admin-categories.md`](./admin-categories.md) is unrelated; Supabase setup notes live here since images are product-specific. The server Dockerfile now uses `node:22-alpine` (Supabase JS requires Node 22+ for its Realtime client, which is otherwise constructed even though this app only uses Storage).

## Changes

- Added `ProductStatus` enum + `Product.status` column (migration `20260801071445_add_product_status`)
- Added Supabase Storage upload endpoint and admin product CRUD (list/get/create/update/delete)
- Product create/update now manage the `ProductImage` gallery alongside the cover image
- Removed the old public admin-create route on `/api/products`
- Bumped `server/Dockerfile` to `node:22-alpine`
- Added `multer` and `@supabase/supabase-js` dependencies
- Built `/admin/products` page with table, search/filter/pagination, add/edit modal, delete confirmation
