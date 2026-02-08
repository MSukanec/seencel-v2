-- ============================================================
-- Trigger: Notificar al usuario cuando se activa una suscripción
-- Tabla: organization_subscriptions
-- Evento: INSERT con status = 'active'
-- Cubre: Suscripciones nuevas + Upgrades
-- ============================================================

-- 1. Eliminar función vieja (con nombre anterior)
DROP FUNCTION IF EXISTS public.trigger_notify_subscription_activated() CASCADE;

-- 2. Función del Trigger (nombre limpio)
CREATE OR REPLACE FUNCTION public.notify_subscription_activated()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_name text;
    v_owner_id uuid;
BEGIN
    -- Solo notificar cuando la suscripción se crea activa
    IF NEW.status = 'active' THEN
        
        -- Obtener nombre del plan
        SELECT name INTO v_plan_name
        FROM public.plans
        WHERE id = NEW.plan_id;
        
        -- Obtener el owner de la organización (es quien recibe la notificación)
        SELECT owner_id INTO v_owner_id
        FROM public.organizations
        WHERE id = NEW.organization_id;
        
        IF v_owner_id IS NOT NULL THEN
            -- Notificación al dueño de la organización
            PERFORM public.send_notification(
                v_owner_id,                                    -- Destinatario
                'success',                                     -- Tipo
                '¡Plan Activado!',                             -- Título
                'Tu plan ' || COALESCE(v_plan_name, '') || ' está activo. ¡Hora de construir! 🚀', -- Cuerpo
                jsonb_build_object(
                    'subscription_id', NEW.id,
                    'plan_id', NEW.plan_id,
                    'plan_name', v_plan_name,
                    'billing_period', NEW.billing_period,
                    'url', '/organization/settings?tab=billing'  -- Deep link a billing
                ),
                'direct'                                       -- Audiencia
            );
        END IF;
        
        -- También notificar a admins de la plataforma
        PERFORM public.send_notification(
            NULL,                                              -- NULL = broadcast
            'info',                                            -- Tipo
            '💰 Nueva Suscripción',                            -- Título
            'Organización activó plan ' || COALESCE(v_plan_name, '') || ' (' || CASE WHEN NEW.billing_period = 'annual' THEN 'anual' ELSE 'mensual' END || ') por ' || NEW.amount || ' ' || NEW.currency, -- Cuerpo
            jsonb_build_object(
                'subscription_id', NEW.id,
                'organization_id', NEW.organization_id,
                'plan_name', v_plan_name,
                'billing_period', NEW.billing_period,
                'amount', NEW.amount,
                'currency', NEW.currency
            ),
            'admins'                                           -- Broadcast a admins
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activar el Trigger
DROP TRIGGER IF EXISTS trg_notify_subscription_activated ON public.organization_subscriptions;
CREATE TRIGGER trg_notify_subscription_activated
AFTER INSERT ON public.organization_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_subscription_activated();
