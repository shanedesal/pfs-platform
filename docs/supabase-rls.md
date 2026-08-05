# Supabase Row-Level Security (app tables)

## Overview

The app stores auth and commerce data in Supabase Postgres (`public` schema) but **does not** use the Supabase Data API or Supabase Auth from the browser. Access is Express → Prisma only. Without RLS, Supabase still exposes `public` tables through PostgREST to anyone with the project URL and **anon** key, which triggers advisors `rls_disabled_in_public` and `sensitive_columns_exposed`.

This project enables RLS on all Prisma app tables with **no permissive policies**, so anon/authenticated API roles cannot read or write rows. Password columns remain bcrypt hashes; RLS is what stops public API access—not hashing alone.

## Behavior / rules

- RLS is **enabled** on every Prisma model table (`User`, `PendingRegistration`, `RefreshToken`, `Address`, `Category`, `Product`, `ProductImage`, `Cart`, `CartItem`, `Order`, `OrderItem`).
- **No** `CREATE POLICY` for `anon` / `authenticated` — default deny for those roles.
- On Supabase, `anon` / `authenticated` grants on those tables are revoked when those roles exist.
- Express/Prisma continues to work: local Docker connects as the table owner (bypasses RLS); Supabase pooler/`postgres` has `BYPASSRLS`.
- **Do not** use `FORCE ROW LEVEL SECURITY` in migrations — it would break local Docker Prisma (`pfs_admin` owns tables and is not `BYPASSRLS`).
- Storage bucket RLS is separate (public `pfs-products` bucket + service-role uploads); unchanged.

## Implementation

| Piece | Location |
|-------|----------|
| Migration | `server/prisma/migrations/20260805000000_enable_rls_public_tables/migration.sql` |
| Schema note | Comment at top of `server/prisma/schema.prisma` |
| Deploy path | `prisma migrate deploy` on API start (`npm run start:production`) |

Prisma’s `schema.prisma` cannot define RLS. Fixes are always SQL migrations checked into the repo—not one-off edits in the Supabase SQL editor (unless you need an emergency hotfix, then mirror it into a migration).

### Adding a new table

In the same migration that `CREATE TABLE`s it:

```sql
ALTER TABLE "NewTable" ENABLE ROW LEVEL SECURITY;
-- and, if targeting Supabase, revoke anon/authenticated (same DO block pattern as the RLS migration)
```

## Changes

- Added migration enabling RLS on all existing app tables and conditionally revoking Supabase API-role grants.
- Documented that hashing does not replace RLS for Supabase advisors.
