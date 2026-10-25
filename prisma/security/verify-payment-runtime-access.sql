-- Read-only post-migration assertions. Run as the database administrator.
-- The script raises an exception if API roles have table access, RLS is off,
-- a client policy exists, or the runtime role cannot perform table operations.
DO $$
DECLARE
  relation_name text;
  relation_oid regclass;
BEGIN
  IF to_regclass('public._prisma_migrations') IS NULL THEN
    RAISE EXCEPTION 'Prisma migration ledger public._prisma_migrations is missing';
  END IF;

  IF has_table_privilege('anon', 'public._prisma_migrations', 'SELECT')
     OR has_table_privilege('authenticated', 'public._prisma_migrations', 'SELECT')
     OR has_table_privilege('service_role', 'public._prisma_migrations', 'SELECT') THEN
    RAISE EXCEPTION 'A Supabase API role can read the Prisma migration ledger';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public._prisma_migrations'::regclass) THEN
    RAISE EXCEPTION 'RLS is not enabled on public._prisma_migrations';
  END IF;

  FOREACH relation_name IN ARRAY ARRAY[
    'PaymentOrder',
    'PaymentAttempt',
    'WebhookEvent',
    'RateLimitBucket'
  ] LOOP
    relation_oid := to_regclass(format('public.%I', relation_name));
    IF relation_oid IS NULL THEN
      RAISE EXCEPTION 'Required payment relation public.% is missing', relation_name;
    END IF;

    IF has_table_privilege('anon', relation_oid, 'SELECT')
       OR has_table_privilege('anon', relation_oid, 'INSERT')
       OR has_table_privilege('anon', relation_oid, 'UPDATE')
       OR has_table_privilege('anon', relation_oid, 'DELETE')
       OR has_table_privilege('anon', relation_oid, 'TRUNCATE')
       OR has_table_privilege('anon', relation_oid, 'REFERENCES')
       OR has_table_privilege('anon', relation_oid, 'TRIGGER')
       OR has_table_privilege('authenticated', relation_oid, 'SELECT')
       OR has_table_privilege('authenticated', relation_oid, 'INSERT')
       OR has_table_privilege('authenticated', relation_oid, 'UPDATE')
       OR has_table_privilege('authenticated', relation_oid, 'DELETE')
       OR has_table_privilege('authenticated', relation_oid, 'TRUNCATE')
       OR has_table_privilege('authenticated', relation_oid, 'REFERENCES')
       OR has_table_privilege('authenticated', relation_oid, 'TRIGGER')
       OR has_table_privilege('service_role', relation_oid, 'SELECT')
       OR has_table_privilege('service_role', relation_oid, 'INSERT')
       OR has_table_privilege('service_role', relation_oid, 'UPDATE')
       OR has_table_privilege('service_role', relation_oid, 'DELETE')
       OR has_table_privilege('service_role', relation_oid, 'TRUNCATE')
       OR has_table_privilege('service_role', relation_oid, 'REFERENCES')
       OR has_table_privilege('service_role', relation_oid, 'TRIGGER') THEN
      RAISE EXCEPTION 'A Supabase API role has privileges on %', relation_oid;
    END IF;

    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = relation_oid) THEN
      RAISE EXCEPTION 'RLS is not enabled on %', relation_oid;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = relation_name) THEN
      RAISE EXCEPTION 'Unexpected client-facing policy exists on %', relation_oid;
    END IF;

    IF NOT (has_table_privilege('smc_payment_runtime', relation_oid, 'SELECT')
       AND has_table_privilege('smc_payment_runtime', relation_oid, 'INSERT')
       AND has_table_privilege('smc_payment_runtime', relation_oid, 'UPDATE')
       AND has_table_privilege('smc_payment_runtime', relation_oid, 'DELETE')) THEN
      RAISE EXCEPTION 'Runtime role lacks required table privileges on %', relation_oid;
    END IF;
  END LOOP;
END $$;
