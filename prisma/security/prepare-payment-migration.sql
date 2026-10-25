-- Run manually as postgres after reviewing current default ACLs and before the
-- first `prisma migrate deploy`. Prisma creates its migration ledger before it
-- executes migration.sql, so this pre-step protects that ledger on first deploy.
-- This affects future tables created by postgres in public only; it does not
-- remove privileges from existing application tables.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND d.defaclnamespace = 0
      AND d.defaclobjtype = 'r'
      AND COALESCE(grantee.rolname, 'PUBLIC') IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
  ) THEN
    RAISE EXCEPTION 'Global default table grants for postgres require separate review';
  END IF;
END $$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
