-- Add catalogue fields to the existing public.products table. This table was
-- created outside Prisma; preserve its UUID ids and all existing rows.
BEGIN;

DO $$
DECLARE
  runtime_superuser BOOLEAN;
  runtime_bypass_rls BOOLEAN;
  runtime_owns_products BOOLEAN;
  enum_oid OID;
  enum_values TEXT[];
BEGIN
  SELECT rolsuper, rolbypassrls INTO runtime_superuser, runtime_bypass_rls
  FROM pg_roles WHERE rolname = 'smc_payment_runtime';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Required role smc_payment_runtime is missing; provision and review it before applying this migration';
  END IF;
  SELECT c.relowner = r.oid INTO runtime_owns_products
  FROM pg_class c CROSS JOIN pg_roles r
  WHERE c.oid = 'public.products'::regclass AND r.rolname = 'smc_payment_runtime';
  IF runtime_superuser OR runtime_bypass_rls OR runtime_owns_products THEN
    RAISE EXCEPTION 'smc_payment_runtime must be a non-owner role without SUPERUSER or BYPASSRLS';
  END IF;

  SELECT t.oid INTO enum_oid
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typname = 'ProductSalesUnit';

  IF enum_oid IS NOT NULL THEN
    SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) INTO enum_values
    FROM pg_enum e WHERE e.enumtypid = enum_oid;
    IF enum_values IS DISTINCT FROM ARRAY['KG', 'QUINTAL', 'METRIC_TON']::TEXT[] THEN
      RAISE EXCEPTION 'Existing public.ProductSalesUnit enum has unexpected labels';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'ProductSalesUnit'
  ) THEN
    EXECUTE 'CREATE TYPE public."ProductSalesUnit" AS ENUM (''KG'', ''QUINTAL'', ''METRIC_TON'')';
  END IF;
END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price DECIMAL(14, 4),
  ADD COLUMN IF NOT EXISTS price_currency CHAR(3),
  ADD COLUMN IF NOT EXISTS price_unit public."ProductSalesUnit",
  ADD COLUMN IF NOT EXISTS supported_sales_units public."ProductSalesUnit"[]
    NOT NULL DEFAULT '{}'::public."ProductSalesUnit"[],
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS packaging_information TEXT,
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_direct_checkout_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS products_is_active_name_idx
  ON public.products (is_active, name);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_price_fields_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_fields_check CHECK (
        (price IS NULL AND price_currency IS NULL AND price_unit IS NULL)
        OR (
          price IS NOT NULL AND price > 0
          AND price_currency IS NOT NULL
          AND price_unit IS NOT NULL
          AND price_unit = ANY(supported_sales_units)
        )
      );
  END IF;
END $$;

-- Remove broad default/table grants and expose only active catalogue reads.
REVOKE ALL PRIVILEGES ON TABLE public.products
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.products TO anon, authenticated, smc_payment_runtime;

REVOKE ALL PRIVILEGES ON TYPE public."ProductSalesUnit"
  FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON TYPE public."ProductSalesUnit"
  TO anon, authenticated, smc_payment_runtime;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'Public can read active products'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read active products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'Runtime can read active products'
  ) THEN
    EXECUTE 'CREATE POLICY "Runtime can read active products" ON public.products FOR SELECT TO smc_payment_runtime USING (is_active = true)';
  END IF;
END $$;

COMMIT;
