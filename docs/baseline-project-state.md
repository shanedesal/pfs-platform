# PFS Platform — Baseline Project State

**Date frozen:** 2026-08-01  
**Purpose:** Operational basepoint describing the app as it exists before further Cursor-driven feature work. Use this document as the reference “before” state when planning, implementing, or reviewing later changes.

---

## Overview

**PFS (Products For Sale)** is a marketplace-style web application: a Next.js storefront plus an Express API backed by PostgreSQL.

At this baseline, the product surface is a branded marketing/home experience with mock featured products, while the backend already supports real auth (register/login/refresh/logout), role-based access (ADMIN / CUSTOMER), and a minimal products API. Several UI pieces (search, cart, category browsing, admin dashboard content) are present as shells or placeholders and are not yet wired to full business logic.

This doc exists so future features have a clear starting line: what works, what is stubbed, and how the stack is arranged.

---

## Behavior / rules

### Product intent (current)

- Public visitors see a home page with header, hero, category nav, trending products (from **mock data**, not the API), and footer.
- Users can register and sign in; sessions use httpOnly cookies (access + refresh tokens).
- Authenticated **CUSTOMER** users land on home after login and can open `/account` for profile summary + logout.
- Authenticated **ADMIN** users are redirected to `/admin` after login; non-admins are blocked from the admin layout.
- Product listing via API is public; creating products via API requires ADMIN.
- Cart button, search input, and “Browse Products” CTA are UI-only at this baseline (no cart/checkout/catalog routes yet).
- Featured products on the web app still use `web/src/lib/mock-data.ts`; a TODO notes swapping to `GET /api/products` once ratings/sales aggregation exists.

### Auth rules

| Rule | Detail |
|------|--------|
| Roles | `ADMIN`, `CUSTOMER` (default on register) |
| Password | Min 8 characters; stored with bcrypt (cost 12 on register) |
| Email | Normalized (trim + lowercase); basic format check on register |
| Access token | Cookie `accessToken`, ~15m, httpOnly, sameSite=strict |
| Refresh token | Cookie `refreshToken`, ~7d; JWT + SHA-256 hash stored in DB; rotated on refresh |
| Reuse detection | Invalid/revoked/expired refresh → revoke all refresh tokens for that user |
| Login timing | Dummy bcrypt hash used when user missing (reduces email enumeration via timing) |
| Rate limits | Login: 5 failed / 15m / IP; Register: 10 / hour / IP; Refresh: 30 / 15m / IP |
| Env | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` required; secrets must differ and be ≥32 chars |

### Frontend route behavior

| Route | Access | Behavior at baseline |
|-------|--------|----------------------|
| `/` | Public | Storefront home (mock products) |
| `/login` | Public | Email/password → cookies + redirect by role |
| `/register` | Public | Create CUSTOMER account |
| `/account` | Authenticated | Profile fields; redirect to `/login` if anonymous |
| `/admin` | ADMIN only | Placeholder dashboard copy; clients redirected if not admin |

### Known gaps (intentionally out of scope for “done” at baseline)

- No cart, checkout, orders, or payments
- Home featured grid not loaded from API
- Search and category filters not functional end-to-end
- Admin dashboard has no real stats or product management UI
- Product create API exists; no matching admin form in the web app yet
- Seed uses fixed UUIDs for products and weak demo passwords (`password123`) — local/dev only

---

## Implementation

### Monorepo layout

```text
pfs-platform/
├── docker-compose.yml      # postgres :5433, server :5000, web :3000
├── docs/                   # feature docs + CHANGELOG
├── server/                 # Express + Prisma + PostgreSQL
└── web/                    # Next.js App Router storefront
```

### Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 16, React 19, Tailwind CSS 4, lucide-react, local “Instagram Sans” font |
| API | Express 5, TypeScript, helmet, cors (credentials), cookie-parser |
| Data | PostgreSQL 16, Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) |
| Auth | jsonwebtoken, bcryptjs, express-rate-limit |
| Ops | Docker Compose for postgres + server + web |

### Data model (Prisma)

- **User** — `id`, `email` (unique), `password`, `name`, `role`, timestamps; has many `RefreshToken`
- **RefreshToken** — `id` (jti), `tokenHash` (unique), `userId`, `expiresAt`, `revokedAt?`, `createdAt`
- **Product** — `id`, `name`, `description?`, `price` (Decimal 10,2), `stock`, `imageUrl?`, timestamps

Migrations present:

1. `20260730043110_init` — products
2. `20260730053017_add_users_roles` — users + roles
3. `20260801030000_add_refresh_tokens` — refresh token table

Seed (`server/prisma/seed.ts`): admin `admin@example.com`, customer `customer@example.com`, eight mock products aligned with web mock data.

### API surface

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | — | `{ status: "ok" }` |
| POST | `/api/auth/register` | — | Sets cookies; returns user (no password) |
| POST | `/api/auth/login` | — | Sets cookies; returns user |
| POST | `/api/auth/refresh` | refresh cookie | Rotates tokens |
| POST | `/api/auth/logout` | — | Revokes refresh; clears cookies |
| GET | `/api/auth/me` | access cookie | Current user |
| GET | `/api/products` | — | List all products |
| POST | `/api/products` | ADMIN | Create product |

Key server files:

- `server/src/index.ts` — app bootstrap, middleware, mounts
- `server/src/controllers/auth.controller.ts` / `products.controller.ts`
- `server/src/middleware/auth.middleware.ts`, `rateLimiter.ts`, `requestLogger.ts`
- `server/src/utils/jwt.ts`, `tokens.ts`, `env.ts`
- `server/prisma/schema.prisma`

### Web app

- **Design tokens** (`globals.css`): brand blue `#2D6CDF`, ink/paper/slate palette, light + `.dark` theme, price-tag notch utility
- **Auth client:** `AuthProvider` + `authFetch` (credentials include; 401 → refresh retry)
- **Pages:** home, login, register, account, admin (+ admin layout guard)
- **Components:** header (auth-aware), hero, category-nav, featured-products, product-card, footer, theme-toggle
- **API base:** `NEXT_PUBLIC_API_URL` or `http://localhost:5000`

Key web files:

- `web/src/app/layout.tsx`, `page.tsx`, `login/`, `register/`, `account/`, `admin/`
- `web/src/lib/auth-context.tsx`, `api.ts`, `mock-data.ts`
- `web/src/components/*`

### Local runtime (Compose)

- Postgres host port **5433** → container 5432  
- Server **5000**, Web **3000**  
- Env: root `.env` for compose DB vars; `server/.env` / `web/.env` for app services  

---

## Changes

This document does **not** introduce application code. It records the **initial baseline** of the platform as of 2026-08-01 for operational reference before subsequent feature work.

**Captured in this baseline:**

- Dual-package layout (`web` + `server`) and Docker Compose topology
- Cookie-based JWT auth with refresh rotation and rate limiting
- User roles and protected admin/account UX shells
- Products model + public list / admin create API
- Storefront UI with mock featured catalog and incomplete commerce affordances (search/cart)
- Empty `docs/CHANGELOG.md` template replaced with a first real changelog entry pointing here

**Follow-on work should** add or update feature-specific docs under `docs/` (and prepend `docs/CHANGELOG.md`) rather than rewriting this baseline unless the team explicitly decides to refresh the basepoint.
