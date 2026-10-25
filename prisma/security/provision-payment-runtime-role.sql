-- Run manually as the Supabase PostgreSQL administrator after confirming that
-- this role does not already exist and the connected database is the intended one.
-- Do not add a password to this file. Set it separately with `\password`
-- in an interactive psql session or an approved secret-management workflow.

CREATE ROLE smc_payment_runtime
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS;

-- The application role connects to the Supabase database named `postgres`.
GRANT CONNECT ON DATABASE postgres TO smc_payment_runtime;

-- Temporary prerequisite for transferring ownership of the four objects in
-- the payment migration. The migration revokes CREATE after ownership changes.
GRANT USAGE, CREATE ON SCHEMA public TO smc_payment_runtime;

-- Allows the migration role to transfer ownership of newly created payment
-- objects to the restricted runtime role. Do not grant postgres to the runtime role.
GRANT smc_payment_runtime TO postgres;
