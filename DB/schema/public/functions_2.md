# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 2: get_organization_seat_status — refresh_product_avg_prices)

### `get_organization_seat_status(p_organization_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.get_organization_seat_status(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
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
    FROM public.organizations o
    JOIN billing.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM public.organizations
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

### `get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.get_upgrade_proration(p_organization_id uuid, p_target_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    -- ============================================================
    -- 1) Obtener plan actual de la organización
    -- ============================================================
    SELECT 
        o.plan_id,
        p.slug,
        p.name,
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0)
    INTO v_current_plan_id, v_current_plan_slug, v_current_plan_name,
         v_current_monthly, v_current_annual
    FROM public.organizations o
    JOIN public.plans p ON p.id = o.plan_id
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
    
    -- ============================================================
    -- 2) Obtener plan destino
    -- ============================================================
    SELECT 
        slug,
        name,
        COALESCE(monthly_amount, 0),
        COALESCE(annual_amount, 0)
    INTO v_target_plan_slug, v_target_plan_name,
         v_target_monthly, v_target_annual
    FROM public.plans
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
    
    -- ============================================================
    -- 3) Obtener suscripción activa
    -- ============================================================
    SELECT 
        s.id,
        s.billing_period,
        s.started_at,
        s.expires_at,
        s.amount
    INTO v_subscription_id, v_billing_period, v_started_at, v_expires_at, v_subscription_amount
    FROM public.organization_subscriptions s
    WHERE s.organization_id = p_organization_id
      AND s.status = 'active'
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'NO_ACTIVE_SUBSCRIPTION'
        );
    END IF;
    
    -- ============================================================
    -- 4) Calcular prorrateo
    -- ============================================================
    -- Días restantes
    v_days_remaining := GREATEST(0, (v_expires_at::date - CURRENT_DATE));
    
    -- Total de días del período (calculado con fechas reales)
    v_period_total_days := GREATEST(1, (v_expires_at::date - v_started_at::date));
    
    -- Crédito: precio USD del plan actual × (días restantes / días totales)
    -- IMPORTANTE: Usar precios de la tabla plans (USD), NO subscription.amount
    -- (que puede estar en ARS u otra moneda de pago)
    v_credit := ROUND(
        (CASE WHEN v_billing_period = 'monthly' THEN v_current_monthly ELSE v_current_annual END)
        * (v_days_remaining::numeric / v_period_total_days::numeric),
        2
    );
    
    -- Precio del plan destino (mismo ciclo)
    IF v_billing_period = 'monthly' THEN
        v_target_price := v_target_monthly;
    ELSE
        v_target_price := v_target_annual;
    END IF;
    
    -- Precio neto del upgrade (mínimo $0.01)
    v_upgrade_price := GREATEST(0.01, v_target_price - v_credit);
    
    -- ============================================================
    -- 5) Retornar resultado
    -- ============================================================
    RETURN jsonb_build_object(
        'ok', true,
        
        -- Plan actual
        'current_plan_id', v_current_plan_id,
        'current_plan_slug', v_current_plan_slug,
        'current_plan_name', v_current_plan_name,
        
        -- Plan destino
        'target_plan_id', p_target_plan_id,
        'target_plan_slug', v_target_plan_slug,
        'target_plan_name', v_target_plan_name,
        'target_price', v_target_price,
        
        -- Suscripción actual
        'subscription_id', v_subscription_id,
        'billing_period', v_billing_period,
        'expires_at', v_expires_at,
        'subscription_amount', v_subscription_amount,
        
        -- Prorrateo
        'days_remaining', v_days_remaining,
        'period_total_days', v_period_total_days,
        'credit', v_credit,
        'upgrade_price', v_upgrade_price
    );
END;
$function$
```
</details>

### `get_user()` 🔐

- **Returns**: json
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.get_user()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.get_user();
$function$
```
</details>

### `handle_import_batch_member_id()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_import_batch_member_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN RETURN NEW; END IF;

    -- Resolver member_id: auth.uid() -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid 
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.member_id := resolved_member_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `handle_updated_by()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    -- Si no hay usuario logueado (ej. seeders o sistema), no hacemos nada
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;
    -- Buscamos el ID del miembro dentro de la organización
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id
    LIMIT 1;
    -- Si encontramos al miembro, sellamos el registro
    IF resolved_member_id IS NOT NULL THEN
        -- Si es INSERT, llenamos el creador
        IF (TG_OP = 'INSERT') THEN
            NEW.created_by := resolved_member_id;
        END IF;
        -- SIEMPRE actualizamos el editor
        NEW.updated_by := resolved_member_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `has_permission(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.has_permission(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.has_permission(p_organization_id, p_permission_key);
$function$
```
</details>

### `increment_recipe_usage()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.increment_recipe_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    update task_recipes
    set 
        usage_count = usage_count + 1,
        updated_at = now()
    where id = new.recipe_id;
    
    return new;
end;
$function$
```
</details>

### `is_admin()` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_admin();
$function$
```
</details>

### `is_demo_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_demo_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_demo_org(p_organization_id);
$function$
```
</details>

### `is_external_actor(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_external_actor(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_external_actor(p_organization_id);
$function$
```
</details>

### `is_org_member(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_org_member(p_organization_id);
$function$
```
</details>

### `is_self(p_user_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_self(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_self(p_user_id);
$function$
```
</details>

### `is_system_row(p_is_system boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_system_row(p_is_system boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.is_system_row(p_is_system);
$function$
```
</details>

### `lock_org_task_on_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.lock_org_task_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- organization_id es inmutable
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable';
  end if;

  -- task_id es inmutable
  if new.task_id is distinct from old.task_id then
    raise exception 'task_id is immutable';
  end if;

  return new;
end;
$function$
```
</details>

### `quote_item_set_default_sort_key()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.quote_item_set_default_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.sort_key IS NULL OR NEW.sort_key = 0 THEN
        SELECT COALESCE(MAX(sort_key), 0) + 1 INTO NEW.sort_key
        FROM public.quote_items
        WHERE quote_id = NEW.quote_id;
    END IF;
    RETURN NEW;
END;
$function$
```
</details>

### `recalculate_po_totals()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.recalculate_po_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE material_purchase_orders
    SET subtotal = COALESCE((
        SELECT SUM(quantity * COALESCE(unit_price, 0))
        FROM material_purchase_order_items
        WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ), 0),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
```
</details>

### `recalculate_recipe_rating()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.recalculate_recipe_rating()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    update task_recipes
    set 
        rating_avg = (
            select round(avg(rating)::numeric, 2)
            from task_recipe_ratings
            where recipe_id = coalesce(new.recipe_id, old.recipe_id)
        ),
        rating_count = (
            select count(*)
            from task_recipe_ratings
            where recipe_id = coalesce(new.recipe_id, old.recipe_id)
        ),
        updated_at = now()
    where id = coalesce(new.recipe_id, old.recipe_id);
    
    return coalesce(new, old);
end;
$function$
```
</details>

### `refresh_labor_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_labor_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  refresh materialized view public.labor_avg_prices;
end;
$function$
```
</details>

### `refresh_material_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_material_avg_prices()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  refresh materialized view public.material_avg_prices;
end;
$function$
```
</details>

### `refresh_product_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.refresh_product_avg_prices()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$refresh materialized view concurrently public.product_avg_prices;$function$
```
</details>
