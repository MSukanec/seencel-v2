-- =============================================================================
-- TRIGGER: Enviar email de bienvenida cuando se crea un usuario
-- =============================================================================
-- Este trigger inserta en email_queue cuando se crea un usuario nuevo
-- El cron job de Next.js procesará la cola y enviará el email con Resend
-- =============================================================================

-- Función que se ejecuta cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo procesar si es un INSERT (nuevo usuario)
    IF TG_OP = 'INSERT' THEN
        -- Insertar en cola de emails
        INSERT INTO public.email_queue (
            recipient_email,
            recipient_name,
            template_type,
            subject,
            data,
            created_at
        ) VALUES (
            NEW.email,
            COALESCE(NEW.full_name, 'Usuario'),
            'welcome',
            '¡Bienvenido a SEENCEL!',
            jsonb_build_object(
                'user_id', NEW.id,
                'user_email', NEW.email,
                'user_name', COALESCE(NEW.full_name, 'Usuario'),
                'created_at', NEW.created_at
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error pero no romper el flujo de registro
    RAISE NOTICE 'trigger_send_welcome_email error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Crear trigger en la tabla users
DROP TRIGGER IF EXISTS on_user_created_send_welcome_email ON public.users;

CREATE TRIGGER on_user_created_send_welcome_email
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_send_welcome_email();

-- Comentarios
COMMENT ON FUNCTION public.trigger_send_welcome_email() IS 
'Enqueue welcome email when a new user is created. Processed by /api/cron/process-email-queue';
