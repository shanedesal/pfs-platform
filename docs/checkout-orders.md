# Checkout & Orders

## Overview

Signed-in **customers** can complete checkout from their cart: enter delivery and payment details, place an order (no real payment gateway), and view an order confirmation with a generated order number and summary.

Orders are persisted in PostgreSQL. Stock is decremented atomically when an order is placed, and the cart is cleared.

## Behavior / rules

### Who can checkout

| User | Checkout | Place order | View confirmation |
|------|----------|-------------|---------------------|
| Guest | Redirect to login | — | — |
| Customer | Yes (`/checkout`) | Yes | Yes (`/checkout/confirmation/[orderNumber]`) |
| Admin | Redirect to `/admin` | — | — |

### Checkout form fields

| Field | Required | Notes |
|-------|----------|-------|
| Customer name | Yes | Read-only; from account profile |
| Email address | Yes | Read-only; from account profile |
| Contact number | Yes | Read-only at checkout; from account `phoneNumber` — edit it on `/account` (see `docs/user-profile.md`) |
| Delivery address | Yes | Textarea; entered at checkout |
| Payment method | Yes | Radio: Cash on Delivery, E-Wallet, Bank Transfer |
| Order notes | No | Optional delivery instructions |

Name, email, and contact number are **not** accepted from the client on `POST /api/orders` — the server copies them from the signed-in user's profile.

**Profile gate:** Checkout is blocked in the UI and API when `User.phoneNumber` is not set. The cart page disables "Proceed to checkout", the checkout page shows a contact-required prompt instead of the form, and the account page surfaces the same notice. Server returns `400` if a place-order request slips through without a profile phone number.

No online payment is processed. The selected payment method is stored on the order for fulfillment.

### Place order

- Cart must be non-empty and all items must still be available with sufficient stock.
- Server re-validates stock inside a transaction before creating the order.
- On success: order row + line items created, product stock decremented, products with zero stock marked `OUT_OF_STOCK`, cart cleared.
- Client redirects to the confirmation page with the generated order number.

### Order number

Format: `ORD-YYYYMMDD-XXXXXX` (date + random hex suffix), e.g. `ORD-20260802-A1B2C3`.

### Confirmation page

Shows:

- Order confirmed message
- Order number
- Order summary (items, quantities, line totals, total)
- Delivery details (email, contact, address, payment method, notes)

## Implementation

### Database

```prisma
enum PaymentMethod {
  CASH_ON_DELIVERY
  E_WALLET
  BANK_TRANSFER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

model Order {
  orderNumber     String        @unique
  userId          String
  customerName    String
  email           String
  contactNumber   String
  deliveryAddress String
  paymentMethod   PaymentMethod
  orderNotes      String?
  status          OrderStatus   @default(PENDING)
  subtotal        Decimal
  total           Decimal
  items           OrderItem[]
}

model OrderItem {
  productId   String
  productName String   // snapshot at order time
  unitPrice   Decimal  // snapshot at order time
  quantity    Int
  lineTotal   Decimal
}
```

Migration: `server/prisma/migrations/20260802100000_add_orders/`

User profile field: `User.phoneNumber` (optional; required indirectly for checkout). Migration: `server/prisma/migrations/20260802110000_add_user_phone_number/`

### API (CUSTOMER only)

All routes use `authenticate` + `authorize("CUSTOMER")`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/orders` | `{ deliveryAddress, paymentMethod, orderNotes? }` | Created order |
| GET | `/api/orders/:orderNumber` | — | Order detail (owner only) |

`paymentMethod` must be one of: `CASH_ON_DELIVERY`, `E_WALLET`, `BANK_TRANSFER`.

### Frontend

- **`/checkout`** — delivery/payment form + order summary sidebar; submits to `POST /api/orders`.
- **`/checkout/confirmation/[orderNumber]`** — confirmation message, order number, summary, delivery details.
- **`CheckoutProfileRequired`** — blocks checkout when profile phone is missing (full on `/checkout`, compact on `/cart` and `/account`).
- **`web/src/lib/checkout-profile.ts`** — `hasCheckoutContactNumber()` helper shared across checkout entry points.
- **`web/src/lib/orders.ts`** — `placeOrder`, `fetchOrder`, types, payment labels (via `authFetch`).

Key files:

- `server/src/controllers/orders.controller.ts`
- `server/src/routes/orders.ts`
- `web/src/lib/orders.ts`
- `web/src/components/storefront/checkout-form.tsx`
- `web/src/app/checkout/page.tsx`
- `web/src/app/checkout/confirmation/[orderNumber]/page.tsx`

## Changes

Added Order/OrderItem schema, CUSTOMER-only orders API (place + fetch), checkout form with all required fields and payment options, and order confirmation page with generated order number and summary. No payment gateway integration.
