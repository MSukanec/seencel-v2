# Funciones en DB para INSCRIPCIONES (NO MODIFICAR):

# Funcion STEP_PAYMENT_INSERT_IDEMPOTENT:

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

# Función STEP_COURSE_ENROLLMENT_ANNUAL:

BEGIN
  INSERT INTO public.course_enrollments (
    user_id,
    course_id,
    status,
    expires_at
  )
  VALUES (
    p_user_id,
    p_course_id,
    'active',
    now() + interval '1 year'
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE
  SET
    status = 'active',
    expires_at = excluded.expires_at,
    updated_at = now();
END;


