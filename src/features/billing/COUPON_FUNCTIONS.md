# Funciones en DB para CUPONES:

# Función REDEEM_COUPON_UNIVERSAL:

DECLARE
  v_user_id uuid;
  v_validation jsonb;
  v_coupon_id uuid;
  v_discount numeric;
  v_existing_id uuid;
BEGIN
  -- ============================================================
  -- 1) Obtener usuario
  -- ============================================================
  v_user_id := public.current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'UNAUTHENTICATED'
    );
  END IF;

  -- ============================================================
  -- 2) Validar cupón usando la función universal
  -- ============================================================
  v_validation := public.validate_coupon_universal(
    p_code,
    p_product_type,
    p_product_id,
    p_price,
    p_currency
  );

  -- Si la validación falla, retornar el error
  IF (v_validation->>'ok')::boolean IS FALSE THEN
    RETURN v_validation;
  END IF;

  -- Extraer datos del cupón validado
  v_coupon_id := (v_validation->>'coupon_id')::uuid;
  v_discount := (v_validation->>'discount')::numeric;

  -- ============================================================
  -- 3) Verificar idempotencia (evitar duplicados)
  -- ============================================================
  SELECT id INTO v_existing_id
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon_id
    AND user_id = v_user_id
    AND (
      (p_product_type = 'course' AND course_id = p_product_id)
      OR
      (p_product_type = 'subscription' AND plan_id = p_product_id)
    )
    AND (
      (p_order_id IS NOT NULL AND order_id = p_order_id)
      OR
      (p_subscription_id IS NOT NULL AND subscription_id = p_subscription_id)
    )
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Ya fue redimido para esta orden/suscripción
    RETURN jsonb_build_object(
      'ok', true,
      'already_redeemed', true,
      'redemption_id', v_existing_id,
      'discount', v_discount,
      'final_price', (v_validation->>'final_price')::numeric
    );
  END IF;

  -- ============================================================
  -- 4) Registrar redención
  -- ============================================================
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    user_id,
    course_id,
    plan_id,
    order_id,
    subscription_id,
    amount_saved,
    currency
  )
  VALUES (
    v_coupon_id,
    v_user_id,
    CASE WHEN p_product_type = 'course' THEN p_product_id ELSE NULL END,
    CASE WHEN p_product_type = 'subscription' THEN p_product_id ELSE NULL END,
    p_order_id,
    p_subscription_id,
    v_discount,
    p_currency
  )
  RETURNING id INTO v_existing_id;

  -- ============================================================
  -- 5) Retornar éxito
  -- ============================================================
  RETURN jsonb_build_object(
    'ok', true,
    'redemption_id', v_existing_id,
    'coupon_id', v_coupon_id,
    'coupon_code', v_validation->>'coupon_code',
    'discount', v_discount,
    'final_price', (v_validation->>'final_price')::numeric,
    'is_free', (v_validation->>'is_free')::boolean
  );
END;

# Función VALIDATE_COUPON_UNIVERSAL:

DECLARE
  v_user_id uuid;
  v_coupon public.coupons%rowtype;
  v_uses_user int;
  v_uses_total int;
  v_applicable boolean := false;
  v_discount numeric;
  v_final_price numeric;
  v_applies_to_check text;
BEGIN
  -- ============================================================
  -- 1) Validar usuario autenticado
  -- ============================================================
  v_user_id := public.current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'UNAUTHENTICATED'
    );
  END IF;

  -- ============================================================
  -- 2) Validar product_type
  -- ============================================================
  IF p_product_type NOT IN ('course', 'subscription') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'INVALID_PRODUCT_TYPE'
    );
  END IF;

  -- Mapear product_type a applies_to values
  v_applies_to_check := CASE 
    WHEN p_product_type = 'course' THEN 'courses'
    WHEN p_product_type = 'subscription' THEN 'subscriptions'
  END;

  -- ============================================================
  -- 3) Buscar cupón (case-insensitive, siempre lower)
  -- ============================================================
  SELECT *
  INTO v_coupon
  FROM public.coupons
  WHERE lower(code) = lower(p_code)
    AND is_active = true
    AND (applies_to = v_applies_to_check OR applies_to = 'all')
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'COUPON_NOT_FOUND'
    );
  END IF;

  -- ============================================================
  -- 4) Verificar mínimo de compra
  -- ============================================================
  IF v_coupon.min_order_total IS NOT NULL 
     AND p_price < v_coupon.min_order_total THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'MINIMUM_NOT_MET',
      'minimum_required', v_coupon.min_order_total
    );
  END IF;

  -- ============================================================
  -- 5) Verificar alcance específico (curso o plan)
  -- ============================================================
  IF v_coupon.applies_to_all THEN
    v_applicable := true;
  ELSE
    -- Verificar tabla de relación según tipo
    IF p_product_type = 'course' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.coupon_courses
        WHERE coupon_id = v_coupon.id
          AND course_id = p_product_id
      ) INTO v_applicable;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.coupon_plans
        WHERE coupon_id = v_coupon.id
          AND plan_id = p_product_id
      ) INTO v_applicable;
    END IF;
  END IF;

  IF NOT v_applicable THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'PRODUCT_NOT_ELIGIBLE'
    );
  END IF;

  -- ============================================================
  -- 6) Verificar límite por usuario
  -- ============================================================
  SELECT count(*)
  INTO v_uses_user
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id
    AND user_id = v_user_id;

  IF v_coupon.per_user_limit IS NOT NULL 
     AND v_uses_user >= v_coupon.per_user_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'USER_LIMIT_REACHED',
      'limit', v_coupon.per_user_limit,
      'used', v_uses_user
    );
  END IF;

  -- ============================================================
  -- 7) Verificar límite global
  -- ============================================================
  SELECT count(*)
  INTO v_uses_total
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id;

  IF v_coupon.max_redemptions IS NOT NULL 
     AND v_uses_total >= v_coupon.max_redemptions THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'GLOBAL_LIMIT_REACHED'
    );
  END IF;

  -- ============================================================
  -- 8) Verificar moneda (solo para descuentos fijos)
  -- ============================================================
  IF v_coupon.type = 'fixed' 
     AND v_coupon.currency IS NOT NULL 
     AND v_coupon.currency <> p_currency THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'CURRENCY_MISMATCH',
      'coupon_currency', v_coupon.currency,
      'order_currency', p_currency
    );
  END IF;

  -- ============================================================
  -- 9) Calcular descuento
  -- ============================================================
  IF v_coupon.type = 'percent' THEN
    v_discount := round(
      p_price * (least(v_coupon.amount, 100)::numeric / 100.0),
      2
    );
  ELSE
    v_discount := least(v_coupon.amount, p_price);
  END IF;

  v_final_price := greatest(p_price - v_discount, 0);

  -- ============================================================
  -- 10) Retornar éxito
  -- ============================================================
  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', v_coupon.id,
    'coupon_code', v_coupon.code,
    'type', v_coupon.type,
    'amount', v_coupon.amount,
    'discount', v_discount,
    'final_price', v_final_price,
    'currency', coalesce(v_coupon.currency, p_currency),
    'is_free', v_final_price = 0
  );
END;

