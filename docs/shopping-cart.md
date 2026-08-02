# Shopping Cart

## Overview

Signed-in **customers** can add products to a server-backed shopping cart, review items, adjust quantities, and proceed toward checkout. The cart survives page refreshes and is stored in PostgreSQL (one cart per user).

**Admins** and **guests** cannot use the cart — admins manage the store; guests are prompted to sign in when they click Add to Cart.

## Behavior / rules

### Who can use the cart

| User | Add to cart | View cart | Checkout |
|------|-------------|-----------|----------|
| Guest | Redirect to login | Redirect to login | Redirect to login |
| Customer | Yes | Yes (`/cart`) | Yes (`/checkout`) |
| Admin | Hidden | Hidden (redirect to `/admin`) | N/A |

### Cart operations

- **Add** — increases quantity if the product is already in the cart; capped by live `Product.stock`. Product detail page lets the customer pick quantity (1–stock) before adding; catalog cards still add 1.
- **Update quantity** — min 1, max current stock; unavailable products cannot be increased.
- **Remove** — deletes the line item.
- **Totals** — `subtotal` and `total` are the sum of line totals (no tax/shipping yet).
- **Availability** — server rejects adds/updates for `INACTIVE`, `OUT_OF_STOCK`, or zero stock. Items that become unavailable later stay in the cart but are flagged in the UI and block checkout.

### Persistence

Cart rows live in `Cart` / `CartItem` tables keyed by `userId`. Refreshing the browser re-fetches from `GET /api/cart`.

### Checkout (current)

`/checkout` collects delivery and payment details, places the order via `POST /api/orders`, and redirects to `/checkout/confirmation/[orderNumber]`. See `docs/checkout-orders.md` for full checkout behavior.

## Implementation

### Database

```prisma
model Cart {
  id     String     @id @default(uuid())
  userId String     @unique
  items  CartItem[]
}

model CartItem {
  cartId    String
  productId String
  quantity  Int
  @@unique([cartId, productId])
}
```

Migration: `server/prisma/migrations/20260802040000_add_cart/`

### API (CUSTOMER only)

All routes use `authenticate` + `authorize("CUSTOMER")`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/cart` | — | `{ items, itemCount, subtotal, total }` |
| POST | `/api/cart/items` | `{ productId, quantity? }` | Updated cart |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` | Updated cart |
| DELETE | `/api/cart/items/:productId` | — | Updated cart |

Each `item` includes `product` (id, name, price, stock, imageUrl, status), `lineTotal`, and `available`.

### Frontend

- **`CartProvider`** — loads cart when a customer is signed in; exposes `addItem`, `updateQuantity`, `removeItem`.
- **`AddToCartButton`** — guest → login with `?redirect=`; admin → hidden; customer → calls cart API.
- **`CheckoutButton`** — product detail only for now; same auth rules as add to cart. Adds the selected quantity via the cart API, then navigates to `/checkout`.
- **`/cart`** — full cart UI with quantity controls, remove, subtotal/total, link to checkout.
- **`/checkout`** — checkout form + order summary; places order via orders API.
- **`/checkout/confirmation/[orderNumber]`** — order confirmation with order number and summary.
- Header cart icon + badge (customers only).

Key files:

- `server/src/controllers/cart.controller.ts`
- `server/src/routes/cart.ts`
- `web/src/lib/cart.ts`, `web/src/lib/cart-context.tsx`
- `web/src/components/storefront/add-to-cart-button.tsx`, `checkout-button.tsx`, `cart-view.tsx`
- `web/src/app/cart/page.tsx`, `web/src/app/checkout/page.tsx`

## Changes

Added cart schema, CUSTOMER-only cart API, cart context, cart/checkout pages, and wired Add to Cart + header badge on the storefront.
