# Funciones en DB para FACTURACIÓN (NO MODIFICAR):

# Función HANDLE_PAYMENT_COURSE_SUCCESS:

DECLARE
  v_payment_id uuid;
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
  -- DONE
  -- ============================================================
  v_step := 'done';
  RETURN jsonb_build_object(
    'status', 'ok',
    'payment_id', v_payment_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 🔥 LOGUEAMOS PERO NO ROMPEMOS EL FLUJO
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

    -- ⚠️ CLAVE: NO RAISE
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

  -- 4) Crear nueva suscripción activa
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
    -- Logueamos pero NO rompemos el flujo
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

# Función REDEEM_COUPON:

declare
  v_user_id uuid;
  v_valid jsonb;
  v_coupon_id uuid;
begin
  -- Obtener usuario autenticado
  v_user_id := public.current_user_id();

  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'UNAUTHENTICATED'
    );
  end if;

  -- Validar cupón
  v_valid := public.validate_coupon(
    p_code,
    p_course_id,
    p_price,
    p_currency
  );

  if (v_valid->>'ok')::boolean is false then
    return v_valid;
  end if;

  v_coupon_id := (v_valid->>'coupon_id')::uuid;

  -- Registrar redención
  insert into public.coupon_redemptions (
    coupon_id,
    user_id,
    course_id,
    order_id,
    amount_saved,
    currency
  )
  values (
    v_coupon_id,
    v_user_id,
    p_course_id,
    p_order_id,
    (v_valid->>'discount')::numeric,
    v_valid->>'currency'
  );

  return jsonb_build_object(
    'ok', true,
    'discount', v_valid->>'discount'
  );
end;
