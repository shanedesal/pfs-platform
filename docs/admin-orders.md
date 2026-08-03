# Admin order management

## Overview

Admins can view and manage all customer orders from `/admin/orders`: a searchable, filterable, paginated order table, and a detail page per order (`/admin/orders/[orderNumber]`) showing everything needed to fulfill it — customer info, delivery address, ordered products, totals, payment method, and notes. Admins can also progress an order through its fulfillment status from the detail page.

This extends the existing `Order`/`OrderItem` data model introduced for customer checkout (see [`docs/checkout-orders.md`](./checkout-orders.md)) — no new tables, just new admin-only endpoints and three additional `OrderStatus` values.

## Behavior / rules

### Access

Same as the rest of `/admin` — requires an authenticated `ADMIN` user (see [`docs/admin-dashboard.md`](./admin-dashboard.md)). The admin order endpoints are **not** ownership-scoped — an admin can view/update any customer's order (unlike the customer-only `/api/orders` endpoints, which are strictly owner-scoped).

### Order statuses

| Status | Label |
|--------|-------|
| `PENDING` | Pending |
| `CONFIRMED` | Confirmed |
| `PREPARING` | Preparing |
| `SHIPPED` | Shipped |
| `COMPLETED` | Completed |
| `CANCELLED` | Cancelled |

New orders still default to `PENDING` (unchanged). `PREPARING`, `SHIPPED`, and `COMPLETED` are new — added to the existing `OrderStatus` enum, positioned between `CONFIRMED` and `CANCELLED` so the enum order mirrors the fulfillment workflow. There is no enforced transition graph — an admin can set any order to any status; this is a manual override tool, not a state machine.

### Order table (`/admin/orders`)

| Column | Detail |
|--------|--------|
| Order Number | `orderNumber`, monospace |
| Customer Name | `customerName` |
| Order Date | `createdAt`, formatted date |
| Total Amount | `total`, formatted as currency |
| Payment Method | Human-readable label (Cash on Delivery / E-Wallet / Bank Transfer) |
| Order Status | Colored status badge |
| — | "View Details" button → `/admin/orders/[orderNumber]` |

| Rule | Detail |
|------|--------|
| Search | Matches `orderNumber` or `customerName`, case-insensitive |
| Filter | By `status`, combinable with search |
| Pagination | Server-side, default page size 10 (same conventions as `/admin/products`) |
| Sort | Newest first (`createdAt desc`) |

### Order details (`/admin/orders/[orderNumber]`)

Shows:

- Order number + placed-at timestamp
- Customer information: name, email, contact number
- Delivery address (text snapshot taken at order time)
- Ordered products: name, thumbnail, unit price, quantity, line total
- Subtotal and total amount
- Payment method
- Order status (badge) with a status dropdown + "Update Status" button to change it
- Order notes (if any)

Updating the status calls `PATCH /api/admin/orders/:orderNumber/status` and re-renders the page with the server's response (including the new status badge). The update button is disabled until a different status is chosen.

When an admin sets an order to `COMPLETED`, the server sends a completion email to the customer's snapshotted `order.email` (see [`docs/order-emails.md`](./order-emails.md)). When an admin sets an order to `CANCELLED`, the customer receives an email stating that an administrator cancelled the order.

## Implementation

### Data model

- `OrderStatus` enum extended: `PENDING`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `COMPLETED`, `CANCELLED` (was `PENDING`, `CONFIRMED`, `CANCELLED`)
- Migration: `server/prisma/migrations/20260802150000_extend_order_status/`
- No changes to `Order` / `OrderItem` columns

### Shared order formatting

Extracted the `orderInclude` Prisma include, `formatOrder()` response shaper, and `paramOrderNumber()` param helper (previously private to `orders.controller.ts`) into `server/src/utils/order-formatting.ts` so both the customer (`orders.controller.ts`) and admin (`admin-orders.controller.ts`) controllers share one implementation instead of duplicating it.

### API (`/api/admin/orders`, admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/orders` | List — `search`, `status`, `page`, `pageSize` query params |
| GET | `/api/admin/orders/:orderNumber` | Full order detail (any order, not owner-scoped) |
| PATCH | `/api/admin/orders/:orderNumber/status` | Update `status` (body: `{ status }`) |

- Controller: `server/src/controllers/admin-orders.controller.ts`
- Routes: `server/src/routes/admin.ts` (mounted at `/api/admin`, `authenticate` + `authorize("ADMIN")` applied to the whole router)
- List response omits line items (lighter payload for the table); detail/update responses include them via the shared `formatOrder()`

### Web

- `web/src/app/admin/orders/page.tsx` — table, search/status filter toolbar, pagination (mirrors `/admin/products`)
- `web/src/app/admin/orders/[orderNumber]/page.tsx` — detail page: customer info, delivery/payment card, ordered products + subtotal/total, order notes, status dropdown + update button
- `web/src/components/admin/order-status-badge.tsx` — shared status badge (color per status), used by both the table and detail page
- `web/src/lib/orders.ts` — `OrderStatus` extended; added `ORDER_STATUSES` (value/label list) and `orderStatusLabel()`, alongside the existing `Order` type and `formatMoney`/`paymentMethodLabel` reused from checkout
- `web/src/lib/admin/orders.ts` — typed `authFetch` wrappers: `fetchAdminOrders` (list), `fetchAdminOrder` (detail), `updateAdminOrderStatus`
- `web/src/components/admin/sidebar.tsx` — added "Orders" nav item

## Changes

- Added `PREPARING`, `SHIPPED`, `COMPLETED` to `OrderStatus` (migration `20260802150000_extend_order_status`)
- Extracted shared order formatting (`orderInclude`, `formatOrder`, `paramOrderNumber`) into `server/src/utils/order-formatting.ts`, reused by both customer and admin order controllers
- Added admin order endpoints: list (search/status/pagination), detail, status update
- Built `/admin/orders` table page and `/admin/orders/[orderNumber]` detail page
- Added shared `OrderStatusBadge` component and an "Orders" entry in the admin sidebar
