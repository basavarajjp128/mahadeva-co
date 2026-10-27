-- SRI MAHADEVA & CO
-- Migration: product sample flag
--
-- The Prisma model already declares is_sample, and the storefront uses it to
-- decide whether a listing is a placeholder ("Sample listing") or a real
-- catalogue entry. New admin-created products are real listings by default;
-- the pre-existing seeded placeholders stay marked as samples.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

UPDATE public.products
   SET is_sample = true
 WHERE slug LIKE 'sample-%'
   AND is_sample = false;

COMMIT;
