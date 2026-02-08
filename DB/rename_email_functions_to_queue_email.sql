-- ============================================================
-- Renombrar trigger_send_welcome_email → queue_email_welcome
-- ============================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1) Renombrar la función
ALTER FUNCTION public.trigger_send_welcome_email()
RENAME TO queue_email_welcome;

-- 2) Reemplazar trigger para usar el nuevo nombre
DROP TRIGGER IF EXISTS on_user_created_send_welcome_email ON public.users;

CREATE TRIGGER on_user_created_queue_email_welcome
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.queue_email_welcome();
