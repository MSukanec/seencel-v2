-- ============================================================
-- Eliminar función legacy notify_replit_email y sus triggers
-- Fecha: 2026-02-08
-- Motivo: Reemplazada por sistema de cola (email_queue + CRON)
-- ============================================================

-- 1) Eliminar triggers que referencian esta función
--    (ajustá el nombre del trigger y tabla si es diferente)
DROP TRIGGER IF EXISTS on_auth_user_created_notify_replit ON auth.users;
DROP TRIGGER IF EXISTS on_payment_created_notify_replit ON public.payments;
DROP TRIGGER IF EXISTS on_bank_transfer_created_notify_replit ON public.bank_transfer_payments;

-- Si no sabés el nombre exacto del trigger, corré esto primero para verlos:
-- SELECT tgname, tgrelid::regclass 
-- FROM pg_trigger 
-- WHERE tgfoid = 'public.notify_replit_email'::regproc;

-- 2) Eliminar la función
DROP FUNCTION IF EXISTS public.notify_replit_email() CASCADE;
