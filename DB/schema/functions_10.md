# Database Schema (Auto-generated)
> Generated: 2026-02-16T21:47:12.644Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 10: update_timestamp — validate_coupon_universal)

### `update_timestamp()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
```
</details>

### `update_updated_at_column()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
```
</details>

### `users_normalize_email()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.users_normalize_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.email is not null then
    new.email := lower(new.email);
  end if;

  return new;
end;
$function$
```
</details>

### `validate_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.validate_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
```
</details>
