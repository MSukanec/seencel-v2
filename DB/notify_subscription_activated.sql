-- ============================================================
-- Trigger: Notificar al usuario cuando se activa una suscripción
-- Tabla: organization_subscriptions
-- Evento: INSERT con status = 'active'
-- Cubre: Suscripciones nuevas + Upgrades
-- ============================================================
-- FIX: Distinguir entre suscripción nueva y upgrade
-- Detecta upgrade si hay una suscripción anterior (expired/cancelled)
-- ============================================================

-- 1. Eliminar función vieja (con nombre anterior)
DROP FUNCTION IF EXISTS public.trigger_notify_subscription_activated() CASCADE;

-- 2. Función del Trigger (nombre limpio)
CREATE OR REPLACE FUNCTION public.notify_subscription_activated()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_name text;
    v_owner_id uuid;
    v_is_upgrade boolean := false;
    v_previous_plan text;
    v_title_owner text;
    v_body_owner text;
    v_title_admin text;
    v_body_admin text;
    v_billing_label text;
BEGIN
    -- Solo notificar cuando la suscripción se crea activa
    IF NEW.status = 'active' THEN
        
        -- Obtener nombre del plan
        SELECT name INTO v_plan_name
        FROM public.plans
        WHERE id = NEW.plan_id;
        
        -- Obtener el owner de la organización
        SELECT owner_id INTO v_owner_id
        FROM public.organizations
        WHERE id = NEW.organization_id;

        -- Etiqueta del período
        v_billing_label := CASE 
            WHEN NEW.billing_period = 'annual' THEN 'anual'
            ELSE 'mensual'
        END;
        
        -- Detectar si es upgrade: ¿hay una suscripción anterior para esta org?
        SELECT p.name INTO v_previous_plan
        FROM public.organization_subscriptions s
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.organization_id = NEW.organization_id
          AND s.id != NEW.id
          AND s.status IN ('expired', 'cancelled')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        v_is_upgrade := (v_previous_plan IS NOT NULL);
        
        -- Construir mensajes según sea upgrade o nueva suscripción
        IF v_is_upgrade THEN
            v_title_owner := '⬆️ ¡Plan Mejorado!';
            v_body_owner := 'Tu plan fue mejorado a ' || COALESCE(v_plan_name, '') || '. ¡A disfrutarlo! 🚀';
            v_title_admin := '⬆️ Upgrade de Plan';
            v_body_admin := 'Organización mejoró de ' || COALESCE(v_previous_plan, '?') || ' a ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        ELSE
            v_title_owner := '¡Plan Activado!';
            v_body_owner := 'Tu plan ' || COALESCE(v_plan_name, '') || ' está activo. ¡Hora de construir! 🚀';
            v_title_admin := '💰 Nueva Suscripción';
            v_body_admin := 'Organización activó plan ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        END IF;
        
        -- Notificación al dueño de la organización
        IF v_owner_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_owner_id,
                'success',
                v_title_owner,
                v_body_owner,
                jsonb_build_object(
                    'subscription_id', NEW.id,
                    'plan_id', NEW.plan_id,
                    'plan_name', v_plan_name,
                    'billing_period', NEW.billing_period,
                    'is_upgrade', v_is_upgrade,
                    'url', '/organization/settings?tab=billing'
                ),
                'direct'
            );
        END IF;
        
        -- Notificar a admins de la plataforma
        PERFORM public.send_notification(
            NULL,
            'info',
            v_title_admin,
            v_body_admin,
            jsonb_build_object(
                'subscription_id', NEW.id,
                'organization_id', NEW.organization_id,
                'plan_name', v_plan_name,
                'billing_period', NEW.billing_period,
                'amount', NEW.amount,
                'currency', NEW.currency,
                'is_upgrade', v_is_upgrade,
                'previous_plan', v_previous_plan
            ),
            'admins'
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
