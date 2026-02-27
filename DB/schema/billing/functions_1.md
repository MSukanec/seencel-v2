# Database Schema (Auto-generated)
> Generated: 2026-02-26T22:25:46.213Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [BILLING] Functions (chunk 1: check_active_project_limit — validate_coupon_universal)

### `billing.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: json
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_current_count INT;
    v_max_allowed INT;
    v_plan_features JSONB;
BEGIN
    SELECT COUNT(*)
    INTO v_current_count
    FROM projects.projects
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND is_deleted = false
      AND (p_excluded_project_id IS NULL OR id != p_excluded_project_id);

    SELECT p.features
    INTO v_plan_features
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    IF v_plan_features IS NULL THEN
        v_max_allowed := -1;
    ELSE
        v_max_allowed := COALESCE((v_plan_features->>'max_active_projects')::INT, -1);
    END IF;

    RETURN json_build_object(
        'allowed', (v_max_allowed = -1 OR v_current_count < v_max_allowed),
        'current_active_count', v_current_count,
        'max_allowed', v_max_allowed
    );
END;
$function$
```
</details>

### `billing.get_organization_seat_status(p_organization_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.get_organization_seat_status(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_seats_included integer;
    v_max_members integer;
    v_purchased_seats integer;
    v_current_members integer;
    v_pending_invitations integer;
    v_total_capacity integer;
    v_available_seats integer;
    v_plan_price_monthly numeric;
    v_plan_price_annual numeric;
    v_plan_slug text;
    v_billing_period text;
    v_expires_at timestamptz;
    v_days_remaining integer;
    v_prorated_price_monthly numeric;
    v_prorated_price_annual numeric;
    v_can_buy_more boolean;
BEGIN
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1),
        COALESCE((p.features->>'max_members')::integer, 999),
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_seats_included, v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM iam.organizations
    WHERE id = p_organization_id;

    SELECT COUNT(*)
    INTO v_current_members
    FROM iam.organization_members
    WHERE organization_id = p_organization_id
      AND is_active = true;

    SELECT COUNT(*)
    INTO v_pending_invitations
    FROM iam.organization_invitations
    WHERE organization_id = p_organization_id
      AND status IN ('pending', 'registered');

    v_total_capacity := v_seats_included + v_purchased_seats;
    v_available_seats := v_total_capacity - (v_current_members + v_pending_invitations);
    v_can_buy_more := (v_total_capacity < v_max_members);

    SELECT 
        s.billing_period,
        s.expires_at
    INTO v_billing_period, v_expires_at
    FROM billing.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;

    IF v_expires_at IS NOT NULL THEN
        v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
        
        IF v_billing_period = 'monthly' THEN
            v_prorated_price_monthly := ROUND(v_plan_price_monthly * (v_days_remaining::numeric / 30.0), 2);
            v_prorated_price_annual := NULL;
        ELSE
            v_prorated_price_annual := ROUND(v_plan_price_annual * (v_days_remaining::numeric / 365.0), 2);
            v_prorated_price_monthly := NULL;
        END IF;
    ELSE
        v_days_remaining := 0;
        v_prorated_price_monthly := v_plan_price_monthly;
        v_prorated_price_annual := v_plan_price_annual;
    END IF;

    RETURN jsonb_build_object(
        'seats_included', v_seats_included,
        'max_members', v_max_members,
        'purchased', v_purchased_seats,
        'total_capacity', v_total_capacity,
        'used', v_current_members,
        'pending_invitations', v_pending_invitations,
        'available', GREATEST(v_available_seats, 0),
        'can_invite', v_available_seats > 0,
        'can_buy_more', v_can_buy_more,
        'seat_price_monthly', v_plan_price_monthly,
        'seat_price_annual', v_plan_price_annual,
        'plan_slug', v_plan_slug,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'days_remaining', v_days_remaining,
        'prorated_monthly', v_prorated_price_monthly,
        'prorated_annual', v_prorated_price_annual
    );
END;
$function$
```
</details>

### `billing.get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    -- Plan actual
    v_current_plan_id uuid;
    v_current_plan_slug text;
    v_current_plan_name text;
    v_current_monthly numeric;
    v_current_annual numeric;
    
    -- Plan destino
    v_target_plan_slug text;
    v_target_plan_name text;
    v_target_monthly numeric;
    v_target_annual numeric;
    
    -- Suscripción activa
    v_billing_period text;
    v_started_at timestamptz;
    v_expires_at timestamptz;
    v_subscription_amount numeric;
    v_subscription_id uuid;
    
    -- Cálculos
    v_days_remaining integer;
    v_period_total_days integer;
    v_credit numeric;
    v_target_price numeric;
    v_upgrade_price numeric;
BEGIN
    -- 1) Obtener plan actual de la organización
    SELECT 
        o.plan_id,
        p.slug,
        p.name,
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0)
    INTO v_current_plan_id, v_current_plan_slug, v_current_plan_name,
         v_current_monthly, v_current_annual
    FROM iam.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;
    
    IF v_current_plan_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'ORGANIZATION_NOT_FOUND'
        );
    END IF;
    
    -- Validar que el plan actual sea PRO
    IF v_current_plan_slug NOT ILIKE '%pro%' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NOT_PRO_PLAN',
            'current_plan', v_current_plan_slug
        );
    END IF;
    
    -- 2) Obtener plan destino
    SELECT 
        slug,
        name,
        COALESCE(monthly_amount, 0),
        COALESCE(annual_amount, 0)
    INTO v_target_plan_slug, v_target_plan_name,
         v_target_monthly, v_target_annual
    FROM billing.plans
    WHERE id = p_target_plan_id;
    
    IF v_target_plan_slug IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'TARGET_PLAN_NOT_FOUND'
        );
    END IF;
    
    -- Validar que el destino sea TEAMS
    IF v_target_plan_slug NOT ILIKE '%team%' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NOT_TEAMS_PLAN',
            'target_plan', v_target_plan_slug
        );
    END IF;
    
    -- 3) Obtener suscripción activa
    SELECT 
        s.id,
        s.billing_period,
        s.started_at,
        s.expires_at,
        s.amount
    INTO v_subscription_id, v_billing_period, v_started_at, v_expires_at, v_subscription_amount
    FROM billing.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NO_ACTIVE_SUBSCRIPTION'
        );
    END IF;
    
    -- 4) Calcular prorrateo
    v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
    v_period_total_days := GREATEST(1, (v_expires_at::date - v_started_at::date));
    
    v_credit := ROUND(
        (CASE WHEN v_billing_period = 'monthly' THEN v_current_monthly ELSE v_current_annual END)
        * (v_days_remaining::numeric / v_period_total_days::numeric),
        2
    );
    
    IF v_billing_period = 'monthly' THEN
        v_target_price := v_target_monthly;
    ELSE
        v_target_price := v_target_annual;
    END IF;
    
    v_upgrade_price := GREATEST(0.01, v_target_price - v_credit);
    
    -- 5) Retornar resultado
    RETURN jsonb_build_object(
        'ok', true,
        'current_plan_id', v_current_plan_id,
        'current_plan_slug', v_current_plan_slug,
        'current_plan_name', v_current_plan_name,
        'target_plan_id', p_target_plan_id,
        'target_plan_slug', v_target_plan_slug,
        'target_plan_name', v_target_plan_name,
        'target_price', v_target_price,
        'subscription_id', v_subscription_id,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'subscription_amount', v_subscription_amount,
        'days_remaining', v_days_remaining,
        'period_total_days', v_period_total_days,
        'credit', v_credit,
        'upgrade_price', v_upgrade_price
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
$function$
```
</details>

### `billing.handle_payment_seat_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_payment_seat_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
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

    v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'product_name', p_seats_purchased || ' asiento(s) adicional(es)',
        'seats_purchased', p_seats_purchased
    );

    v_step := 'insert_payment';
    v_payment_id := billing.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'seat_purchase', p_plan_id, NULL, p_amount, p_currency, v_enriched_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'increment_seats';
    PERFORM iam.step_organization_increment_seats(p_organization_id, p_seats_purchased);

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM ops.log_system_error(
        'payment', 'seat_purchase', 'handle_payment_seat_success',
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

### `billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb, p_is_upgrade boolean DEFAULT false)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb, p_is_upgrade boolean DEFAULT false)
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
$function$
```
</details>

### `billing.handle_payment_upgrade_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION billing.handle_payment_upgrade_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'iam', 'public'
AS $function$
BEGIN
    RETURN billing.handle_payment_subscription_success(
        p_provider, p_provider_payment_id, p_user_id,
        p_organization_id, p_plan_id, p_billing_period,
        p_amount, p_currency, p_metadata, true
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
