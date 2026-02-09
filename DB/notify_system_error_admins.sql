-- ============================================================================
-- NOTIFICACIÓN: Error del Sistema → Admins
-- ============================================================================
-- Cuando se registra un error en system_error_logs, 
-- notifica a todos los administradores con info legible (nombre de org, usuario, etc.)
-- ============================================================================

-- 0. Limpiar función vieja con nombre incorrecto (si existe)
DROP TRIGGER IF EXISTS trg_notify_system_error ON public.system_error_logs;
DROP FUNCTION IF EXISTS public.trigger_notify_system_error();

-- 1. Función del Trigger
CREATE OR REPLACE FUNCTION public.notify_system_error()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name text := NULL;
    v_user_email text := NULL;
    v_org_name text := NULL;
    v_body text;
    v_context_parts text[] := ARRAY[]::text[];
BEGIN
    -- Solo notificar errores de severidad 'error' o 'critical'
    IF NEW.severity NOT IN ('error', 'critical') THEN
        RETURN NEW;
    END IF;

    -- Resolver usuario si existe en context
    IF NEW.context ? 'user_id' AND (NEW.context->>'user_id') IS NOT NULL THEN
        SELECT u.full_name, u.email
        INTO v_user_name, v_user_email
        FROM public.users u
        WHERE u.id = (NEW.context->>'user_id')::uuid;
    END IF;

    -- Resolver organización si existe en context
    IF NEW.context ? 'organization_id' AND (NEW.context->>'organization_id') IS NOT NULL THEN
        SELECT o.name
        INTO v_org_name
        FROM public.organizations o
        WHERE o.id = (NEW.context->>'organization_id')::uuid;
    END IF;

    -- Construir cuerpo legible
    v_body := NEW.function_name || ': ' || LEFT(NEW.error_message, 100);

    -- Agregar contexto humano si existe
    IF v_org_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Org: ' || v_org_name);
    END IF;

    IF v_user_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_name);
    ELSIF v_user_email IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_email);
    END IF;

    IF array_length(v_context_parts, 1) > 0 THEN
        v_body := v_body || ' (' || array_to_string(v_context_parts, ' | ') || ')';
    END IF;

    -- Enviar notificación a admins
    PERFORM public.send_notification(
        NULL,
        CASE 
            WHEN NEW.severity = 'critical' THEN 'error'
            ELSE 'warning'
        END,
        CASE
            WHEN NEW.severity = 'critical' THEN '🚨 Error Crítico'
            ELSE '⚠️ Error del Sistema'
        END,
        v_body,
        jsonb_build_object(
            'error_id', NEW.id,
            'domain', NEW.domain,
            'entity', NEW.entity,
            'function_name', NEW.function_name,
            'severity', NEW.severity,
            'url', '/admin/monitoring'
        ),
        'admins'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activar el Trigger
DROP TRIGGER IF EXISTS trg_notify_system_error ON public.system_error_logs;
CREATE TRIGGER trg_notify_system_error
AFTER INSERT ON public.system_error_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_system_error();
