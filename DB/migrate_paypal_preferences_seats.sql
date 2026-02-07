-- ============================================================
-- MIGRATION: Add 'seats' support to paypal_preferences
-- ============================================================
-- 1. Update product_type CHECK constraint to allow 'seats'
-- 2. Add seats_quantity column
-- ============================================================

-- 1. Drop existing product_type check constraint
ALTER TABLE public.paypal_preferences
DROP CONSTRAINT paypal_preferences_product_type_check;

-- 2. Add updated constraint that includes 'seats'
ALTER TABLE public.paypal_preferences
ADD CONSTRAINT paypal_preferences_product_type_check CHECK (
    product_type = ANY (ARRAY['subscription'::text, 'course'::text, 'seats'::text])
    OR product_type IS NULL
);

-- 3. Add seats_quantity column
ALTER TABLE public.paypal_preferences
ADD COLUMN seats_quantity integer NULL;
