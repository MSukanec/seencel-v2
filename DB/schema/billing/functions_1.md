# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Functions (chunk 1: handle_member_seat_purchase — validate_coupon_universal)

### `billing.handle_member_seat_purchase(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_member_seat_purchase(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'seat_purchase', p_plan_id, NULL, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'increment_seats';
    PERFORM iam.step_organization_increment_seats(p_organization_id, p_seats_purchased);

    v_step := 'log_event';
    PERFORM billing.step_log_seat_purchase_event(
        p_organization_id, p_user_id, p_seats_purchased,
        p_amount, p_currency, v_payment_id, true
    );

    v_step := 'send_email';
    PERFORM billing.step_send_purchase_email(
        p_user_id, 'seat_purchase',
        p_seats_purchased || ' asiento(s) adicional(es)',
        p_amount, p_currency, v_payment_id, p_provider
    );

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
$function$
```
</details>

### `billing.handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_course_name text;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, NULL,
        'course', NULL, p_course_id, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'course_enrollment_annual';
    PERFORM academy.step_course_enrollment_annual(p_user_id, p_course_id);

    v_step := 'send_purchase_email';
    SELECT title INTO v_course_name FROM academy.courses WHERE id = p_course_id;

    PERFORM billing.step_send_purchase_email(
        p_user_id, 'course', COALESCE(v_course_name, 'Curso'),
        p_amount, p_currency, v_payment_id, p_provider
    );

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
$function$
```
</details>

### `billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'subscription', p_plan_id, NULL, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'expire_previous_subscription';
    PERFORM billing.step_subscription_expire_previous(p_organization_id);

    v_step := 'create_active_subscription';
    v_subscription_id := billing.step_subscription_create_active(
        p_organization_id, p_plan_id, p_billing_period,
        v_payment_id, p_amount, p_currency
    );

    v_step := 'set_organization_plan';
    PERFORM billing.step_organization_set_plan(p_organization_id, p_plan_id);

    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM billing.step_apply_founders_program(p_user_id, p_organization_id);
    END IF;

    v_step := 'send_purchase_email';
    SELECT name INTO v_plan_name FROM billing.plans WHERE id = p_plan_id;

    PERFORM billing.step_send_purchase_email(
        p_user_id, 'subscription',
        COALESCE(v_plan_name, 'Plan') || ' (' || p_billing_period || ')',
        p_amount, p_currency, v_payment_id, p_provider
    );

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', 'subscription', 'handle_payment_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step, 'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id, 'organization_id', p_organization_id,
                'plan_id', p_plan_id, 'billing_period', p_billing_period
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
$function$
```
</details>

### `billing.handle_upgrade_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_upgrade_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_previous_plan_name text;
    v_previous_plan_id uuid;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'get_previous_plan';
    SELECT o.plan_id, p.name
    INTO v_previous_plan_id, v_previous_plan_name
    FROM iam.organizations o
    LEFT JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'upgrade', p_plan_id, NULL, p_amount, p_currency,
        p_metadata || jsonb_build_object(
            'upgrade', true,
            'previous_plan_id', v_previous_plan_id,
            'previous_plan_name', v_previous_plan_name
        )
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'expire_previous_subscription';
    PERFORM billing.step_subscription_expire_previous(p_organization_id);

    v_step := 'create_active_subscription';
    v_subscription_id := billing.step_subscription_create_active(
        p_organization_id, p_plan_id, p_billing_period,
        v_payment_id, p_amount, p_currency
    );

    v_step := 'set_organization_plan';
    PERFORM billing.step_organization_set_plan(p_organization_id, p_plan_id);

    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM billing.step_apply_founders_program(p_user_id, p_organization_id);
    END IF;

    v_step := 'send_purchase_email';
    SELECT name INTO v_plan_name FROM billing.plans WHERE id = p_plan_id;

    PERFORM billing.step_send_purchase_email(
        p_user_id, 'upgrade',
        'Upgrade a ' || COALESCE(v_plan_name, 'Plan') || ' (' || CASE WHEN p_billing_period = 'annual' THEN 'anual' ELSE 'mensual' END || ')',
        p_amount, p_currency, v_payment_id, p_provider
    );

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
            'payment', 'upgrade', 'handle_upgrade_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step, 'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id, 'organization_id', p_organization_id,
                'plan_id', p_plan_id, 'billing_period', p_billing_period
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
$function$
```
</details>

### `billing.redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_validation jsonb;
  v_coupon_id uuid;
  v_discount numeric;
  v_existing_id uuid;
BEGIN
  v_user_id := public.current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'UNAUTHENTICATED');
  END IF;

  v_validation := billing.validate_coupon_universal(
    p_code, p_product_type, p_product_id, p_price, p_currency
  );

  IF (v_validation->>'ok')::boolean IS FALSE THEN
    RETURN v_validation;
  END IF;

  v_coupon_id := (v_validation->>'coupon_id')::uuid;
  v_discount := (v_validation->>'discount')::numeric;

  SELECT id INTO v_existing_id
  FROM billing.coupon_redemptions
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
    RETURN jsonb_build_object(
      'ok', true, 'already_redeemed', true,
      'redemption_id', v_existing_id, 'discount', v_discount,
      'final_price', (v_validation->>'final_price')::numeric
    );
  END IF;

  INSERT INTO billing.coupon_redemptions (
    coupon_id, user_id, course_id, plan_id,
    order_id, subscription_id, amount_saved, currency
  )
  VALUES (
    v_coupon_id, v_user_id,
    CASE WHEN p_product_type = 'course' THEN p_product_id ELSE NULL END,
    CASE WHEN p_product_type = 'subscription' THEN p_product_id ELSE NULL END,
    p_order_id, p_subscription_id, v_discount, p_currency
  )
  RETURNING id INTO v_existing_id;

  RETURN jsonb_build_object(
    'ok', true, 'redemption_id', v_existing_id,
    'coupon_id', v_coupon_id, 'coupon_code', v_validation->>'coupon_code',
    'discount', v_discount,
    'final_price', (v_validation->>'final_price')::numeric,
    'is_free', (v_validation->>'is_free')::boolean
  );
END;
$function$
```
</details>

### `billing.step_apply_founders_program(p_user_id uuid, p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_apply_founders_program(p_user_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
  v_bonus_course_id uuid;
BEGIN
  UPDATE iam.organizations
  SET
    settings = coalesce(settings, '{}'::jsonb)
      || jsonb_build_object('is_founder', true),
    updated_at = now()
  WHERE id = p_organization_id;

  SELECT value::uuid
  INTO v_bonus_course_id
  FROM public.app_settings
  WHERE key = 'founder_bonus_course_id'
  LIMIT 1;

  IF v_bonus_course_id IS NOT NULL THEN
    PERFORM academy.step_course_enrollment_annual(
      p_user_id,
      v_bonus_course_id
    );
  END IF;
END;
$function$
```
</details>

### `billing.step_log_seat_purchase_event(p_organization_id uuid, p_user_id uuid, p_seats integer, p_amount numeric, p_currency text, p_payment_id uuid, p_prorated boolean)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_log_seat_purchase_event(p_organization_id uuid, p_user_id uuid, p_seats integer, p_amount numeric, p_currency text, p_payment_id uuid, p_prorated boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_event_id UUID;
    v_member_id UUID;
BEGIN
    SELECT id INTO v_member_id
    FROM iam.organization_members
    WHERE organization_id = p_organization_id 
      AND user_id = p_user_id
    LIMIT 1;

    INSERT INTO public.organization_activity_logs (
        organization_id, member_id, action,
        target_table, target_id, metadata
    ) VALUES (
        p_organization_id, v_member_id, 'seat_purchased',
        'payments', p_payment_id,
        jsonb_build_object(
            'seats', p_seats, 'amount', p_amount,
            'currency', p_currency, 'payment_id', p_payment_id,
            'prorated', p_prorated, 'user_id', p_user_id
        )
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$function$
```
</details>

### `billing.step_organization_set_plan(p_organization_id uuid, p_plan_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_organization_set_plan(p_organization_id uuid, p_plan_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
  UPDATE iam.organizations
  SET
    plan_id = p_plan_id,
    updated_at = now()
  WHERE id = p_organization_id;
END;
$function$
```
</details>

### `billing.step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)`

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
declare
  v_payment_id uuid;
  v_product_id uuid;
begin
  if p_product_type = 'subscription' then
    v_product_id := p_plan_id;
  elsif p_product_type = 'course' then
    v_product_id := p_course_id;
  else
    v_product_id := null;
  end if;

  insert into billing.payments (
    provider, provider_payment_id, user_id, organization_id,
    product_type, product_id, course_id, amount, currency,
    status, metadata, gateway, approved_at
  )
  values (
    p_provider, p_provider_payment_id, p_user_id, p_organization_id,
    p_product_type, v_product_id, p_course_id, p_amount,
    coalesce(p_currency, 'USD'), 'completed',
    coalesce(p_metadata, '{}'::jsonb), p_provider, now()
  )
  on conflict (provider, provider_payment_id)
  do nothing
  returning id into v_payment_id;

  return v_payment_id;

exception
  when others then
    perform ops.log_system_error(
      'payment', 'payments', 'step_payment_insert_idempotent',
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
$function$
```
</details>

### `billing.step_send_purchase_email(p_user_id uuid, p_product_type text, p_product_name text, p_amount numeric, p_currency text, p_payment_id uuid, p_provider text DEFAULT 'mercadopago'::text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_send_purchase_email(p_user_id uuid, p_product_type text, p_product_name text, p_amount numeric, p_currency text, p_payment_id uuid, p_provider text DEFAULT 'mercadopago'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
    v_user_email text;
    v_user_name text;
BEGIN
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM iam.users
    WHERE id = p_user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'step_send_purchase_email: Usuario % no encontrado', p_user_id;
        RETURN;
    END IF;

    INSERT INTO public.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        CASE p_product_type
            WHEN 'course' THEN '¡Tu curso está listo!'
            WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || p_product_name || '!'
            ELSE 'Confirmación de compra'
        END,
        jsonb_build_object(
            'user_id', p_user_id, 'user_email', v_user_email,
            'user_name', v_user_name, 'product_type', p_product_type,
            'product_name', p_product_name, 'amount', p_amount,
            'currency', p_currency, 'payment_id', p_payment_id,
            'provider', p_provider
        ),
        NOW()
    );

    INSERT INTO public.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        '💰 Nueva venta: ' || p_product_name,
        jsonb_build_object(
            'buyer_email', v_user_email, 'buyer_name', v_user_name,
            'product_type', p_product_type, 'product_name', p_product_name,
            'amount', p_amount, 'currency', p_currency,
            'payment_id', p_payment_id, 'provider', p_provider
        ),
        NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'step_send_purchase_email error: %', SQLERRM;
END;
$function$
```
</details>

### `billing.step_subscription_create_active(p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_payment_id uuid, p_amount numeric, p_currency text)`

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_subscription_create_active(p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_payment_id uuid, p_amount numeric, p_currency text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
declare
  v_subscription_id uuid;
  v_expires_at timestamptz;
begin
  if p_billing_period = 'annual' then
    v_expires_at := now() + interval '1 year';
  else
    v_expires_at := now() + interval '1 month';
  end if;

  insert into billing.organization_subscriptions (
    organization_id, plan_id, payment_id, status,
    billing_period, started_at, expires_at, amount, currency
  )
  values (
    p_organization_id, p_plan_id, p_payment_id, 'active',
    p_billing_period, now(), v_expires_at, p_amount, p_currency
  )
  returning id into v_subscription_id;

  return v_subscription_id;
end;
$function$
```
</details>

### `billing.step_subscription_expire_previous(p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.step_subscription_expire_previous(p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
  UPDATE billing.organization_subscriptions
  SET
    status = 'expired',
    expires_at = now()
  WHERE organization_id = p_organization_id
    AND status = 'active';
END;
$function$
```
</details>

### `billing.validate_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.validate_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_coupon billing.coupons%rowtype;
  v_uses_user int;
  v_uses_total int;
  v_applicable boolean := false;
  v_discount numeric;
  v_final_price numeric;
  v_applies_to_check text;
BEGIN
  v_user_id := public.current_user_id();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'UNAUTHENTICATED');
  END IF;

  IF p_product_type NOT IN ('course', 'subscription') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_PRODUCT_TYPE');
  END IF;

  v_applies_to_check := CASE 
    WHEN p_product_type = 'course' THEN 'courses'
    WHEN p_product_type = 'subscription' THEN 'subscriptions'
  END;

  SELECT * INTO v_coupon
  FROM billing.coupons
  WHERE lower(code) = lower(p_code)
    AND is_active = true
    AND (applies_to = v_applies_to_check OR applies_to = 'all')
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'COUPON_NOT_FOUND');
  END IF;

  IF v_coupon.min_order_total IS NOT NULL 
     AND p_price < v_coupon.min_order_total THEN
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'MINIMUM_NOT_MET',
      'minimum_required', v_coupon.min_order_total
    );
  END IF;

  IF v_coupon.applies_to_all THEN
    v_applicable := true;
  ELSE
    IF p_product_type = 'course' THEN
      SELECT EXISTS (
        SELECT 1 FROM billing.coupon_courses
        WHERE coupon_id = v_coupon.id AND course_id = p_product_id
      ) INTO v_applicable;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM billing.coupon_plans
        WHERE coupon_id = v_coupon.id AND plan_id = p_product_id
      ) INTO v_applicable;
    END IF;
  END IF;

  IF NOT v_applicable THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'PRODUCT_NOT_ELIGIBLE');
  END IF;

  SELECT count(*) INTO v_uses_user
  FROM billing.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = v_user_id;

  IF v_coupon.per_user_limit IS NOT NULL 
     AND v_uses_user >= v_coupon.per_user_limit THEN
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'USER_LIMIT_REACHED',
      'limit', v_coupon.per_user_limit, 'used', v_uses_user
    );
  END IF;

  SELECT count(*) INTO v_uses_total
  FROM billing.coupon_redemptions
  WHERE coupon_id = v_coupon.id;

  IF v_coupon.max_redemptions IS NOT NULL 
     AND v_uses_total >= v_coupon.max_redemptions THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'GLOBAL_LIMIT_REACHED');
  END IF;

  IF v_coupon.type = 'fixed' 
     AND v_coupon.currency IS NOT NULL 
     AND v_coupon.currency <> p_currency THEN
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'CURRENCY_MISMATCH',
      'coupon_currency', v_coupon.currency, 'order_currency', p_currency
    );
  END IF;

  IF v_coupon.type = 'percent' THEN
    v_discount := round(p_price * (least(v_coupon.amount, 100)::numeric / 100.0), 2);
  ELSE
    v_discount := least(v_coupon.amount, p_price);
  END IF;

  v_final_price := greatest(p_price - v_discount, 0);

  RETURN jsonb_build_object(
    'ok', true, 'coupon_id', v_coupon.id, 'coupon_code', v_coupon.code,
    'type', v_coupon.type, 'amount', v_coupon.amount,
    'discount', v_discount, 'final_price', v_final_price,
    'currency', coalesce(v_coupon.currency, p_currency),
    'is_free', v_final_price = 0
  );
END;
$function$
```
</details>
