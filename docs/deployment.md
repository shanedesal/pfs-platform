# Deployment (Render + Supabase)

Deploy PFS to production using **Render** for the Express API and Next.js storefront, and **Supabase** for PostgreSQL and product image storage. Both platforms have usable free tiers for demos and small projects.

## Architecture

```mermaid
flowchart LR
  Browser --> Web["pfs-web.onrender.com\nNext.js"]
  Browser -->|"same-origin /api/*"| Web
  Web -->|"rewrite proxy"| API["pfs-api-bzyj.onrender.com\nExpress"]
  API --> DB["Supabase PostgreSQL"]
  API --> Storage["Supabase Storage\npfs-products bucket"]
  API --> Brevo["Brevo\noptional emails"]
```

| Component | Host | Free-tier notes |
|-----------|------|-----------------|
| Storefront (`web/`) | Render Web Service | Spins down after ~15 min idle; cold start ~30–60 s |
| API (`server/`) | Render Web Service | Same spin-down behavior |
| Database | Supabase Postgres | 500 MB; project pauses after 1 week of inactivity |
| Product images | Supabase Storage | 1 GB included on free tier |

**Why not Vercel for the frontend?** Vercel works well for Next.js and has a generous free tier. This project uses **Render for both** services so everything lives in one dashboard and `render.yaml` wires URLs automatically. You can still deploy `web/` to Vercel manually — set `NEXT_PUBLIC_API_URL` to your Render API URL and add that URL to `CORS_ORIGIN` on the API.

---

## Prerequisites

1. GitHub repo with the **`deploy`** branch pushed (or use `master` and point Render at that branch).
2. [Render](https://render.com) account (GitHub login).
3. [Supabase](https://supabase.com) account.

---

## Step 1 — Supabase project

### 1a. Create the database

1. Supabase Dashboard → **New project** → pick a region close to your Render region (e.g. Oregon / Singapore).
2. Save the database password securely.
3. **Connect → Session pooler → URI** (required for Render — see note below):

   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

   Copy the URI, replace `[YOUR-PASSWORD]`, and use it as `DATABASE_URL` on Render.

   > **Important (Render / most cloud hosts):** Do **not** use the **Direct** connection (`db.[ref].supabase.co`). That host is IPv6-only; Render cannot reach it and you will see `P1001: Can't reach database server`. Always use the **Session pooler** URI (host `*.pooler.supabase.com`, user `postgres.[project-ref]`).

   > **Password special characters:** If your password contains `@`, `#`, `/`, etc., [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) it in the connection string.

   > **Paused project:** Free Supabase projects pause after ~7 days idle. Dashboard → project → **Restore** if the database is paused.

### 1b. Storage bucket for product images

1. **Storage → New bucket**
   - Name: `pfs-products` (must match `SUPABASE_STORAGE_BUCKET`)
   - **Public bucket:** ON (product images are served via public URLs)
2. No extra RLS policies needed for a public bucket; the server uploads with the service role key.

### 1c. API keys

**Project Settings → API:**

| Variable | Where |
|----------|--------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (secret — server only, never expose to the browser) |

---

## Step 2 — Generate JWT secrets

On your machine:

```bash
openssl rand -base64 48   # use for JWT_SECRET
openssl rand -base64 48   # use for JWT_REFRESH_SECRET (must differ)
```

Each value must be **≥ 32 characters**.

---

## Step 3 — Deploy with Render Blueprint

1. Push the `deploy` branch to GitHub.
2. Render Dashboard → **New → Blueprint**.
3. Connect the repo and select the **`deploy`** branch.
4. Render reads [`render.yaml`](../render.yaml) and creates two services: `pfs-api` and `pfs-web`.
5. When prompted for **sync: false** variables on `pfs-api`, enter:

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | Supabase Postgres URI from step 1a |
   | `JWT_SECRET` | First secret from step 2 |
   | `JWT_REFRESH_SECRET` | Second secret from step 2 |
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `BREVO_API_KEY` | *(optional)* Brevo API key |
   | `BREVO_SENDER_EMAIL` | *(optional)* Verified sender email |

6. Click **Apply**. Render builds both services. The web service gets `NEXT_PUBLIC_API_URL` from the API service automatically; the API gets `CORS_ORIGIN` and `APP_URL` from the web service URL.

7. Wait for both deploys to finish (first build ~5–10 min). Open the **pfs-web** URL from the dashboard.

### First deploy: seed demo data (optional)

Production sets `SEED_DB=false`. To load admin/customer demo accounts and sample products once:

**Option A — from your machine (no Render Shell needed)**

```bash
cd server
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" npx prisma db seed
```

Use the same Session pooler `DATABASE_URL` as on Render. Demo logins from `server/prisma/seed.ts`:

| Account | Email | Password |
|---------|-------|----------|
| Admin | `admin@example.com` | `password123` |
| Customer | `customer@example.com` | `password123` |

**Option B — Render Shell** (paid plans only)

```bash
SEED_DB=true npx prisma db seed
```

**Option C — promote your own account**

1. Register on the live site and verify email.
2. Supabase → **SQL Editor** → run:

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

Change passwords before any public demo.

---

## Step 4 — Verify

| Check | How |
|-------|-----|
| API health | `curl https://pfs-api-xxxx.onrender.com/health` → `{"status":"ok"}` |
| Storefront | Open the `pfs-web` URL; homepage loads featured products |
| Auth | Register / login; cookies must work cross-subdomain (`SameSite=None` in production — see [`docs/auth-sessions.md`](./auth-sessions.md)) |
| Admin images | Admin → Products → upload cover image; URL should be a Supabase public URL |

---

## Environment reference

### API (`pfs-api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Supabase Postgres connection string |
| `JWT_SECRET` | yes | Access token signing secret (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | yes | Refresh token secret (different, ≥ 32 chars) |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key |
| `SUPABASE_STORAGE_BUCKET` | yes | Default `pfs-products` |
| `CORS_ORIGIN` | yes | Storefront URL (auto-wired by Blueprint) |
| `APP_URL` | recommended | Base URL for email verification links (auto-wired) |
| `NODE_ENV` | yes | `production` |
| `SEED_DB` | no | `false` in production |
| `BREVO_*` | no | Order / verification emails |

### Storefront (`pfs-web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | yes | Public API URL (auto-wired by Blueprint) |
| `NODE_ENV` | yes | `production` |

---

## Behavior / rules

- **Cold starts:** Free Render services sleep after inactivity. The first request after sleep can take 30–60 seconds.
- **Cookies:** Production uses `Secure` + `SameSite=None` on the API for direct/cross-origin access. The storefront proxies `/api/*` through Next.js so the browser only talks to the web origin — auth cookies are first-party on `pfs-web`, which fixes login on Safari/iOS (cross-site cookies between Render subdomains are blocked there).
- **Migrations:** Each API deploy runs `prisma migrate deploy` before starting (`npm run start:production`).
- **No payment gateway:** Checkout still records payment method labels only.
- **Supabase pause:** Inactive free projects pause after 7 days; wake them from the Supabase dashboard.

---

## Manual deploy (without Blueprint)

If you prefer creating services by hand:

**API service**

- Root directory: `server`
- Build: `npm ci --include=dev && npm run build` (dev deps required for `tsc`)
- Start: `npm run start:production`
- Health check path: `/health`
- Node version: 22

**Web service**

- Root directory: `web`
- Build: `npm ci --include=dev && npm run build` (dev deps required for Tailwind/PostCSS)
- Start: `npm start`
- Set `NEXT_PUBLIC_API_URL=https://<your-api-host>`

Then set `CORS_ORIGIN` and `APP_URL` on the API to the web service URL.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Login succeeds but next page is logged out | Cross-site cookies (Safari/iOS) or CORS | Storefront must proxy `/api/*` via Next.js rewrites (see `web/next.config.ts`); redeploy **pfs-web** after pulling that change. Also ensure `CORS_ORIGIN` exactly matches the web URL if anything still calls the API cross-origin |
| Login works on desktop but not iPhone/iPad | Safari blocks third-party cookies between `pfs-web` and `pfs-api` | Same fix: same-origin API proxy on the web service (already in `next.config.ts`); redeploy pfs-web |
| `Missing required environment variables` | Incomplete API env | Fill all required vars in Render → pfs-api → Environment |
| Migrations fail on deploy | Wrong `DATABASE_URL` | Use Supabase direct or session connection string; check password |
| API `P1001: Can't reach database server at db.*.supabase.co` | Direct Supabase URL on Render (IPv6-only) | Switch `DATABASE_URL` to **Session pooler** URI (`*.pooler.supabase.com`, user `postgres.[ref]`) |
| Image upload fails | Supabase bucket / keys | Bucket `pfs-products` must exist and be public; verify service role key |
| Homepage empty, API 502 | API cold start or crash | Check pfs-api logs; hit `/health` directly |
| Web build: `Cannot find module '@tailwindcss/postcss'` | Render skips devDependencies when `NODE_ENV=production` | Use `npm ci --include=dev && npm run build` (already in `render.yaml`) |
| Web build: `useSearchParams() should be wrapped in a suspense boundary` | Next.js static generation requires Suspense around `useSearchParams` | Wrap page content in `<Suspense>` (e.g. `/login`) |
| Emails not sent | Brevo not configured | Set both `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` |

---

## Changes (deploy branch)

- Added [`render.yaml`](../render.yaml) — Render Blueprint for `pfs-api` + `pfs-web`
- Production cookie mode: `SameSite=None` when `NODE_ENV=production`
- Server: `prisma` moved to runtime dependencies; `build` runs `prisma generate`; `start:production` runs migrations then starts
- Node 22 pinned via `.node-version` in `server/` and `web/`
