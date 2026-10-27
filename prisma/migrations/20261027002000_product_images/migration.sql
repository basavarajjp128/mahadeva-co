-- SRI MAHADEVA & CO
-- Migration: product images
--
-- The Prisma model already declares image_path/image_alt, but the legacy
-- products table never had them. Add both additively so the admin can
-- attach a product image and the storefront can render it.
--
-- image_path stores a site-relative path (for files in /public) or an
-- absolute https URL (for Supabase Storage or another CDN). The image bytes
-- are never stored in Postgres.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS image_alt text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_image_path_format;

ALTER TABLE public.products
  ADD CONSTRAINT products_image_path_format
  CHECK (
    image_path IS NULL
    OR image_path = ''
    OR image_path ~ '^/[^[:space:]]*$'
    OR image_path ~ '^https://[^[:space:]]+$'
  );

COMMIT;
