-- SRI MAHADEVA & CO
-- Migration: product taxonomy (categories, units, packaging, category options)
--
-- The four taxonomy tables may already exist in an environment where they were
-- created manually. This migration is intentionally idempotent: it creates
-- anything missing, links products to a category and exposes read-only access
-- for the public catalogue.

BEGIN;

-- 1. Product categories -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  parent_id     uuid REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  description   text,
  image_url     text,
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT category_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT category_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT category_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent
  ON public.product_categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_active_order
  ON public.product_categories(is_active, display_order, name);

DROP TRIGGER IF EXISTS product_categories_touch_updated_at ON public.product_categories;
CREATE TRIGGER product_categories_touch_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Quantity units -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quantity_units (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL UNIQUE,
  symbol             text NOT NULL UNIQUE,
  unit_type          text NOT NULL,
  base_unit_symbol   text,
  conversion_to_base numeric(18, 6),
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quantity_unit_type_check
    CHECK (unit_type IN ('weight', 'volume', 'count', 'length', 'other')),
  CONSTRAINT quantity_conversion_check
    CHECK (conversion_to_base IS NULL OR conversion_to_base > 0)
);

-- 3. Packaging types ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packaging_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  is_reusable boolean NOT NULL DEFAULT false,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Category options ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_options (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id            uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  quantity_unit_id       uuid NOT NULL REFERENCES public.quantity_units(id) ON DELETE RESTRICT,
  packaging_type_id      uuid NOT NULL REFERENCES public.packaging_types(id) ON DELETE RESTRICT,
  default_pack_size      numeric(12, 3),
  minimum_order_quantity numeric(12, 3) NOT NULL DEFAULT 1,
  is_default             boolean NOT NULL DEFAULT false,
  is_active              boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT category_option_unique UNIQUE (category_id, quantity_unit_id, packaging_type_id),
  CONSTRAINT valid_pack_size CHECK (default_pack_size IS NULL OR default_pack_size > 0),
  CONSTRAINT valid_minimum_order CHECK (minimum_order_quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_category_options_category
  ON public.category_options(category_id, is_active);

-- 5. Link products to a category ---------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.product_categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products(category_id);

-- Match the legacy free-text category to a taxonomy slug where possible.
UPDATE public.products p
   SET category_id = c.id
  FROM public.product_categories c
 WHERE c.slug = p.category
   AND p.category_id IS NULL;

-- The original seeded listings use the shorthand "copra"; map them to the
-- Coconut Copra subcategory when it exists so their options are visible.
UPDATE public.products p
   SET category_id = c.id
  FROM public.product_categories c
 WHERE c.slug = 'coconut-copra'
   AND p.category = 'copra'
   AND p.category_id IS NULL;

-- 6. Read-only access for the public catalogue --------------------------------
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_options ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.product_categories
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.quantity_units
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.packaging_types
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.category_options
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.product_categories TO anon, authenticated, smc_payment_runtime;
GRANT SELECT ON TABLE public.quantity_units TO anon, authenticated, smc_payment_runtime;
GRANT SELECT ON TABLE public.packaging_types TO anon, authenticated, smc_payment_runtime;
GRANT SELECT ON TABLE public.category_options TO anon, authenticated, smc_payment_runtime;

DROP POLICY IF EXISTS "Public can read active categories" ON public.product_categories;
CREATE POLICY "Public can read active categories"
  ON public.product_categories FOR SELECT TO anon, authenticated, smc_payment_runtime
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active units" ON public.quantity_units;
CREATE POLICY "Public can read active units"
  ON public.quantity_units FOR SELECT TO anon, authenticated, smc_payment_runtime
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active packaging" ON public.packaging_types;
CREATE POLICY "Public can read active packaging"
  ON public.packaging_types FOR SELECT TO anon, authenticated, smc_payment_runtime
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active category options" ON public.category_options;
CREATE POLICY "Public can read active category options"
  ON public.category_options FOR SELECT TO anon, authenticated, smc_payment_runtime
  USING (is_active = true);

-- Runtime roles read categories through options; keep the policy independent
-- of row visibility on the parent table so joins stay predictable.
DROP POLICY IF EXISTS "Runtime reads category options" ON public.category_options;
CREATE POLICY "Runtime reads category options"
  ON public.category_options FOR SELECT TO smc_payment_runtime
  USING (is_active = true);

COMMIT;
