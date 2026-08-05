-- Lock down Supabase PostgREST (anon / authenticated) access to app tables.
-- Prisma connects as the table owner (local Docker) or a BYPASSRLS role
-- (Supabase postgres / pooler), so the Express API is unaffected.
-- No permissive policies are created: RLS on + zero policies = deny for
-- roles that do not bypass RLS.
--
-- Do NOT use FORCE ROW LEVEL SECURITY here — local Docker's DB user owns
-- the tables and is not BYPASSRLS; FORCE would break Prisma locally.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- Defense in depth on Supabase: drop default grants to API roles when present.
-- Roles do not exist on local Docker Postgres, so this block is skipped there.
DO $$
DECLARE
  tbl text;
  api_role text;
  tables text[] := ARRAY[
    'User',
    'PendingRegistration',
    'RefreshToken',
    'Address',
    'Category',
    'Product',
    'ProductImage',
    'Cart',
    'CartItem',
    'Order',
    'OrderItem'
  ];
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      FOREACH tbl IN ARRAY tables
      LOOP
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', tbl, api_role);
      END LOOP;
    END IF;
  END LOOP;
END $$;
