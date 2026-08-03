# PFS — Products For Sale

A full-stack marketplace web application inspired by Shopee. Customers browse and search products, manage a persistent cart, and place orders. Admins manage the catalog, categories, orders, and customer accounts from a dedicated back office.

| Service    | URL (local)              |
|------------|--------------------------|
| Storefront | http://localhost:3000    |
| API        | http://localhost:5000    |
| PostgreSQL | localhost:5433           |

---

## Tech stack

### Frontend (`web/`)

| Layer        | Technology |
|--------------|------------|
| Framework    | [Next.js 16](https://nextjs.org/) (App Router) |
| UI           | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| Icons        | [lucide-react](https://lucide.dev/) |
| Font         | Instagram Sans (local, via `next/font/local`) |
| State        | React Context — `AuthProvider`, `CartProvider` |
| API client   | Custom `apiFetch` / `authFetch` in `web/src/lib/api.ts` |

### Backend (`server/`)

| Layer        | Technology |
|--------------|------------|
| Runtime      | Node.js 22 (Docker image) |
| Framework    | [Express 5](https://expressjs.com/), TypeScript |
| ORM          | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg` |
| Auth         | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Security     | [helmet](https://helmetjs.github.io/), [cors](https://github.com/expressjs/cors) (credentials), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| File uploads | [multer](https://github.com/expressjs/multer) → [Supabase Storage](https://supabase.com/docs/guides/storage) |
| Storage SDK  | [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction) |

### Database & infrastructure

| Layer          | Technology |
|----------------|------------|
| Database       | PostgreSQL 16 |
| Migrations     | Prisma Migrate |
| Orchestration  | Docker Compose — `postgres`, `server`, `web` |
| Dev tooling    | nodemon + tsx (server), Next.js dev with webpack in Docker |

---

## Current features

### Storefront (public)

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, category chips, featured products, footer |
| `/products` | Product catalog — search (`?q=`), category filter (`?category=`), price sort (`?sort=`), paginated "Show more" |
| `/products/[id]` | Product detail — image gallery, quantity selector, Add to Cart, Checkout shortcut |
| `/login` | Sign in; supports `?redirect=` for post-login return |
| `/register` | Create a customer account |

### Storefront (authenticated customer)

| Route | Description |
|-------|-------------|
| `/account` | Profile (name, email, editable PH phone `09XXXXXXXXX`), address book (up to 10 addresses), logout |
| `/account/orders` | Order history — status filter, pagination |
| `/account/orders/[orderNumber]` | Order detail; self-cancel while status is `PENDING` |
| `/cart` | Shopping cart — update quantity, remove items, subtotal; checkout gated on profile phone |
| `/checkout` | Checkout — profile-locked contact info, saved address picker, payment method, order notes |
| `/checkout/confirmation/[orderNumber]` | Order confirmation summary |

**Guest behavior:** Cart and checkout redirect to `/login?redirect=...`. Admin users are redirected away from cart/checkout to `/admin`.

### Admin (ADMIN role only)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard — product count, customer count |
| `/admin/products` | Product CRUD — search/filter/pagination, cover + gallery image upload, status (Active / Inactive / Out of Stock) |
| `/admin/categories` | Category CRUD — delete blocked when products reference the category |
| `/admin/orders` | Order table — search, filter, pagination |
| `/admin/orders/[orderNumber]` | Order detail + status updates |
| `/admin/customers` | Customer table — search, status filter, order totals |
| `/admin/customers/[id]` | Customer profile — order history, addresses, enable/disable account |

### Order lifecycle

```
PENDING → CONFIRMED → PREPARING → SHIPPED → COMPLETED
    └── CANCELLED (customer can cancel while PENDING; admin can cancel at any stage)
```

### Payment methods

Checkout records Cash on Delivery, E-Wallet, or Bank Transfer as labels only — there is no real payment gateway integration.

---

## Authentication flows

PFS uses **httpOnly cookie-based JWT sessions**. The browser never stores tokens in `localStorage`; all authenticated API calls send cookies via `credentials: "include"`.

| Cookie | Lifetime | Purpose |
|--------|----------|---------|
| `accessToken` | ~15 minutes | Short-lived JWT for API authorization |
| `refreshToken` | ~7 days | Long-lived JWT; SHA-256 hash stored in PostgreSQL; rotated on each refresh |

### Login flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage as /login
    participant API as Express API
    participant DB as PostgreSQL
    participant AuthCtx as AuthProvider

    User->>LoginPage: Submit email + password
    LoginPage->>API: POST /api/auth/login
    API->>DB: Verify credentials + isActive
    API-->>LoginPage: Set httpOnly cookies + user JSON
    LoginPage->>AuthCtx: applyUser(response)
    alt role is ADMIN
        LoginPage->>User: Redirect to /admin
    else role is CUSTOMER
        LoginPage->>User: Redirect to ?redirect= or /
    end
    AuthCtx->>API: GET /api/auth/me (background refetch)
```

**Login page details** (`/login`):

1. User submits email and password.
2. Frontend calls `POST /api/auth/login` via `apiFetch`.
3. On success, the server sets `accessToken` and `refreshToken` cookies and returns the user object.
4. `AuthProvider.applyUser()` updates client state immediately (no wait for `/me`).
5. Redirect: **ADMIN** → `/admin`; **CUSTOMER** → `?redirect=` param or `/`.
6. Protected routes that sent guests to login preserve the return URL, e.g. `/login?redirect=/cart`.

**Register flow** (`/register`): Same cookie pattern via `POST /api/auth/register`. New accounts are always `CUSTOMER` role.

**Logout:** `POST /api/auth/logout` revokes the refresh token in the database, clears both cookies, and redirects to `/`.

### Session refresh (automatic)

When any `authFetch` call receives `401`, the client runs a single shared refresh request (prevents parallel stampede):

```mermaid
sequenceDiagram
    participant Page
    participant authFetch
    participant API

    Page->>authFetch: GET /api/cart (or other protected route)
    authFetch->>API: Request with accessToken cookie
    API-->>authFetch: 401 Unauthorized
    authFetch->>API: POST /api/auth/refresh (refreshToken cookie)
    alt refresh succeeds
        API-->>authFetch: New cookie pair
        authFetch->>API: Retry original request
        API-->>authFetch: 200 OK
    else refresh fails
        authFetch-->>Page: 401 (user must log in again)
    end
```

**Server-side refresh rules:**

- Each successful refresh atomically revokes the old refresh token and issues a new pair (rotation).
- Concurrent refresh from multiple tabs: losers get `401` within a 30-second grace window (race, not theft).
- Presenting a refresh token revoked **more than 30 seconds ago** revokes all sessions for that user (theft detection).

### Route guards

| Area | Guard behavior |
|------|----------------|
| `/admin/*` | Server layout checks auth; no user → `/login`; non-admin → `/` |
| `/account/*`, `/cart`, `/checkout` | Client-side redirect to `/login?redirect=...` if unauthenticated |
| Disabled accounts | Login returns `403`; valid access tokens return `401` on any protected route |

### Demo accounts (seed data)

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `password123` | ADMIN |
| `customer@example.com` | `password123` | CUSTOMER |

Seeded when `SEED_DB=true` (default in Docker development).

---

## Project structure

```
pfs-platform/
├── docker-compose.yml       # postgres + server + web
├── docs/                    # Feature documentation + CHANGELOG
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # Data model
│   │   ├── seed.ts          # Demo users, categories, products
│   │   └── migrations/
│   └── src/
│       ├── index.ts         # Express bootstrap
│       ├── controllers/     # Route handlers
│       ├── middleware/      # auth, rate limits, upload
│       ├── routes/          # API route definitions
│       └── utils/           # JWT, tokens, env, phone formatting
└── web/
    └── src/
        ├── app/             # Next.js App Router pages
        ├── components/
        │   ├── storefront/  # Customer-facing UI
        │   └── admin/       # Admin panel UI
        └── lib/             # API client, auth/cart context, helpers
```

### Data model (high level)

- **User** — email, password hash, name, phone number, role (`ADMIN` / `CUSTOMER`), `isActive`
- **RefreshToken** — hashed refresh tokens with revocation tracking
- **Category** — product categories with sort order
- **Product** — name, price, stock, cover image, status, gallery (`ProductImage`)
- **Cart / CartItem** — per-user persistent shopping cart
- **Order / OrderItem** — placed orders with status workflow and delivery snapshot
- **Address** — saved delivery addresses (label, street, barangay, city, province, postal code, default flag)

---

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A [Supabase](https://supabase.com/) project (Storage bucket for product images — required even for non-upload features)

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd pfs-platform
```

Create these env files (no `.env.example` is committed yet — use the templates below):

**Root `.env`** (PostgreSQL service):

```env
DB_USER=pfs_admin
DB_PASSWORD=your_secure_password
DB_NAME=pfs_platform_db
```

**`server/.env`:**

```env
PORT=5000
NODE_ENV=development
SEED_DB=true

DATABASE_URL=postgresql://pfs_admin:your_secure_password@postgres:5432/pfs_platform_db

JWT_SECRET=your_jwt_secret_at_least_32_characters_long
JWT_REFRESH_SECRET=your_different_refresh_secret_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000,http://localhost:3001

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=pfs-products

# Optional — transactional order emails via Brevo (see docs/order-emails.md)
BREVO_API_KEY=xkeysib-xxxxxxxx
BREVO_SENDER_EMAIL=your-verified-sender@gmail.com
BREVO_SENDER_NAME=PFS

# Optional — base URL for verification links in emails (defaults to first CORS_ORIGIN)
APP_URL=http://localhost:3000
```

**`web/.env`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> When running the server outside Docker, change `DATABASE_URL` to use `localhost:5433` instead of `postgres:5432`.

### 2. Start with Docker Compose

```bash
docker compose up -d
```

The server container automatically runs:

1. `prisma generate`
2. `prisma migrate deploy`
3. `prisma db seed` (when `SEED_DB=true`)
4. `npm run dev`

Open http://localhost:3000 and sign in with a demo account.

### 3. Run without Docker (optional)

Requires a local PostgreSQL instance.

```bash
# Terminal 1 — API
cd server
npm install
npx prisma generate && npx prisma migrate deploy
SEED_DB=true npx prisma db seed   # optional
npm run dev                        # http://localhost:5000

# Terminal 2 — Storefront
cd web
npm install
npm run dev                        # http://localhost:3000
```

---

## API overview

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Create customer account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate token pair |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/homepage/featured` | Featured products (up to 8) |
| GET | `/api/homepage/categories` | Homepage category list |
| GET | `/api/products` | Paginated catalog |
| GET | `/api/products/search?q=` | Search by name/description |
| GET | `/api/products/by-category?categoryId=` | Filter by category |
| GET | `/api/products/:id` | Product detail |

### Authenticated (any role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update phone number |
| GET/POST/PUT/PATCH/DELETE | `/api/addresses/*` | Address book CRUD + set default |

### Customer only

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/api/cart/*` | Shopping cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | List own orders |
| GET | `/api/orders/:orderNumber` | Order detail |
| PATCH | `/api/orders/:orderNumber/cancel` | Self-cancel pending order |

### Admin only (`/api/admin/*`)

Dashboard stats, product CRUD + image upload, category CRUD, order management, customer management (enable/disable).

See [`docs/`](docs/) for detailed feature documentation on each area.

---

## Documentation

| Doc | Topic |
|-----|-------|
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Dated change log |
| [`docs/docker-local-dev.md`](docs/docker-local-dev.md) | Docker setup, seeding, troubleshooting |
| [`docs/auth-sessions.md`](docs/auth-sessions.md) | Cookie auth, refresh rotation, rate limits |
| [`docs/shopping-cart.md`](docs/shopping-cart.md) | DB-backed cart |
| [`docs/checkout-orders.md`](docs/checkout-orders.md) | Checkout and order placement |
| [`docs/user-profile.md`](docs/user-profile.md) | Account page, phone, address book |
| [`docs/admin-dashboard.md`](docs/admin-dashboard.md) | Admin panel overview |
| [`docs/product-listing.md`](docs/product-listing.md) | Catalog and product detail |
| [`docs/customer-management.md`](docs/customer-management.md) | Admin customer management |

---

## Known limitations

- **No payment gateway** — payment method is stored as an enum label only.
- **Supabase required** — server validates Supabase env vars at startup.
- **Philippine locale** — phone numbers use `09XXXXXXXXX` format; addresses require barangay.
- **Admin dashboard** — order/sales stat cards are placeholders; API currently returns product and customer counts only.

---

## License

ISC (server). See individual `package.json` files for package-level details.
