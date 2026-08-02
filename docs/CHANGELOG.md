# Changelog

Project change log. Updated whenever feature documentation under `docs/` is added or revised.

Entries are newest first.

## 2026-08-02 — Admin customer management (profiles, order history, enable/disable)

- **Doc:** `docs/customer-management.md` (also updated `docs/auth-sessions.md` cross-reference)
- **What changed:** Admins can now manage customer accounts from `/admin/customers` — a searchable/filterable (by account status)/paginated table (customer name, email, contact number, number of orders, total purchase amount, account status) and a profile page at `/admin/customers/[id]` (contact info, order history linking into the existing admin order detail page, and saved addresses). Admins can disable or re-enable a customer's account from either view, with a confirmation dialog. Disabling immediately revokes all of that customer's refresh tokens (logging them out everywhere) and blocks both future logins (`403`) and any still-valid access token (`401` via `authenticate`). Added `User.isActive` (defaults to `true`). Order count/purchase totals exclude `CANCELLED` orders. New admin-only endpoints: `GET /api/admin/customers`, `GET /api/admin/customers/:id`, `PATCH /api/admin/customers/:id/status`. Added a "Customers" entry to the admin sidebar.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802064316_add_user_is_active/`, `server/src/controllers/admin-customers.controller.ts`, `server/src/routes/admin.ts`, `server/src/middleware/auth.middleware.ts`, `server/src/controllers/auth.controller.ts`, `web/src/lib/admin/customers.ts`, `web/src/app/admin/customers/page.tsx`, `web/src/app/admin/customers/[id]/page.tsx`, `web/src/components/admin/sidebar.tsx`, `docs/customer-management.md`, `docs/auth-sessions.md`

## 2026-08-02 — Customer order management (history, details, self-cancel)

- **Doc:** `docs/customer-order-management.md` (also updated `docs/admin-orders.md` cross-reference)
- **What changed:** Customers can now view their own order history at `/account/orders` (status filter, pagination, status badges) and full order details at `/account/orders/[orderNumber]`, and can self-cancel an order while it's still `PENDING` (before an admin confirms it) via a "Cancel order" action with a confirmation dialog. Cancelling restores the reserved stock for each line item and un-marks any product that had been auto-flipped to `OUT_OF_STOCK`. New owner-scoped endpoints: `GET /api/orders` (list) and `PATCH /api/orders/:orderNumber/cancel`. Moved the shared `OrderStatusBadge` component out of `components/admin/` into `web/src/components/order-status-badge.tsx` so both admin and customer order views use it. Added a "My Orders" link on the account page.
- **Files:** `server/src/controllers/orders.controller.ts`, `server/src/routes/orders.ts`, `web/src/lib/orders.ts`, `web/src/components/order-status-badge.tsx` (moved from `web/src/components/admin/order-status-badge.tsx`), `web/src/app/admin/orders/page.tsx`, `web/src/app/admin/orders/[orderNumber]/page.tsx`, `web/src/app/account/orders/page.tsx`, `web/src/app/account/orders/[orderNumber]/page.tsx`, `web/src/app/account/page.tsx`, `docs/customer-order-management.md`

## 2026-08-02 — Admin order management (table + details, status updates)

- **Doc:** `docs/admin-orders.md` (also updated `docs/checkout-orders.md`, `docs/admin-dashboard.md`)
- **What changed:** Admins can now manage orders from `/admin/orders` — a searchable/filterable/paginated table (order number, customer name, order date, total, payment method, status badge, "View Details") and a detail page at `/admin/orders/[orderNumber]` (customer info, delivery address, ordered products with quantities, subtotal, total, payment method, order notes, and a status dropdown to update the order). Extended `OrderStatus` with `PREPARING`, `SHIPPED`, and `COMPLETED` (previously only `PENDING`/`CONFIRMED`/`CANCELLED`) to support the full fulfillment workflow. New admin-only endpoints: `GET /api/admin/orders`, `GET /api/admin/orders/:orderNumber`, `PATCH /api/admin/orders/:orderNumber/status` — these are not owner-scoped, unlike the existing customer-only `/api/orders`. Extracted the shared order-formatting logic (`orderInclude`/`formatOrder`/`paramOrderNumber`) out of `orders.controller.ts` into `server/src/utils/order-formatting.ts` so the new admin controller doesn't duplicate it. Added an "Orders" entry to the admin sidebar.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802150000_extend_order_status/`, `server/src/utils/order-formatting.ts`, `server/src/controllers/orders.controller.ts`, `server/src/controllers/admin-orders.controller.ts`, `server/src/routes/admin.ts`, `web/src/lib/orders.ts`, `web/src/lib/admin/orders.ts`, `web/src/components/admin/order-status-badge.tsx`, `web/src/components/admin/sidebar.tsx`, `web/src/app/admin/orders/page.tsx`, `web/src/app/admin/orders/[orderNumber]/page.tsx`, `docs/admin-orders.md`, `docs/checkout-orders.md`, `docs/admin-dashboard.md`

## 2026-08-02 — Checkout now selects from saved address book

- **Doc:** `docs/checkout-orders.md`
- **What changed:** The checkout delivery address is no longer a free-text textarea — customers pick from their saved address book (default pre-selected) via a new `DeliveryAddressPicker`. If they have no saved addresses yet, the picker shows an empty state with an inline "Add delivery address" form (reusing the account page's modal + `AddressForm`), so checkout never dead-ends on a missing profile address. `POST /api/orders` now takes `addressId` instead of `deliveryAddress`; the server resolves and formats the address server-side (rejecting `addressId`s that don't belong to the caller) into the existing `Order.deliveryAddress` text snapshot — no schema change needed.
- **Files:** `server/src/controllers/orders.controller.ts`, `web/src/lib/orders.ts`, `web/src/components/storefront/checkout-form.tsx`, `web/src/components/storefront/delivery-address-picker.tsx`, `docs/checkout-orders.md`

## 2026-08-02 — Address book: barangay now required

- **Doc:** `docs/user-profile.md`
- **What changed:** The barangay field (`addressLine2`) on saved addresses is now required instead of optional — enforced at the database level (`NOT NULL`, backfilling any existing blanks), in the address API validation, and in the add/edit form (marked required, no longer labeled optional).
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802140000_address_barangay_required/`, `server/src/controllers/addresses.controller.ts`, `web/src/lib/addresses.ts`, `web/src/components/storefront/address-form.tsx`, `web/src/components/storefront/address-book.tsx`, `docs/user-profile.md`

## 2026-08-02 — Address book: drop per-address recipient/contact fields

- **Doc:** `docs/user-profile.md`
- **What changed:** Saved addresses are now address-only — removed the per-address `recipientName` and `phoneNumber` fields (added moments earlier) from the `Address` model, API, and the add/edit form. An address is just label + street/barangay + city/province/postal code; recipient name and contact number continue to come from the account profile.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802130000_remove_address_recipient_contact/`, `server/src/controllers/addresses.controller.ts`, `web/src/lib/addresses.ts`, `web/src/components/storefront/address-form.tsx`, `web/src/components/storefront/address-book.tsx`, `docs/user-profile.md`

## 2026-08-02 — Delivery address book (multiple saved addresses + default)

- **Doc:** `docs/user-profile.md`
- **What changed:** Customers can now save multiple delivery addresses on `/account` (Shopee-style address book): label, recipient name, PH-format contact number, street/barangay, city, province, postal code. Exactly one address is the default at all times — the first saved address becomes default automatically, "Set as default" promotes any other address (demoting the previous one), and deleting the default auto-promotes the next-oldest remaining address. Capped at 10 addresses/customer. Add/edit via a modal form; delete via a confirmation dialog. New `Address` model + CRUD/set-default API. Not yet wired into checkout (`CheckoutForm` still takes a free-text delivery address).
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802120000_add_addresses/`, `server/src/utils/phone.ts` (new shared helper, also used by `auth.controller.ts`), `server/src/controllers/addresses.controller.ts`, `server/src/controllers/auth.controller.ts`, `server/src/routes/addresses.ts`, `server/src/middleware/rateLimiter.ts`, `server/src/index.ts`, `web/src/lib/addresses.ts`, `web/src/components/storefront/address-book.tsx`, `web/src/components/storefront/address-form.tsx`, `web/src/components/storefront/modal.tsx`, `web/src/components/storefront/confirm-dialog.tsx`, `web/src/app/account/page.tsx`, `docs/user-profile.md`

## 2026-08-02 — Contact number restricted to Philippine mobile format

- **Doc:** `docs/user-profile.md`
- **What changed:** The account page's phone number field now requires the Philippine mobile format — exactly 11 digits starting with `09`, normalized/stored as `0912 234 2345`. The input auto-formats as you type (digits only, grouped, capped at 11 digits); the server independently strips non-digits and re-validates the same `09XXXXXXXXX` pattern before saving, so any prior looser format is rejected on next edit.
- **Files:** `server/src/controllers/auth.controller.ts`, `web/src/components/storefront/phone-number-field.tsx`, `docs/user-profile.md`

## 2026-08-02 — Account page redesign + editable contact number

- **Doc:** `docs/user-profile.md` (also updated `docs/checkout-orders.md`)
- **What changed:** Redesigned `/account` (identity card with initials avatar + role badge, sectioned "Contact details" / "Member since" cards, shared `Header`/`Footer` chrome instead of a chromeless page). Customers can now edit their contact number inline via a new `PATCH /api/auth/me` endpoint (validated: 7+ digits, digits/`+`/`-`/spaces/parens only, 20 char max, rate-limited). `/api/auth/me`, login, and register responses now include `createdAt`. Updated checkout copy that referenced "profile editing coming soon" to point at the account page.
- **Files:** `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.ts`, `server/src/middleware/rateLimiter.ts`, `web/src/lib/profile.ts`, `web/src/lib/auth-context.tsx`, `web/src/components/storefront/phone-number-field.tsx`, `web/src/app/account/page.tsx`, `web/src/components/storefront/checkout-form.tsx`, `web/src/components/storefront/checkout-profile-required.tsx`, `docs/user-profile.md`, `docs/checkout-orders.md`

## 2026-08-02 — Fix login after profile schema change (Docker)

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Login appeared broken because `/api/auth/me` failed when the `phoneNumber` migration/client were stale in a running server container. Applied migration + `prisma generate` guidance updated. Login/register now apply the auth response immediately so a transient `/me` failure does not block sign-in.
- **Files:** `web/src/lib/auth-context.tsx`, `web/src/app/login/page.tsx`, `web/src/app/register/page.tsx`, `docs/docker-local-dev.md`

## 2026-08-02 — Checkout profile gate (contact number required)

- **Doc:** `docs/checkout-orders.md`
- **What changed:** Customers without a profile contact number cannot proceed to checkout: cart disables the checkout button with a compact alert, checkout page shows a full contact-required prompt instead of the form, and the account page surfaces the same notice. Shared `hasCheckoutContactNumber()` helper; server rejection unchanged.
- **Files:** `web/src/lib/checkout-profile.ts`, `web/src/components/storefront/checkout-profile-required.tsx`, `web/src/app/checkout/page.tsx`, `web/src/components/storefront/cart-view.tsx`, `web/src/app/account/page.tsx`, `docs/checkout-orders.md`

## 2026-08-02 — Checkout: profile-locked contact details + user phone number

- **Doc:** `docs/checkout-orders.md`
- **What changed:** Checkout name, email, and contact number are read-only and sourced from the signed-in user's profile. Added optional `User.phoneNumber` column; orders API reads profile fields server-side and rejects checkout when phone is missing. Account page shows phone number.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802110000_add_user_phone_number/`, `server/src/controllers/auth.controller.ts`, `server/src/controllers/orders.controller.ts`, `web/src/lib/auth-context.tsx`, `web/src/lib/orders.ts`, `web/src/components/storefront/checkout-form.tsx`, `web/src/app/checkout/page.tsx`, `web/src/app/account/page.tsx`, `docs/checkout-orders.md`

## 2026-08-02 — Checkout & order placement

- **Doc:** `docs/checkout-orders.md`, `docs/shopping-cart.md`
- **What changed:** Customers can complete checkout with name, email, contact, delivery address, payment method (Cash on Delivery, E-Wallet, Bank Transfer), and optional order notes. Placing an order creates an `Order` + `OrderItem` rows, decrements stock, clears the cart, and redirects to a confirmation page showing the generated order number and order summary. No real payment gateway.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802100000_add_orders/`, `server/src/controllers/orders.controller.ts`, `server/src/routes/orders.ts`, `server/src/index.ts`, `web/src/lib/orders.ts`, `web/src/components/storefront/checkout-form.tsx`, `web/src/app/checkout/page.tsx`, `web/src/app/checkout/confirmation/[orderNumber]/page.tsx`, `docs/checkout-orders.md`, `docs/shopping-cart.md`

## 2026-08-02 — Product detail: Checkout button

- **Doc:** `docs/product-listing.md`, `docs/shopping-cart.md`
- **What changed:** Product detail page adds a **Checkout** button (outline style) below Add to Cart. Uses the selected quantity, adds to cart via existing API, then navigates to `/checkout`. Guests redirect to login; admins see neither cart action. No new checkout/order endpoint yet.
- **Files:** `web/src/components/storefront/checkout-button.tsx`, `web/src/components/storefront/product-detail.tsx`, `docs/product-listing.md`, `docs/shopping-cart.md`

## 2026-08-02 — Product detail: quantity selector before add to cart

- **Doc:** `docs/product-listing.md`, `docs/shopping-cart.md`
- **What changed:** Product detail page (`/products/[id]`) now shows +/- quantity controls (min 1, max current stock) before Add to Cart. Selected quantity is sent to `POST /api/cart/items`. Catalog cards still add one at a time.
- **Files:** `web/src/components/storefront/product-detail.tsx`, `web/src/components/storefront/add-to-cart-button.tsx`, `docs/product-listing.md`, `docs/shopping-cart.md`

## 2026-08-02 — Docker: stale Prisma client after schema change

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Documented that a running `pfs_server` container may need `prisma generate` + restart after new Prisma models are added; otherwise cart (and similar) endpoints return generic 500s because `prisma.<model>` is undefined in the old client.
- **Files:** `docs/docker-local-dev.md`

## 2026-08-02 — Shopping cart (customers only, DB-backed)

- **Doc:** `docs/shopping-cart.md`
- **What changed:** Customers can add products to a persistent cart, update quantities, remove items, view subtotal/total, and proceed to a checkout summary page. Cart is stored in PostgreSQL (`Cart` / `CartItem`) and survives refresh. Guests are sent to login; admins cannot add to cart (button hidden, no cart icon). Checkout place-order is a stub until payments/orders ship.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260802040000_add_cart/`, `server/src/controllers/cart.controller.ts`, `server/src/routes/cart.ts`, `server/src/index.ts`, `web/src/lib/cart.ts`, `web/src/lib/cart-context.tsx`, `web/src/components/storefront/add-to-cart-button.tsx`, `web/src/components/storefront/cart-view.tsx`, `web/src/components/storefront/header.tsx`, `web/src/components/storefront/product-card.tsx`, `web/src/components/storefront/product-detail.tsx`, `web/src/app/cart/page.tsx`, `web/src/app/checkout/page.tsx`, `web/src/app/layout.tsx`, `web/src/app/login/page.tsx`, `docs/shopping-cart.md`, `docs/product-listing.md`

## 2026-08-02 — Product catalog: "Show more" replaces page-number pagination

- **Doc:** `docs/product-listing.md`
- **What changed:** `/products` used Previous/Next buttons with a `?page=` URL param, replacing the grid on every click. Swapped that for a "Show more products" button that fetches the next page and appends it to the existing grid, so browsing feels continuous instead of resetting scroll position each click. Search/category/sort changes still fully reset the grid to a fresh first page (no mixing results across filters). Dropped `?page=` from the URL since there's no longer a discrete "page" to bookmark — changing a filter or reloading always starts from the top.
- **Files:** `web/src/components/storefront/product-catalog.tsx`, `docs/product-listing.md`

## 2026-08-02 — Product detail redesign, image gallery, description overflow fix

- **Doc:** `docs/product-listing.md` (also updated `docs/product-images.md`)
- **What changed:** A description with no whitespace (one long unbroken run of characters) forced the page into endless horizontal scroll, because the text had no way to wrap. Description text now always wraps (`break-words` + `min-w-0` on the flex/grid item), descriptions are capped at 4,000 characters on the admin form (`maxLength` + live counter) and re-validated server-side, and the storefront detail page shows only ~1 paragraph with a "See more"/"See less" toggle for longer text. Also redesigned the detail page (category pill, in-stock/out-of-stock pill, restyled Add to Cart) and added a clickable image gallery (cover + `ProductImage` gallery shots), which the public detail API already returned but the page never rendered. Add to Cart remains UI-only — no cart state/backend added.
- **Files:** `web/src/components/storefront/product-detail.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/lib/product.ts`, `server/src/controllers/admin-products.controller.ts`, `docs/product-listing.md`, `docs/product-images.md`

## 2026-08-02 — Docker web: exclude `.next` from image (chunk error)

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Browser error `can't infer type of chunk from URL app-pages-internals` came from a Turbopack `.next` cache baked into the web image (`COPY . .` with no ignore) and copied into the anonymous `/app/.next` volume, while the container ran webpack. Added `web/.dockerignore` and documented how to wipe the volume + rebuild.
- **Files:** `web/.dockerignore`, `docs/docker-local-dev.md`

## 2026-08-02 — Docker web performance (webpack + heap)

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** `pfs_web` was hitting Next.js’s memory-threshold restart under Turbopack (multi‑GB RAM / high CPU), which forced cold compiles and multi-second page times. Docker web now runs `next dev --webpack`, sets `NODE_OPTIONS=--max-old-space-size=4096`, and the catalog guards against a missing `items` array.
- **Files:** `web/Dockerfile`, `docker-compose.yml`, `web/src/components/storefront/product-catalog.tsx`, `docs/docker-local-dev.md`

## 2026-08-02 — Storefront vs admin component folders

- **Doc:** `docs/frontend-components.md` (paths updated in homepage/product/admin docs)
- **What changed:** Moved customer-facing UI into `web/src/components/storefront/`, keeping `web/src/components/admin/` for admin-only UI and shared `logo` / `theme-toggle` at the components root. Import paths and docs updated accordingly; no behavior change.
- **Files:** `web/src/components/storefront/*`, `web/src/app/page.tsx`, `web/src/app/products/page.tsx`, `web/src/app/products/[id]/page.tsx`, `docs/frontend-components.md`, `docs/product-listing.md`, `docs/product-search.md`, `docs/homepage-featured.md`, `docs/homepage-footer.md`, `docs/product-images.md`, `docs/admin-dashboard.md`

## 2026-08-02 — Storefront product listing page

- **Doc:** `docs/product-listing.md` (also updated `docs/product-search.md`, `docs/homepage-featured.md`)
- **What changed:** Added a dedicated `/products` catalog with search, category filter, price sorting, and pagination (default 12/page). `GET /api/products` is now a paginated public catalog (excludes inactive); added `GET /api/products/:id` plus a simple detail page. Homepage/header CTAs and search now route into the catalog; seed expanded to 12 sample products.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `server/src/controllers/homepage.controller.ts`, `server/prisma/seed.ts`, `web/src/app/products/page.tsx`, `web/src/app/products/[id]/page.tsx`, `web/src/components/product-catalog.tsx`, `web/src/components/product-detail.tsx`, `web/src/components/product-card.tsx`, `web/src/components/featured-products.tsx`, `web/src/components/category-nav.tsx`, `web/src/components/hero.tsx`, `web/src/components/header.tsx`, `web/src/components/header-search.tsx`, `web/src/app/page.tsx`, `web/src/lib/product.ts`, `docs/product-listing.md`, `docs/product-search.md`, `docs/homepage-featured.md`

## 2026-08-01 — Admin product filter selects dark-mode fix

- **Doc:** `docs/admin-products.md`
- **What changed:** Category/status filter dropdowns (and the matching selects in the product form) used `bg-transparent` with tight horizontal padding, so in dark mode the native option list was hard to read and the caret sat flush against the border. Selects now use solid `bg-paper` / `dark:bg-ink-soft`, extra right padding, global `color-scheme`, and option colors for readable popups.
- **Files:** `web/src/app/admin/products/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/app/globals.css`, `docs/admin-products.md`

## 2026-08-01 — Mobile header product search

- **Doc:** `docs/product-search.md`
- **What changed:** Storefront header search was desktop-only (`hidden` below `md`). On mobile, a search icon now sits with the theme/cart actions and opens a full-width search bar under the header (auto-focus, Escape/submit to close). Same `/?q=…` flow as desktop.
- **Files:** `web/src/components/header-search.tsx`, `web/src/components/header.tsx`, `docs/product-search.md`

## 2026-08-01 — Admin `lib` code moved under `lib/admin/`

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Moved the admin-only frontend data modules into `web/src/lib/admin/` (`lib/admin.ts` → `lib/admin/dashboard.ts`, `lib/admin-products.ts` → `lib/admin/products.ts`, `lib/admin-categories.ts` → `lib/admin/categories.ts`), mirroring the existing `web/src/components/admin/` split so admin-only code is grouped separately from shared/storefront `lib` code. No behavior change — updated all importers accordingly.
- **Files:** `web/src/lib/admin/dashboard.ts`, `web/src/lib/admin/products.ts`, `web/src/lib/admin/categories.ts`, `web/src/app/admin/page.tsx`, `web/src/app/admin/products/page.tsx`, `web/src/app/admin/categories/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/components/admin/category-form.tsx`, `docs/admin-dashboard.md`, `docs/admin-products.md`, `docs/admin-categories.md`

## 2026-08-01 — Admin category management

- **Doc:** `docs/admin-categories.md`
- **What changed:** Added admin category CRUD (`GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/:id`) with product counts. Deletion is hard-blocked (`409`) while any product still references the category; the `/admin/categories` page shows a table with add/edit modal and a delete confirmation whose button is disabled (with a tooltip) when the category is in use.
- **Files:** `server/src/controllers/admin-categories.controller.ts`, `server/src/routes/admin.ts`, `web/src/app/admin/categories/page.tsx`, `web/src/components/admin/category-form.tsx`, `web/src/lib/category.ts`, `web/src/lib/admin-categories.ts`, `docs/admin-categories.md`

## 2026-08-01 — Admin product management + image uploads

- **Doc:** `docs/admin-products.md`
- **What changed:** Added full admin product CRUD (view/search/filter/add/edit/delete) at `/admin/products`, with a confirmation dialog before delete. Added a `ProductStatus` enum (`Active`/`Inactive`/`Out of Stock`, manually set, independent of stock) and admin endpoints under `/api/admin/products` (list with search/category/status filters + pagination, get, create, update, delete). Product images (cover + optional gallery, backed by the existing `ProductImage` table) are now real file uploads to Supabase Storage via a new `POST /api/admin/products/upload-image` endpoint, instead of a plain URL field. Removed the old public admin-create route on `POST /api/products` (superseded by `/api/admin/products`). Bumped the server Docker image to `node:22-alpine` (required by `@supabase/supabase-js`).
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801071445_add_product_status/`, `server/src/config/supabase.ts`, `server/src/middleware/upload.middleware.ts`, `server/src/controllers/admin-products.controller.ts`, `server/src/routes/admin.ts`, `server/src/routes/products.ts`, `server/src/controllers/products.controller.ts`, `server/src/utils/env.ts`, `server/Dockerfile`, `server/package.json`, `web/src/app/admin/products/page.tsx`, `web/src/components/admin/product-form.tsx`, `web/src/lib/product.ts`, `web/src/lib/admin-products.ts`, `docs/admin-products.md`

## 2026-08-01 — Admin sidebar shell + shared dialog primitives

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Restyled the admin shell with a left sidebar (`Dashboard` / `Products` / `Categories`) alongside the existing top bar, shared by all `/admin/*` pages. Added reusable `Modal` and `ConfirmDialog` components used by the new Products and Categories management pages.
- **Files:** `web/src/app/admin/layout.tsx`, `web/src/components/admin/sidebar.tsx`, `web/src/components/admin/modal.tsx`, `web/src/components/admin/confirm-dialog.tsx`, `docs/admin-dashboard.md`

## 2026-08-01 — Homepage footer contact + social links

- **Doc:** `docs/homepage-footer.md`
- **What changed:** Expanded the homepage footer with a Contact column (dummy email/phone/address) and a Follow us column (dummy Facebook/Instagram/X/LinkedIn links), keeping the existing copyright + Help/Terms/Privacy row. Added small inline SVG brand icons since `lucide-react` doesn't ship trademarked social logos.
- **Files:** `web/src/components/footer.tsx`, `web/src/components/social-icons.tsx`, `docs/homepage-footer.md`

## 2026-08-01 — Admin dashboard overview

- **Doc:** `docs/admin-dashboard.md`
- **What changed:** Overhauled the placeholder `/admin` page into a dashboard with six summary cards (Total Products, Total Orders, Pending Orders, Completed Orders, Total Customers, Total Sales). Added admin-only `GET /api/admin/dashboard-stats` returning product and customer counts; order/sales cards are placeholders pending an orders data model. Admin chrome now lives in a dedicated `admin/header.tsx` component (logo, "Admin" badge, back to store, theme toggle, logout), keeping `admin/layout.tsx` limited to the auth/role guard; extracted a shared `Logo` component reused by both the storefront `Header` and `admin/header.tsx`. Admin-only components live under `web/src/components/admin/` (separate from shared/storefront components) to keep the components folder from getting mixed.
- **Files:** `server/src/controllers/admin.controller.ts`, `server/src/routes/admin.ts`, `server/src/index.ts`, `web/src/app/admin/page.tsx`, `web/src/app/admin/layout.tsx`, `web/src/components/admin/header.tsx`, `web/src/components/admin/stat-card.tsx`, `web/src/components/logo.tsx`, `web/src/components/header.tsx`, `web/src/lib/admin.ts`, `docs/admin-dashboard.md`

## 2026-08-01 — Product cover images + gallery model

- **Doc:** `docs/product-images.md`
- **What changed:** `Product.imageUrl` is required (cover). Added empty `ProductImage` gallery table for future detail views. Seed fills covers from public Supabase Storage. Product cards render covers; `POST /api/products` requires `imageUrl`.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801070000_product_images_required_cover/`, `server/prisma/seed.ts`, `server/src/controllers/products.controller.ts`, `web/src/components/product-card.tsx`, `web/src/lib/product.ts`, `docs/homepage-featured.md`, `docs/product-search.md`, `docs/baseline-project-state.md`

## 2026-08-01 — Homepage category product filter

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Category chips navigate to `/?category=<id>` and load products from public `GET /api/products/by-category?categoryId=`. “All” restores featured products. Works logged out.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `web/src/components/category-nav.tsx`, `web/src/components/featured-products.tsx`, `web/src/app/page.tsx`, `docs/homepage-featured.md`

## 2026-08-01 — Public product search from header

- **Doc:** `docs/product-search.md`
- **What changed:** Added public `GET /api/products/search?q=` (name/description, case-insensitive). Header search navigates to `/?q=…`; homepage shows a results grid (works logged out). Uses `apiFetch`.
- **Files:** `server/src/controllers/products.controller.ts`, `server/src/routes/products.ts`, `web/src/components/header-search.tsx`, `web/src/components/header.tsx`, `web/src/components/search-results.tsx`, `web/src/app/page.tsx`, `docs/product-search.md`

## 2026-08-01 — Frontend API client logging (dev only)

- **Doc:** `docs/frontend-api-client.md`
- **What changed:** Added shared `apiFetch` that logs method/path/status in development only. String bodies default to `Content-Type: application/json` when unset (FormData/Blob unchanged). Existing homepage and auth fetches now use `apiFetch`/`authFetch` instead of raw `fetch`.
- **Files:** `web/src/lib/api.ts`, `web/src/lib/auth-context.tsx`, `web/src/components/category-nav.tsx`, `web/src/components/featured-products.tsx`, `web/src/app/login/page.tsx`, `web/src/app/register/page.tsx`, `.cursor/rules/frontend-api-logging.mdc`, `docs/frontend-api-client.md`

## 2026-08-01 — Prisma generate on server container start

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Server Docker `CMD` runs `npx prisma generate` before migrate/seed so the client matches the mounted schema (fixes missing models like `prisma.category` after schema changes).
- **Files:** `server/Dockerfile`, `docs/docker-local-dev.md`

## 2026-08-01 — Homepage categories from database

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Added `Category` table and optional `Product.categoryId`. Homepage category nav loads from `GET /api/homepage/categories`. Seed upserts categories and links mock products. No admin CRUD yet.
- **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/20260801050000_add_product_categories/`, `server/prisma/seed.ts`, `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`, `web/src/components/category-nav.tsx`, `web/src/lib/category.ts`, `docs/homepage-featured.md`

## 2026-08-01 — Homepage featured products from database

- **Doc:** `docs/homepage-featured.md`
- **What changed:** Homepage “Trending now” grid loads from `GET /api/homepage/featured` (Product table, limit 8). Removed `web/src/lib/mock-data.ts`.
- **Files:** `server/src/controllers/homepage.controller.ts`, `server/src/routes/homepage.ts`, `server/src/index.ts`, `web/src/components/featured-products.tsx`, `web/src/components/product-card.tsx`, `web/src/components/category-nav.tsx`, `web/src/lib/product.ts`, `docs/homepage-featured.md`

## 2026-08-01 — Enable DB seed by default in local Docker

- **Doc:** `docs/docker-local-dev.md`
- **What changed:** Set `SEED_DB=true` for development so server startup runs `prisma db seed` after migrations (admin/customer + mock products).
- **Files:** `server/.env`, `docker-compose.yml`, `docs/docker-local-dev.md`

## 2026-08-01 — Auth refresh race hardening + logout rate limit

- **Doc:** `docs/auth-sessions.md`
- **What changed:** Refresh rotation now atomically claims the presented token; mass logout on reuse only applies when a revoked token is replayed outside a 30s grace window. Frontend `authFetch` single-flights refresh. Logout is rate-limited.
- **Files:** `server/src/controllers/auth.controller.ts`, `server/src/middleware/rateLimiter.ts`, `server/src/routes/auth.ts`, `web/src/lib/api.ts`, `docs/auth-sessions.md`

## 2026-08-01 — Baseline project state documented

- **Doc:** `docs/baseline-project-state.md`
- **What changed:** Captured the initial operational basepoint of PFS before further Cursor-driven feature work — monorepo layout, auth/products APIs, storefront pages, data model, Docker topology, and known gaps/placeholders.
- **Files:** `docs/baseline-project-state.md`, `docs/CHANGELOG.md`

<!--
## YYYY-MM-DD — Short summary

- **Doc:** `docs/feature-name.md`
- **What changed:** concise explanation of behavior and implementation updates
- **Files:** key paths touched
-->
