# User Profile (Account Page)

## Overview

Signed-in users have an account page (`/account`) showing their profile: name, email, role, contact number, and membership date. Customers can edit their **contact number** directly on this page — the field required for checkout (see `docs/checkout-orders.md`) — and manage a **delivery address book** (Shopee-style): add multiple saved addresses, edit or delete them, and mark one as the default.

## Behavior / rules

- Available to any signed-in user (customer or admin); guests are redirected to `/login`.
- **Name, email, and role are read-only** — there is no self-service edit for these yet.
- **Phone number is editable inline**: click "Edit" (or "Add" if unset) to reveal an input, submit to save, or cancel to discard. The rest of the page does not need to reload — the updated value is applied to the shared auth context immediately.
- If the profile has no contact number, the page shows the same "contact number required" notice used at checkout/cart (`CheckoutProfileRequired`, compact variant), on top of the inline "Add" affordance in the Contact details section.
- **Format: Philippine mobile number.** Must be exactly 11 digits starting with `09` (e.g. `0912 234 2345`). The input auto-formats as the user types (strips non-digits, groups `XXXX XXX XXXX`, caps at 11 digits) and the server re-validates/normalizes the same way before saving, so the stored value is always `0912 234 2345`-style regardless of how it was entered (with or without spaces/dashes).
  - Invalid input (wrong length or prefix) returns `400` with a message; the field stays open with the error shown inline.
- Rate-limited like other auth-adjacent endpoints (20 updates / 15 min / IP) to prevent abuse.
- "Member since" is derived from `User.createdAt` and only shown when available.

### Delivery address book (customers only)

- Customers can save **multiple** delivery addresses and see them listed under "Delivery addresses" on `/account` (hidden for admins — they don't check out).
- Each address is address-only (no per-address recipient name or contact number — those come from the account profile): optional **label** (e.g. "Home", "Work"), **street address**, **barangay**, **city**, **province**, and optional **postal code** (4 digits).
- **Exactly one address is the default** at all times once at least one address exists:
  - The **first** address a customer saves automatically becomes the default.
  - Explicitly checking "Set as default" on add/edit, or clicking **"Set as default"** on any non-default address card, makes it the default and demotes the previous one — all in a single transaction.
  - You cannot un-default an address directly (no "unset" toggle); you make a *different* one default instead, mirroring Shopee's UX.
  - Deleting the default address auto-promotes the next-oldest remaining address to default (if any remain).
- Up to **10 addresses** per customer; adding an 11th returns `400`.
- Add/edit is a modal form; delete requires confirming in a dialog. List, add, edit, delete, and set-default all update the list without a full page reload.
- Not yet wired into checkout — `CheckoutForm` still uses the single profile `phoneNumber` and a free-text delivery address typed at checkout time. Selecting a saved address at checkout is a natural follow-up, not implemented here.

## Implementation

### API — profile (any authenticated user)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/auth/me` | — | Current user (`id`, `email`, `name`, `phoneNumber`, `role`, `createdAt`) |
| PATCH | `/api/auth/me` | `{ phoneNumber }` | Updated user (same shape as `GET /me`) |

`PATCH /api/auth/me` only updates `phoneNumber` today — name/email edits are out of scope. `login`/`register` responses also include `createdAt` now so it's available immediately without waiting on a follow-up `/me` call.

### API — address book (any authenticated user)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/addresses` | — | Caller's addresses, default first |
| POST | `/api/addresses` | `AddressInput` | Created address |
| PUT | `/api/addresses/:id` | `AddressInput` | Updated address (owner only) |
| PATCH | `/api/addresses/:id/default` | — | Marks this address default, demotes the previous one (owner only) |
| DELETE | `/api/addresses/:id` | — | `204`; auto-promotes the next-oldest address if the default was removed (owner only) |

`AddressInput`: `{ label?, addressLine1, addressLine2, city, province, postalCode?, isDefault? }` — `addressLine2` (barangay) is required. Write endpoints are rate-limited (40 / 15 min / IP). Every route checks `address.userId === req.user.userId` before reading/mutating (404 otherwise, not 403, to avoid leaking existence).

### Frontend

- **`/account`** (`web/src/app/account/page.tsx`) — redesigned account page: identity card (initials avatar, name, role badge), a "Contact details" card (email + editable phone), the address book (customers only), an optional "Member since" card, and sign out. Wrapped in the shared storefront `Header`/`Footer` for consistent navigation (previously chromeless).
- **`PhoneNumberField`** (`web/src/components/storefront/phone-number-field.tsx`) — inline edit/save/cancel control for the profile phone number; calls `updateProfile()` and pushes the result into `AuthContext` via `applyUser()`.
- **`AddressBook`** (`web/src/components/storefront/address-book.tsx`) — lists saved addresses, opens `AddressForm` in a `Modal` for add/edit, confirms deletes via `ConfirmDialog`, and exposes "Set as default" per non-default card.
- **`AddressForm`** (`web/src/components/storefront/address-form.tsx`) — the add/edit form (label, street, barangay, city, province, postal code — all required except label/postal code); disables the default checkbox once an address is already default (demote-by-replacement only).
- **`Modal` / `ConfirmDialog`** (`web/src/components/storefront/modal.tsx`, `confirm-dialog.tsx`) — storefront-local copies of the existing admin dialog primitives (kept separate per the storefront/admin component split).
- **`web/src/lib/profile.ts`** — `updateProfile()` wrapping `PATCH /api/auth/me` (via `authFetch`).
- **`web/src/lib/addresses.ts`** — `listAddresses`, `createAddress`, `updateAddress`, `setDefaultAddress`, `deleteAddress` (all via `authFetch`), plus the shared `Address`/`AddressInput` types.
- **`AuthContext`** (`web/src/lib/auth-context.tsx`) — `User` type gained `createdAt`; `applyUser()` (already existed for login/register) is reused to apply the profile-update response without a full refetch.

Key files:

- `server/src/controllers/auth.controller.ts`, `server/src/controllers/addresses.controller.ts`
- `server/src/routes/auth.ts`, `server/src/routes/addresses.ts`
- `server/src/middleware/rateLimiter.ts`
- `server/src/utils/phone.ts`
- `server/prisma/schema.prisma` (`Address` model), `server/prisma/migrations/20260802120000_add_addresses/`, `server/prisma/migrations/20260802130000_remove_address_recipient_contact/`, `server/prisma/migrations/20260802140000_address_barangay_required/`
- `web/src/lib/profile.ts`, `web/src/lib/addresses.ts`
- `web/src/components/storefront/phone-number-field.tsx`, `address-book.tsx`, `address-form.tsx`, `modal.tsx`, `confirm-dialog.tsx`
- `web/src/app/account/page.tsx`

## Changes

- Added `PATCH /api/auth/me` to update the signed-in user's phone number, with validation and a dedicated rate limiter.
- Added `createdAt` to the `/api/auth/me`, login, and register responses.
- Redesigned `/account`: identity card with initials avatar and role badge, sectioned "Contact details" / "Member since" cards, `Header`/`Footer` chrome, and an inline-editable phone number field (`PhoneNumberField`) backed by the new endpoint.
- Updated checkout copy (`CheckoutForm`, `CheckoutProfileRequired`) and `docs/checkout-orders.md` to point at the account page for editing the contact number instead of "coming soon".
- Constrained the contact number to the Philippine mobile format (11 digits, `09` prefix, normalized to `0912 234 2345`) with matching client-side auto-formatting and server-side normalization/validation. Extracted the shared logic to `server/src/utils/phone.ts`.
- Added a multi-address delivery address book (Shopee-style): new `Address` model/migration, full CRUD + set-default API (`server/src/controllers/addresses.controller.ts`, `server/src/routes/addresses.ts`), and an `AddressBook` section on `/account` (customers only) with add/edit modal and delete confirmation.
- Dropped the per-address `recipientName`/`phoneNumber` fields — addresses are address-only (label, street, barangay, city, province, postal code); recipient/contact still comes from the account profile.
- Made `addressLine2` (barangay) required (`NOT NULL` at the DB level, required in the API and the add/edit form) — previously optional.
