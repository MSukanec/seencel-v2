# Detalle de DB para FUNCIONES DE SUSCRIPCIONES:

# Funcion step_payment_insert_idempotent:

declare
  v_payment_id uuid;
  v_product_id uuid;
begin
  -- ------------------------------------------------------------
  -- product_id unificado:
  -- - subscription: guardamos plan_id en product_id
  -- - course: guardamos course_id en product_id
  -- ------------------------------------------------------------
  if p_product_type = 'subscription' then
    v_product_id := p_plan_id;
  elsif p_product_type = 'course' then
    v_product_id := p_course_id;
  else
    v_product_id := null;
  end if;

  insert into public.payments (
    provider,
    provider_payment_id,
    user_id,
    organization_id,
    product_type,
    product_id,
    course_id,
    amount,
    currency,
    status,
    metadata,
    gateway,
    approved_at
  )
  values (
    p_provider,
    p_provider_payment_id,
    p_user_id,
    p_organization_id,
    p_product_type,
    v_product_id,
    p_course_id,
    p_amount,
    coalesce(p_currency, 'USD'),
    'completed',
    coalesce(p_metadata, '{}'::jsonb),
    p_provider,
    now()
  )
  on conflict (provider, provider_payment_id)
  do nothing
  returning id into v_payment_id;

  return v_payment_id;

exception
  when others then
    perform public.log_system_error(
      'payment',
      'payments',
      'step_payment_insert_idempotent',
      sqlerrm,
      jsonb_build_object(
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id,
        'user_id', p_user_id,
        'organization_id', p_organization_id,
        'product_type', p_product_type,
        'plan_id', p_plan_id,
        'course_id', p_course_id,
        'amount', p_amount,
        'currency', p_currency
      ),
      'critical'
    );
    raise;
end;

# Función step_subscription_expire_previous:

BEGIN
  UPDATE public.organization_subscriptions
  SET
    status = 'expired',
    expires_at = now()
  WHERE organization_id = p_organization_id
    AND status = 'active';
END;

# Función step_subscription_create_active:

declare
  v_subscription_id uuid;
  v_expires_at timestamptz;
begin
  if p_billing_period = 'annual' then
    v_expires_at := now() + interval '1 year';
  else
    v_expires_at := now() + interval '1 month';
  end if;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    payment_id,
    status,
    billing_period,
    started_at,
    expires_at,
    amount,
    currency
  )
  values (
    p_organization_id,
    p_plan_id,
    p_payment_id,
    'active',
    p_billing_period,
    now(),
    v_expires_at,
    p_amount,
    p_currency
  )
  returning id into v_subscription_id;

  return v_subscription_id;
end;

# Función step_organization_set_plan:

BEGIN
  UPDATE public.organizations
  SET
    plan_id = p_plan_id,
    updated_at = now()
  WHERE id = p_organization_id;
END;

# Función step_apply_founders_program:

DECLARE
  v_bonus_course_id uuid;
BEGIN
  -- marcar organización como founder
  UPDATE public.organizations
  SET
    settings = coalesce(settings, '{}'::jsonb)
      || jsonb_build_object('is_founder', true),
    updated_at = now()
  WHERE id = p_organization_id;

  -- curso bonus desde app_settings
  SELECT value::uuid
  INTO v_bonus_course_id
  FROM public.app_settings
  WHERE key = 'founder_bonus_course_id'
  LIMIT 1;

  IF v_bonus_course_id IS NOT NULL THEN
    PERFORM public.step_course_enrollment_annual(
      p_user_id,
      v_bonus_course_id
    );
  END IF;
END;


