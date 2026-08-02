# Admin customer management

## Overview

Admins can view and manage customer accounts from `/admin/customers`: a searchable, filterable, paginated customer table, and a detailed profile page per customer (`/admin/customers/[id]`) showing their contact info, lifetime order stats, full order history, and saved addresses. Admins can disable (and re-enable) a customer's account from either the table or the profile page.

This reuses the existing `User`/`Order`/`Address` data model — no new tables besides a single `isActive` flag on `User`.

## Behavior / rules

### Access

Same as the rest of `/admin` — requires an authenticated `ADMIN` user (see [`docs/admin-dashboard.md`](./admin-dashboard.md)). The endpoints are scoped to `role: "CUSTOMER"` rows only: an admin cannot list, view, or disable another admin account through this feature (`404` if the target id isn't a customer).

### Customer table (`/admin/customers`)

| Column | Detail |
|--------|--------|
| Customer Name | `name` |
| Email Address | `email` |
| Contact Number | `phoneNumber`, or `—` if not set |
| Number of Orders | Count of the customer's non-cancelled orders |
| Total Purchase Amount | Sum of `total` across the customer's non-cancelled orders, formatted as currency |
| Account Status | "Active" / "Disabled" badge |
| — | "View Profile" link, and a "Disable"/"Enable" action |

| Rule | Detail |
|------|--------|
| Search | Matches `name` or `email`, case-insensitive |
| Filter | By account status (`active` / `disabled`), combinable with search |
| Pagination | Server-side, default page size 10 (same conventions as `/admin/orders`) |
| Sort | Newest first (`createdAt desc`) |
| Order stats | `CANCELLED` orders are excluded from both the order count and the purchase total, since they were never fulfilled |

### Customer profile (`/admin/customers/[id]`)

Shows:

- Name, "customer since" date, account status badge
- Email, contact number, number of orders, total purchase amount
- Full order history (order number, date, payment method, status badge, total), each linking to the existing admin order detail page (`/admin/orders/[orderNumber]`)
- Saved delivery addresses (label, street/barangay, city/province/postal code, default marker) — read-only, mirrors the customer's own address book on `/account`
- A "Disable Account" / "Enable Account" button

### Disabling / enabling accounts

Disabling a customer account:

1. Sets `User.isActive` to `false`.
2. Immediately revokes all of that customer's refresh tokens (`revokeAllUserRefreshTokens`), so any devices where they're already signed in are logged out on their next request/refresh — not just future logins.
3. Blocks future logins: `POST /api/auth/login` returns `403` for a disabled account, even with the correct password.
4. Blocks any already-issued access token from continuing to work: `authenticate` middleware now loads `isActive` and rejects the request with `401` if the account has since been disabled.

Re-enabling simply flips `isActive` back to `true` — the customer can sign in normally again (their old sessions were already revoked, so they'll need to log in again).

There is a confirmation dialog before disabling or enabling, both in the table row action and on the profile page.

## Implementation

### Data model

- `User.isActive` (`Boolean`, `@default(true)`) — added via migration `server/prisma/migrations/20260802064316_add_user_is_active/`
- No changes to `Order`, `OrderItem`, or `Address`

### API (`/api/admin/customers`, admin only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/customers` | List — `search`, `status` (`active`/`disabled`), `page`, `pageSize` query params |
| GET | `/api/admin/customers/:id` | Full profile: user info + order history + addresses |
| PATCH | `/api/admin/customers/:id/status` | Update `isActive` (body: `{ isActive: boolean }`); disabling revokes all refresh tokens |

- Controller: `server/src/controllers/admin-customers.controller.ts`
- Routes: `server/src/routes/admin.ts` (mounted at `/api/admin`, `authenticate` + `authorize("ADMIN")` applied to the whole router)
- List response computes order count/purchase total via `prisma.order.groupBy` over the paged customer ids (excluding `CANCELLED`), avoiding N+1 queries
- Detail response computes the same stats from the customer's full order list

### Auth changes

- `server/src/middleware/auth.middleware.ts` — `authenticate` now selects `isActive` and returns `401` when the account is disabled, even if the access token itself is still valid
- `server/src/controllers/auth.controller.ts` — `login` returns `403` ("This account has been disabled...") for a disabled account after the password check
- `server/src/utils/tokens.ts` — reused the existing `revokeAllUserRefreshTokens(userId)` helper (previously only used for refresh-token-theft detection) when an admin disables an account

### Web

- `web/src/app/admin/customers/page.tsx` — table, search/status filter toolbar, pagination, inline disable/enable action with a confirmation dialog (mirrors `/admin/orders` and `/admin/products`)
- `web/src/app/admin/customers/[id]/page.tsx` — profile page: customer info card, order history table (links into `/admin/orders/[orderNumber]`), saved addresses list, disable/enable action with confirmation dialog
- `web/src/lib/admin/customers.ts` — typed `authFetch` wrappers: `fetchAdminCustomers` (list), `fetchAdminCustomer` (detail), `updateAdminCustomerStatus`
- `web/src/components/admin/sidebar.tsx` — added a "Customers" nav item
- Reuses `web/src/components/admin/confirm-dialog.tsx`, `web/src/components/order-status-badge.tsx`, and `formatMoney`/`paymentMethodLabel` from `web/src/lib/orders.ts`

## Changes

- Added `User.isActive` (migration `20260802064316_add_user_is_active`)
- `authenticate` middleware and `login` now reject disabled accounts (`401`/`403`); disabling an account revokes all its refresh tokens
- Added admin customer endpoints: list (search/status/pagination with order stats), profile detail (orders + addresses), status update
- Built `/admin/customers` table page and `/admin/customers/[id]` profile page
- Added a "Customers" entry in the admin sidebar
