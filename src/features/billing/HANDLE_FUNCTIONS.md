# Funciones en DB para FACTURACIÓN (NO MODIFICAR):

# Función HANDLE_PAYMENT_COURSE_SUCCESS:

DECLARE
    v_payment_id uuid;
    v_course_name text;
    v_step text := 'start';
BEGIN
    -- ============================================================
    -- 1) Idempotencia
    -- ============================================================
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(
        hashtext(p_provider || p_provider_payment_id)
    );

    -- ============================================================
    -- 2) Registrar pago
    -- ============================================================
    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider,
        p_provider_payment_id,
        p_user_id,
        NULL,
        'course',
        NULL,
        p_course_id,
        p_amount,
        p_currency,
        p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_processed'
        );
    END IF;

    -- ============================================================
    -- 3) Enroll anual al curso
    -- ============================================================
    v_step := 'course_enrollment_annual';
    PERFORM public.step_course_enrollment_annual(
        p_user_id,
        p_course_id
    );

    -- ============================================================
    -- 4) NUEVO: Enviar emails de confirmación
    -- ============================================================
    v_step := 'send_purchase_email';
    
    -- Obtener nombre del curso
    SELECT title INTO v_course_name
    FROM public.courses
    WHERE id = p_course_id;
    
    PERFORM public.step_send_purchase_email(
        p_user_id,
        'course',
        COALESCE(v_course_name, 'Curso'),
        p_amount,
        p_currency,
        v_payment_id
    );

    -- ============================================================
    -- DONE
    -- ============================================================
    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM public.log_system_error(
            'payment',
            'course',
            'handle_payment_course_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step,
                'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id,
                'course_id', p_course_id,
                'amount', p_amount,
                'currency', p_currency
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'warning_step', v_step
        );
END;

# Función HANDLE_PAYMENT_SUBSCRIPTION_SUCCESS:


DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_step text := 'start';
BEGIN
    -- ============================================================
    -- 1) Idempotencia fuerte
    -- ============================================================
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(
        hashtext(p_provider || p_provider_payment_id)
    );

    -- ============================================================
    -- 2) Registrar pago
    -- ============================================================
    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider,
        p_provider_payment_id,
        p_user_id,
        p_organization_id,
        'subscription',
        p_plan_id,
        NULL,
        p_amount,
        p_currency,
        p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_processed'
        );
    END IF;

    -- ============================================================
    -- 3) Expirar suscripción anterior
    -- ============================================================
    v_step := 'expire_previous_subscription';
    PERFORM public.step_subscription_expire_previous(
        p_organization_id
    );

    -- ============================================================
    -- 4) Crear nueva suscripción activa
    -- ============================================================
    v_step := 'create_active_subscription';
    v_subscription_id := public.step_subscription_create_active(
        p_organization_id,
        p_plan_id,
        p_billing_period,
        v_payment_id,
        p_amount,
        p_currency
    );

    -- ============================================================
    -- 5) Actualizar plan activo
    -- ============================================================
    v_step := 'set_organization_plan';
    PERFORM public.step_organization_set_plan(
        p_organization_id,
        p_plan_id
    );

    -- ============================================================
    -- 6) Fundadores (solo anual)
    -- ============================================================
    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM public.step_apply_founders_program(
            p_user_id,
            p_organization_id
        );
    END IF;

    -- ============================================================
    -- 7) NUEVO: Enviar emails de confirmación
    -- ============================================================
    v_step := 'send_purchase_email';
    
    -- Obtener nombre del plan
    SELECT name INTO v_plan_name
    FROM public.plans
    WHERE id = p_plan_id;
    
    PERFORM public.step_send_purchase_email(
        p_user_id,
        'subscription',
        COALESCE(v_plan_name, 'Plan') || ' (' || p_billing_period || ')',
        p_amount,
        p_currency,
        v_payment_id
    );

    -- ============================================================
    -- OK
    -- ============================================================
    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM public.log_system_error(
            'payment',
            'subscription',
            'handle_payment_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step,
                'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id,
                'organization_id', p_organization_id,
                'plan_id', p_plan_id,
                'billing_period', p_billing_period
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
