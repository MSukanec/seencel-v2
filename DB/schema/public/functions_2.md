# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 2: fn_financial_kpi_summary — is_org_member)

### `fn_financial_kpi_summary(p_org_id uuid, p_project_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: TABLE(income numeric, expenses numeric, balance numeric, currency_symbol text, currency_code text)
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.fn_financial_kpi_summary(p_org_id uuid, p_project_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(income numeric, expenses numeric, balance numeric, currency_symbol text, currency_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_func_currency_id UUID;
    v_symbol TEXT := '$';
    v_code TEXT := 'ARS';
BEGIN
    -- 1. Get functional currency
    SELECT op.functional_currency_id 
    INTO v_func_currency_id
    FROM organization_preferences op
    WHERE op.organization_id = p_org_id;
    
    IF v_func_currency_id IS NOT NULL THEN
        SELECT c.symbol, c.code 
        INTO v_symbol, v_code
        FROM currencies c
        WHERE c.id = v_func_currency_id;
    END IF;

    -- 2. Calculate income/expenses in one pass
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN m.amount_sign = 1 THEN m.functional_amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN m.amount_sign = -1 THEN m.functional_amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN m.amount_sign = 1 THEN m.functional_amount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN m.amount_sign = -1 THEN m.functional_amount ELSE 0 END), 0) AS balance,
        v_symbol AS currency_symbol,
        v_code AS currency_code
    FROM unified_financial_movements_view m
    WHERE m.organization_id = p_org_id
      AND m.amount_sign != 0
      AND (p_project_id IS NULL OR m.project_id = p_project_id);
END;
$function$
```
</details>

### `fn_storage_overview(p_org_id uuid)` 🔐

- **Returns**: TABLE(total_bytes bigint, file_count bigint, folder_count bigint, max_storage_mb integer, by_type jsonb)
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.fn_storage_overview(p_org_id uuid)
 RETURNS TABLE(total_bytes bigint, file_count bigint, folder_count bigint, max_storage_mb integer, by_type jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_plan_id UUID;
    v_max_storage INT := 500;
BEGIN
    -- 1. Get plan storage limit
    SELECT o.plan_id INTO v_plan_id
    FROM organizations o
    WHERE o.id = p_org_id;
    
    IF v_plan_id IS NOT NULL THEN
        SELECT pf.max_storage_mb INTO v_max_storage
        FROM plan_features pf
        WHERE pf.plan_id = v_plan_id;
    END IF;

    -- 2. Single aggregation query
    RETURN QUERY
    WITH file_stats AS (
        SELECT 
            COALESCE(SUM(mf.file_size), 0)::BIGINT AS total_bytes,
            COUNT(*)::BIGINT AS file_count,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'type', COALESCE(mf.file_type, 'other'),
                        'count', type_count,
                        'bytes', type_bytes
                    )
                ) FILTER (WHERE type_count IS NOT NULL),
                '[]'::JSONB
            ) AS by_type
        FROM (
            SELECT 
                COALESCE(file_type, 'other') AS file_type,
                file_size,
                COUNT(*) OVER (PARTITION BY COALESCE(file_type, 'other')) AS type_count,
                SUM(file_size) OVER (PARTITION BY COALESCE(file_type, 'other')) AS type_bytes
            FROM media_files
            WHERE organization_id = p_org_id
              AND is_deleted = false
        ) mf
    ),
    folder_stats AS (
        SELECT COUNT(*)::BIGINT AS folder_count
        FROM media_file_folders
        WHERE organization_id = p_org_id
    ),
    type_breakdown AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'type', ft.file_type,
                    'count', ft.cnt,
                    'bytes', ft.total
                )
                ORDER BY ft.total DESC
            ) AS by_type
        FROM (
            SELECT 
                COALESCE(file_type, 'other') AS file_type,
                COUNT(*) AS cnt,
                COALESCE(SUM(file_size), 0) AS total
            FROM media_files
            WHERE organization_id = p_org_id
              AND is_deleted = false
            GROUP BY COALESCE(file_type, 'other')
        ) ft
    )
    SELECT 
        COALESCE((SELECT SUM(mf.file_size) FROM media_files mf WHERE mf.organization_id = p_org_id AND mf.is_deleted = false), 0)::BIGINT,
        (SELECT COUNT(*) FROM media_files mf WHERE mf.organization_id = p_org_id AND mf.is_deleted = false)::BIGINT,
        fs.folder_count,
        v_max_storage,
        COALESCE(tb.by_type, '[]'::JSONB)
    FROM folder_stats fs
    CROSS JOIN type_breakdown tb;
END;
$function$
```
</details>

### `generate_next_document_group_name(p_folder_id uuid)` 🔐

- **Returns**: text
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.generate_next_document_group_name(p_folder_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  latest_name text;
  latest_version int := 0;
  next_name text;
begin
  -- Buscar la última versión existente (vN)
  select d.name
  into latest_name
  from public.design_document_groups d
  where d.folder_id = p_folder_id
    and d.name ~ '^v[0-9]+$'
  order by cast(substring(d.name from 2) as int) desc
  limit 1;

  -- Extraer número de versión
  if latest_name is not null then
    latest_version := cast(substring(latest_name from 2) as int);
  end if;

  -- Generar siguiente nombre
  next_name := 'v' || (latest_version + 1);
  return next_name;
end;
$function$
```
</details>

### `generate_po_order_number()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.generate_po_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_count INTEGER;
    v_year TEXT;
BEGIN
    IF NEW.order_number IS NULL THEN
        v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
        
        SELECT COUNT(*) + 1 INTO v_count
        FROM material_purchase_orders
        WHERE organization_id = NEW.organization_id
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
        
        NEW.order_number := 'PO-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

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
    JOIN public.users u ON u.id = om.user_id
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

### `handle_new_external_actor_contact()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_new_external_actor_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.ensure_contact_for_user(new.organization_id, new.user_id);
  return new;
end;
$function$
```
</details>

### `handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.handle_new_organization(p_user_id, p_organization_name, p_business_mode);
$function$
```
</details>

### `handle_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$ BEGIN RETURN iam.handle_new_user(); END; $function$
```
</details>

### `handle_registered_invitation()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_registered_invitation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
begin
  if new.user_id is not null then
    perform iam.ensure_contact_for_user(new.organization_id, new.user_id);
  end if;
  return new;
end;
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
    JOIN public.users u ON u.id = om.user_id
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

### `heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_auth_id uuid;
    v_user_id uuid;
BEGIN
    -- Auth check
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = v_auth_id LIMIT 1;
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not provisioned'; END IF;

    -- Upsert presencia
    INSERT INTO public.user_presence (
        user_id, organization_id, session_id, last_seen_at, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), COALESCE(p_status, 'online'), 'heartbeat', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        status = EXCLUDED.status,
        updated_at = now();

    -- Actualizar duración de la sesión actual (si existe)
    IF p_session_id IS NOT NULL THEN
        UPDATE public.user_view_history
        SET
            exited_at = now(),
            duration_seconds = EXTRACT(EPOCH FROM (now() - entered_at))::integer
        WHERE user_id = v_user_id
          AND session_id = p_session_id
          AND exited_at IS NULL;
    END IF;
END;
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
