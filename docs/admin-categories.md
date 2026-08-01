# Admin category management

## Overview

Admins manage the product categories table from `/admin/categories`: view, add, edit, and delete categories. Categories already existed for homepage navigation and product filtering; this adds the missing admin CRUD, including a guard that prevents deleting a category that's still assigned to products.

## Behavior / rules

### Access

Same as the rest of `/admin` — requires an authenticated `ADMIN` user (see [`docs/admin-dashboard.md`](./admin-dashboard.md)).

### Fields

| Field | Detail |
|-------|--------|
| Name | Required, unique (case-sensitive match on the existing unique DB constraint) |
| Sort Order | Optional integer, default `0`; controls ordering on the storefront category nav and this admin list |

### List

Sorted by `sortOrder` then `name`. Each row shows a live **product count** (`_count.products`), used both for display and to drive the delete guard.

### Delete guard (hard block)

| Rule | Detail |
|------|--------|
| Behavior | If any product currently references the category (`Product.categoryId`), deletion is **rejected** — the admin must reassign or remove those products first |
| API | `DELETE /api/admin/categories/:id` returns `409` with `{ message, productCount }` when in use |
| UI | The delete button is disabled (with a tooltip showing the count) whenever `productCount > 0`; the `409` message is also shown inline as a safety net if it ever races with another admin |

## Implementation

### Data model

No schema change — reuses the existing `Category` model (`name`, `sortOrder`) and its relation to `Product`.

### API (`/api/admin/categories`, admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/categories` | List, each with `productCount` |
| POST | `/api/admin/categories` | Create `{ name, sortOrder? }` |
| PUT | `/api/admin/categories/:id` | Update |
| DELETE | `/api/admin/categories/:id` | Delete; `409` if in use |

- Controller: `server/src/controllers/admin-categories.controller.ts`
- Routes: `server/src/routes/admin.ts` (mounted at `/api/admin`, `authenticate` + `authorize("ADMIN")` applied to the whole router)
- Public read-only category endpoints (`GET /api/homepage/categories`) are unchanged

### Web

- `web/src/app/admin/categories/page.tsx` — table (name, sort order, product count, actions), add/edit modal, delete confirmation with guard
- `web/src/components/admin/category-form.tsx` — create/edit form
- `web/src/lib/category.ts` — `AdminCategory` type (superset of the public `Category`, adds `sortOrder`, `productCount`)
- `web/src/lib/admin/categories.ts` — typed `authFetch` wrappers: list/create/update/delete (admin-only `lib` code lives under `web/src/lib/admin/`, alongside `web/src/components/admin/`)

## Changes

- Added admin category CRUD (`GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/:id`)
- Delete hard-blocks with `409` while any product is still assigned to the category
- Built `/admin/categories` page with table, add/edit modal, delete confirmation (button disabled when in use)
- Restyled the admin shell with a left sidebar (`Dashboard` / `Products` / `Categories`) shared by all `/admin/*` pages — see [`docs/admin-dashboard.md`](./admin-dashboard.md)
