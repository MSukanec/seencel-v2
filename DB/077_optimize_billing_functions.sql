-- ============================================================
-- 077: Optimize billing functions
-- ============================================================
-- 1. Email de compra → trigger en billing.payments (reemplaza step_send_purchase_email)
-- 2. Activity log → trigger en billing.payments (reemplaza step_log_seat_purchase_event)
-- 3. Unificación handle_upgrade_* + handle_payment_subscription_*
-- 4. Limpieza de funciones deprecadas
--
-- Fecha: 2026-02-21
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Trigger de email de compra
-- ============================================================

-- 1a. Función trigger: encola emails al insertar un pago completado
CREATE OR REPLACE FUNCTION notifications.queue_purchase_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'notifications', 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_user_email text;
    v_user_name text;
    v_product_name text;
    v_subject_user text;
    v_subject_admin text;
BEGIN
    -- Solo pagos completados
    IF NEW.status <> 'completed' THEN
        RETURN NEW;
    END IF;

    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM iam.users
    WHERE id = NEW.user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'queue_purchase_email: Usuario % no encontrado', NEW.user_id;
        RETURN NEW;
    END IF;

    -- Obtener nombre del producto desde metadata (enriquecida por los handlers)
    v_product_name := NEW.metadata->>'product_name';

    -- Fallback: construir nombre si no está en metadata
    IF v_product_name IS NULL THEN
        CASE NEW.product_type
            WHEN 'course' THEN
                SELECT title INTO v_product_name FROM academy.courses WHERE id = NEW.course_id;
                v_product_name := COALESCE(v_product_name, 'Curso');
            WHEN 'subscription' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := COALESCE(v_product_name, 'Plan');
            WHEN 'upgrade' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := 'Upgrade a ' || COALESCE(v_product_name, 'Plan');
            WHEN 'seat_purchase' THEN
                v_product_name := COALESCE(NEW.metadata->>'seats_purchased', '?') || ' asiento(s) adicional(es)';
            ELSE
                v_product_name := 'Producto';
        END CASE;
    END IF;

    -- Construir subjects
    v_subject_user := CASE NEW.product_type
        WHEN 'course' THEN '¡Tu curso está listo!'
        WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || v_product_name || '!'
        WHEN 'upgrade' THEN '¡Plan mejorado!'
        ELSE 'Confirmación de compra'
    END;
    v_subject_admin := '💰 Nueva venta: ' || v_product_name;

    -- Email al comprador
    INSERT INTO public.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        v_subject_user,
        jsonb_build_object(
            'user_id', NEW.user_id, 'user_email', v_user_email,
            'user_name', v_user_name, 'product_type', NEW.product_type,
            'product_name', v_product_name, 'amount', NEW.amount,
            'currency', NEW.currency, 'payment_id', NEW.id,
            'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    -- Email al admin
    INSERT INTO public.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        v_subject_admin,
        jsonb_build_object(
            'buyer_email', v_user_email, 'buyer_name', v_user_name,
            'product_type', NEW.product_type, 'product_name', v_product_name,
            'amount', NEW.amount, 'currency', NEW.currency,
            'payment_id', NEW.id, 'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'queue_purchase_email error: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 1b. Crear trigger en billing.payments
DROP TRIGGER IF EXISTS trg_queue_purchase_email ON billing.payments;
CREATE TRIGGER trg_queue_purchase_email
AFTER INSERT ON billing.payments
FOR EACH ROW
EXECUTE FUNCTION notifications.queue_purchase_email();


-- ============================================================
-- PARTE 2: Trigger de activity log para pagos
-- ============================================================

-- 2a. Función trigger: loguea todos los pagos con organization_id
CREATE OR REPLACE FUNCTION audit.log_payment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'audit', 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_member_id uuid;
    v_action text;
BEGIN
    -- Solo pagos completados con organización
    IF NEW.status <> 'completed' OR NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar member_id
    SELECT id INTO v_member_id
    FROM iam.organization_members
    WHERE organization_id = NEW.organization_id
      AND user_id = NEW.user_id
    LIMIT 1;

    -- Construir action name
    v_action := NEW.product_type || '_purchased';

    -- Insertar en activity logs
    INSERT INTO public.organization_activity_logs (
        organization_id, member_id, action,
        target_table, target_id, metadata
    ) VALUES (
        NEW.organization_id,
        v_member_id,
        v_action,
        'payments',
        NEW.id,
        jsonb_build_object(
            'amount', NEW.amount,
            'currency', NEW.currency,
            'product_type', NEW.product_type,
            'provider', COALESCE(NEW.provider, NEW.gateway),
            'user_id', NEW.user_id
        ) || COALESCE(
            -- Incluir metadata extra relevante (seats, billing_period, etc.)
            jsonb_strip_nulls(jsonb_build_object(
                'seats_purchased', NEW.metadata->>'seats_purchased',
                'billing_period', NEW.metadata->>'billing_period',
                'is_upgrade', NEW.metadata->>'upgrade'
            )),
            '{}'::jsonb
        )
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'log_payment_activity error: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 2b. Crear trigger en billing.payments
DROP TRIGGER IF EXISTS trg_log_payment_activity ON billing.payments;
CREATE TRIGGER trg_log_payment_activity
AFTER INSERT ON billing.payments
FOR EACH ROW
EXECUTE FUNCTION audit.log_payment_activity();


-- ============================================================
-- PARTE 3: Unificar handle_subscription + handle_upgrade
-- ============================================================

-- 3a. DROP la vieja versión (9 params) para poder crear la nueva (10 params)
DROP FUNCTION IF EXISTS billing.handle_payment_subscription_success(text, text, uuid, uuid, uuid, text, numeric, text, jsonb);

-- 3b. CREATE función unificada con p_is_upgrade
CREATE OR REPLACE FUNCTION billing.handle_payment_subscription_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_billing_period text,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_is_upgrade boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_previous_plan_id uuid;
    v_previous_plan_name text;
    v_product_name text;
    v_product_type text;
    v_enriched_metadata jsonb;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    -- Determinar tipo de producto
    v_product_type := CASE WHEN p_is_upgrade THEN 'upgrade' ELSE 'subscription' END;

    -- Pre-fetch nombre del plan para enriquecer metadata
    v_step := 'fetch_plan_name';
    SELECT name INTO v_plan_name FROM billing.plans WHERE id = p_plan_id;

    v_product_name := COALESCE(v_plan_name, 'Plan') || ' (' ||
        CASE WHEN p_billing_period = 'annual' THEN 'anual' ELSE 'mensual' END || ')';

    -- Enriquecer metadata base
    v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'billing_period', p_billing_period
    );

    -- Para upgrades: obtener info del plan anterior
    IF p_is_upgrade THEN
        v_step := 'get_previous_plan';
        SELECT o.plan_id, p.name
        INTO v_previous_plan_id, v_previous_plan_name
        FROM iam.organizations o
        LEFT JOIN billing.plans p ON p.id = o.plan_id
        WHERE o.id = p_organization_id;

        v_product_name := 'Upgrade a ' || v_product_name;

        v_enriched_metadata := v_enriched_metadata || jsonb_build_object(
            'upgrade', true,
            'previous_plan_id', v_previous_plan_id,
            'previous_plan_name', v_previous_plan_name
        );
    END IF;

    -- Agregar product_name a metadata (para el trigger de email)
    v_enriched_metadata := v_enriched_metadata || jsonb_build_object(
        'product_name', v_product_name
    );

    -- Insertar pago (trigger dispara email + activity log automáticamente)
    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        v_product_type, p_plan_id, NULL, p_amount, p_currency, v_enriched_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    -- Gestión de suscripción
    v_step := 'expire_previous_subscription';
    PERFORM billing.step_subscription_expire_previous(p_organization_id);

    v_step := 'create_active_subscription';
    v_subscription_id := billing.step_subscription_create_active(
        p_organization_id, p_plan_id, p_billing_period,
        v_payment_id, p_amount, p_currency
    );

    v_step := 'set_organization_plan';
    PERFORM billing.step_organization_set_plan(p_organization_id, p_plan_id);

    -- Programa founders (solo anual)
    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM billing.step_apply_founders_program(p_user_id, p_organization_id);
    END IF;

    -- Email y activity log ahora son triggers automáticos ✅

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id,
        'previous_plan_id', v_previous_plan_id,
        'previous_plan_name', v_previous_plan_name
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', v_product_type, 'handle_payment_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step, 'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id, 'organization_id', p_organization_id,
                'plan_id', p_plan_id, 'billing_period', p_billing_period,
                'is_upgrade', p_is_upgrade
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'subscription_id', v_subscription_id,
            'warning_step', v_step
        );
END;
$function$;

-- 3c. Convertir handle_upgrade en wrapper que llama a la función unificada
CREATE OR REPLACE FUNCTION billing.handle_upgrade_subscription_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_billing_period text,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
    -- Delegar a la función unificada con p_is_upgrade = true
    RETURN billing.handle_payment_subscription_success(
        p_provider, p_provider_payment_id, p_user_id,
        p_organization_id, p_plan_id, p_billing_period,
        p_amount, p_currency, p_metadata, true
    );
END;
$function$;


-- ============================================================
-- PARTE 4: Actualizar handlers restantes
-- (enriquecer metadata, eliminar llamadas manuales)
-- ============================================================

-- 4a. handle_payment_course_success (enriquecer metadata, quitar step_send_purchase_email)
CREATE OR REPLACE FUNCTION billing.handle_payment_course_success(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_course_id uuid,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_course_name text;
    v_enriched_metadata jsonb;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    -- Pre-fetch nombre del curso para metadata
    v_step := 'fetch_course_name';
    SELECT title INTO v_course_name FROM academy.courses WHERE id = p_course_id;

    -- Enriquecer metadata con product_name (para trigger de email)
    v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'product_name', COALESCE(v_course_name, 'Curso')
    );

    -- Insertar pago (trigger dispara email automáticamente)
    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, NULL,
        'course', NULL, p_course_id, p_amount, p_currency, v_enriched_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    -- Inscripción al curso
    v_step := 'course_enrollment_annual';
    PERFORM academy.step_course_enrollment_annual(p_user_id, p_course_id);

    -- Email ahora es trigger automático ✅

    v_step := 'done';
    RETURN jsonb_build_object('status', 'ok', 'payment_id', v_payment_id);

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', 'course', 'handle_payment_course_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step, 'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id, 'course_id', p_course_id,
                'amount', p_amount, 'currency', p_currency
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'warning_step', v_step
        );
END;
$function$;

-- 4b. handle_member_seat_purchase (enriquecer metadata, quitar step_log + step_email)
CREATE OR REPLACE FUNCTION billing.handle_member_seat_purchase(
    p_provider text,
    p_provider_payment_id text,
    p_user_id uuid,
    p_organization_id uuid,
    p_plan_id uuid,
    p_seats_purchased integer,
    p_amount numeric,
    p_currency text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_enriched_metadata jsonb;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    -- Enriquecer metadata con product_name y seats (para triggers)
    v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'product_name', p_seats_purchased || ' asiento(s) adicional(es)',
        'seats_purchased', p_seats_purchased
    );

    -- Insertar pago (triggers disparan email + activity log automáticamente)
    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'seat_purchase', p_plan_id, NULL, p_amount, p_currency, v_enriched_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    -- Incrementar seats
    v_step := 'increment_seats';
    PERFORM iam.step_organization_increment_seats(p_organization_id, p_seats_purchased);

    -- Log y email ahora son triggers automáticos ✅

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM ops.log_system_error(
        'payment', 'seat_purchase', 'handle_member_seat_purchase',
        SQLERRM,
        jsonb_build_object(
            'step', v_step, 'provider', p_provider,
            'provider_payment_id', p_provider_payment_id,
            'organization_id', p_organization_id,
            'seats', p_seats_purchased, 'amount', p_amount
        ),
        'critical'
    );

    RETURN jsonb_build_object(
        'status', 'ok_with_warning',
        'payment_id', v_payment_id,
        'warning_step', v_step
    );
END;
$function$;


-- ============================================================
-- PARTE 5: Limpieza - DROP funciones deprecadas
-- ============================================================

-- Ya no son llamadas por ningún handler
DROP FUNCTION IF EXISTS billing.step_send_purchase_email(uuid, text, text, numeric, text, uuid, text);
DROP FUNCTION IF EXISTS billing.step_log_seat_purchase_event(uuid, uuid, integer, numeric, text, uuid, boolean);


-- ============================================================
-- PARTE 6: Recargar schema de PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
