# Customer order management

## Overview

Customers can review their own order history and order details, and self-cancel an order while it hasn't been confirmed yet. This complements [`docs/checkout-orders.md`](./checkout-orders.md) (placing orders, confirmation page) and mirrors the structure of [`docs/admin-orders.md`](./admin-orders.md), but every endpoint here is strictly scoped to the signed-in customer's own orders.

## Behavior / rules

### Access

Requires an authenticated `CUSTOMER` (`authenticate` + `authorize("CUSTOMER")`, same as the rest of `/api/orders`). All endpoints are owner-scoped — a customer can only ever see or act on orders where `order.userId` matches their own id; anything else (including a real order that belongs to someone else) returns `404`.

### Order history (`/account/orders`)

| Column | Detail |
|--------|--------|
| Order number | monospace |
| Placed date | `createdAt`, formatted |
| Payment method | Human-readable label |
| Status | Colored status badge (shared with admin) |
| Total | Formatted currency |
| Actions | "View details", and "Cancel order" when still cancellable |

| Rule | Detail |
|------|--------|
| Filter | By `status`, optional |
| Pagination | Server-side, page size 10 (same conventions as `/admin/orders`) |
| Sort | Newest first (`createdAt desc`) |
| Scope | Only the signed-in customer's own orders |

### Order detail (`/account/orders/[orderNumber]`)

Same content as the checkout confirmation page (order number, ordered products with thumbnails/quantities/line totals, subtotal/total, delivery details, payment method, notes), plus the current status badge and, when applicable, a "Cancel order" action.

### Cancellation

A customer can cancel their own order **only while it is still `PENDING`** — i.e. before an admin has moved it to `CONFIRMED` or any later status. Once an order has been confirmed (or is already `CANCELLED`/terminal), the cancel action is hidden in the UI and the API rejects the request with `400`.

Cancelling:

1. Sets the order's `status` to `CANCELLED`.
2. Restores the stock reserved for each line item back onto the corresponding `Product` (increments `stock` by the ordered quantity).
3. Un-marks any product that had been auto-flipped to `OUT_OF_STOCK` at order time, setting it back to `ACTIVE` (products an admin explicitly set to `INACTIVE` are left untouched).

There is no separate confirmation/refund flow — no payment gateway is integrated (see `docs/checkout-orders.md`), so cancellation only reverses the stock reservation.

## Implementation

### API (`/api/orders`, CUSTOMER only, owner-scoped)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/orders` | List the caller's own orders — `status`, `page`, `pageSize` query params |
| GET | `/api/orders/:orderNumber` | Full order detail (existing, owner only) |
| PATCH | `/api/orders/:orderNumber/cancel` | Cancel — only allowed while `status === PENDING`; restores stock |

- Controller: `server/src/controllers/orders.controller.ts` (`listOrders`, `cancelOrder`, alongside existing `placeOrder`/`getOrder`)
- Routes: `server/src/routes/orders.ts`
- List response omits line items (lighter payload); detail/cancel responses include them via the shared `formatOrder()` from `server/src/utils/order-formatting.ts`
- No schema changes — reuses the existing `Order`/`OrderItem`/`Product` models

### Web

- `web/src/app/account/orders/page.tsx` — order history: status filter, pagination, cancel action (with confirmation dialog)
- `web/src/app/account/orders/[orderNumber]/page.tsx` — order detail, reusing the confirmation page's layout, plus status badge + cancel action
- `web/src/components/order-status-badge.tsx` — status badge moved out of `components/admin/` to a shared location so both the admin and customer order views use the same component
- `web/src/lib/orders.ts` — added `listMyOrders`, `cancelOrder`, `canCancelOrder()`, and `OrderListItem`/`OrderListParams`/`OrderListResponse` types (via `authFetch`)
- `web/src/app/account/page.tsx` — added a "My Orders" link into the order history page

## Changes

- Added owner-scoped `GET /api/orders` (list, paginated + status filter) and `PATCH /api/orders/:orderNumber/cancel` (cancel while `PENDING`, restores stock) to `orders.controller.ts` / `orders.ts`
- Built `/account/orders` (list) and `/account/orders/[orderNumber]` (detail) customer pages, with cancel actions gated to `PENDING` orders
- Moved `OrderStatusBadge` from `web/src/components/admin/` to `web/src/components/order-status-badge.tsx` so it's shared between admin and customer order UIs (updated both admin order pages' imports)
- Added a "My Orders" link on `/account`
