-- SRI MAHADEVA & CO
-- Migration: product updated_at
--
-- The dashboard and price history rely on products.updated_at, but the legacy
-- products table only had created_at. Add the column additively and keep it
-- current with the shared touch trigger.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
