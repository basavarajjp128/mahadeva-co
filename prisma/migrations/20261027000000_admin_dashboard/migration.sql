-- SRI MAHADEVA & CO
-- Migration: admin dashboard support tables
--
-- Adds additive tables only. Existing catalogue, order and enquiry tables are
-- left untouched. Both tables are server-only: RLS is enabled and no anon or
-- authenticated policies are created.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Stock on hand per catalogue product. The dashboard upserts rows; the
-- storefront does not read this table yet.
CREATE TABLE IF NOT EXISTS public.product_inventory (
  product_id            uuid PRIMARY KEY
                          REFERENCES public.products(id) ON DELETE CASCADE,
  stock_kg              numeric(12,3) NOT NULL DEFAULT 0
                          CHECK (stock_kg >= 0),
  low_stock_threshold_kg numeric(12,3) NOT NULL DEFAULT 50
                          CHECK (low_stock_threshold_kg >= 0),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  updated_by_admin_id   uuid REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- Buyer enquiries about copra. Kept separate from supplier_enquiries, which
-- records farmers offering copra to the business.
CREATE TABLE IF NOT EXISTS public.customer_enquiries (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id         uuid REFERENCES public.products(id) ON DELETE SET NULL,
  grade_id           uuid REFERENCES public.product_grades(id) ON DELETE SET NULL,
  full_name          text NOT NULL,
  phone              text NOT NULL,
  email              text,
  quantity_kg        numeric(12,3)
                       CHECK (quantity_kg IS NULL OR quantity_kg > 0),
  message            text,
  source             text NOT NULL DEFAULT 'manual'
                       CHECK (source IN (
                         'website', 'whatsapp', 'phone', 'email',
                         'walk_in', 'manual'
                       )),
  status             text NOT NULL DEFAULT 'new'
                       CHECK (status IN (
                         'new', 'contacted', 'quoted', 'won',
                         'lost', 'closed', 'spam'
                       )),
  assigned_admin_id  uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_enquiries_full_name_len
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  CONSTRAINT customer_enquiries_phone_len
    CHECK (char_length(btrim(phone)) BETWEEN 6 AND 24)
);

CREATE INDEX IF NOT EXISTS idx_customer_enquiries_status_created
  ON public.customer_enquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_enquiries_product
  ON public.customer_enquiries (product_id);

CREATE INDEX IF NOT EXISTS idx_customer_enquiries_created
  ON public.customer_enquiries (created_at DESC);

-- Login identifiers must be unique. admin_users previously had no unique
-- constraint, so duplicate usernames would make sign-in ambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key
  ON public.admin_users (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_key
  ON public.admin_users (lower(email))
  WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS product_inventory_touch_updated_at
  ON public.product_inventory;
CREATE TRIGGER product_inventory_touch_updated_at
  BEFORE UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS customer_enquiries_touch_updated_at
  ON public.customer_enquiries;
CREATE TRIGGER customer_enquiries_touch_updated_at
  BEFORE UPDATE ON public.customer_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_enquiries ENABLE ROW LEVEL SECURITY;

-- Server-side access only. The dashboard connects with the database owner;
-- browser clients must never read these tables directly.
REVOKE ALL PRIVILEGES ON TABLE public.product_inventory
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.customer_enquiries
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
