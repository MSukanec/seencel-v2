-- ============================================================
-- Agregar is_sandbox y is_test a mp_preferences
-- Para tracking de pagos sandbox vs producción
-- Mismo patrón que paypal_preferences
-- ============================================================

ALTER TABLE public.mp_preferences
ADD COLUMN IF NOT EXISTS is_sandbox boolean DEFAULT false;

ALTER TABLE public.mp_preferences
ADD COLUMN IF NOT EXISTS is_test boolean DEFAULT false;
