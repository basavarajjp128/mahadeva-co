-- Read-only post-migration assertions. Run as an administrator after applying
-- the reviewed product migration. This script performs no writes.
DO $$
DECLARE
  role_name TEXT;
  privilege_name TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.products'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.products';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'Public can read active products' AND cmd = 'SELECT'
      AND 'anon' = ANY(roles) AND 'authenticated' = ANY(roles)
  ) THEN
    RAISE EXCEPTION 'Active-product public read policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'Runtime can read active products' AND cmd = 'SELECT'
      AND 'smc_payment_runtime' = ANY(roles)
  ) THEN
    RAISE EXCEPTION 'Active-product runtime read policy is missing';
  END IF;

  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role', 'smc_payment_runtime'] LOOP
    FOREACH privilege_name IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
      IF has_table_privilege(role_name, 'public.products', privilege_name) THEN
        RAISE EXCEPTION 'Role % unexpectedly has % on public.products', role_name, privilege_name;
      END IF;
    END LOOP;
  END LOOP;

  IF NOT has_table_privilege('anon', 'public.products', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.products', 'SELECT')
     OR NOT has_table_privilege('smc_payment_runtime', 'public.products', 'SELECT') THEN
    RAISE EXCEPTION 'A required SELECT privilege is missing';
  END IF;
END $$;

SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY grantee, privilege_type;

SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY policyname;
