-- ============================================================
-- FIX: Agregar 'upgrade' al CHECK constraint de product_type
-- en paypal_preferences
-- ============================================================
-- Error: "new row for relation paypal_preferences violates 
-- check constraint paypal_preferences_product_type_check"
-- Causa: el CHECK no incluye 'upgrade' como valor válido
-- ============================================================

-- 1. Eliminar constraint viejo
ALTER TABLE public.paypal_preferences
DROP CONSTRAINT paypal_preferences_product_type_check;

-- 2. Crear constraint nuevo con 'upgrade' incluido
ALTER TABLE public.paypal_preferences
ADD CONSTRAINT paypal_preferences_product_type_check CHECK (
    product_type = ANY (ARRAY['subscription', 'course', 'seats', 'upgrade'])
    OR product_type IS NULL
);
