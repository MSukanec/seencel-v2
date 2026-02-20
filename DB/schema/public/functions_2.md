# Database Schema (Auto-generated)
> Generated: 2026-02-20T14:40:38.399Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 2: ensure_contact_for_user — handle_payment_subscription_success)

### `ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user record;
  v_user_data record;
  v_contact_id uuid;
  v_first_name text;
  v_last_name text;
begin
  -- Obtener datos del usuario
  select u.id, u.full_name, u.email, u.avatar_url
  into v_user
  from public.users u
  where u.id = p_user_id
  limit 1;

  -- Si no hay usuario, no hacer nada
  if v_user.id is null then
    return null;
  end if;

  -- Si no hay email, no intentamos vincular
  if v_user.email is null then
    return null;
  end if;

  -- Obtener first_name/last_name de user_data (si existe)
  select ud.first_name, ud.last_name
  into v_user_data
  from public.user_data ud
  where ud.user_id = p_user_id
  limit 1;

  -- Resolver first_name y last_name
  -- Prioridad: user_data > split de full_name
  if v_user_data.first_name is not null then
    v_first_name := v_user_data.first_name;
    v_last_name := coalesce(v_user_data.last_name, '');
  elsif v_user.full_name is not null then
    -- Fallback: split full_name por el primer espacio
    v_first_name := split_part(v_user.full_name, ' ', 1);
    v_last_name := nullif(trim(substring(v_user.full_name from position(' ' in v_user.full_name) + 1)), '');
  end if;

  -- 1) ¿Ya existe un contacto vinculado a este user en esta org?
  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id = v_user.id
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    -- Ya existe: actualizar datos que puedan estar faltando
    update public.contacts c
    set
      first_name = coalesce(c.first_name, v_first_name),
      last_name  = coalesce(c.last_name, v_last_name),
      image_url  = coalesce(c.image_url, v_user.avatar_url),
      full_name  = coalesce(v_user.full_name, c.full_name),
      email      = coalesce(v_user.email, c.email),
      updated_at = now()
    where c.id = v_contact_id
      and (c.first_name is null or c.image_url is null);

    return v_contact_id;
  end if;

  -- 2) ¿Existe un contacto local (sin linked_user_id) que coincida por email?
  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id is null
    and lower(c.email) = lower(v_user.email)
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    -- Promover contacto local a vinculado
    update public.contacts c
    set
      linked_user_id = v_user.id,
      full_name      = coalesce(v_user.full_name, c.full_name),
      first_name     = coalesce(c.first_name, v_first_name),
      last_name      = coalesce(c.last_name, v_last_name),
      email          = coalesce(v_user.email, c.email),
      image_url      = coalesce(c.image_url, v_user.avatar_url),
      updated_at     = now()
    where c.id = v_contact_id;

    return v_contact_id;
  end if;

  -- 3) Crear nuevo contacto vinculado
  insert into public.contacts (
    organization_id,
    linked_user_id,
    full_name,
    first_name,
    last_name,
    email,
    image_url,
    contact_type,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    v_user.id,
    v_user.full_name,
    v_first_name,
    v_last_name,
    v_user.email,
    v_user.avatar_url,
    'person',
    now(),
    now()
  )
  returning id into v_contact_id;

  return v_contact_id;
end;
$function$
```
</details>

### `external_has_scope(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.external_has_scope(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM organization_external_actors ea
    JOIN external_actor_scopes eas ON eas.external_actor_id = ea.id
    WHERE ea.organization_id = p_organization_id
      AND ea.user_id = current_user_id()
      AND ea.is_active = true
      AND ea.is_deleted = false
      AND eas.permission_key = p_permission_key
  );
$function$
```
</details>

### `fill_progress_user_id_from_auth()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.fill_progress_user_id_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  -- Si ya viene user_id, no tocar
  if new.user_id is not null then
    return new;
  end if;

  -- Resolver user_id desde auth.uid()
  select u.id
  into v_user_id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;

  -- Si no existe usuario asociado al auth.uid(), error
  if v_user_id is null then
    raise exception 'No existe users.id para el auth.uid() actual';
  end if;

  -- Completar user_id automáticamente
  new.user_id := v_user_id;

  return new;
end;
$function$
```
</details>

### `fill_user_data_user_id_from_auth()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.fill_user_data_user_id_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  -- Si ya viene user_id, no tocar
  if new.user_id is not null then
    return new;
  end if;

  -- Resolver user_id desde auth.uid()
  select u.id
  into v_user_id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;

  -- Si no existe usuario asociado al auth.uid(), error
  if v_user_id is null then
    raise exception 'No existe users.id para el auth.uid() actual';
  end if;

  -- Completar user_id automáticamente
  new.user_id := v_user_id;

  return new;
end;
$function$
```
</details>

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

### `forbid_user_id_change()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.forbid_user_id_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Impedir cambios de user_id luego de creado
  if tg_op = 'UPDATE'
     and new.user_id is distinct from old.user_id then
    raise exception 'user_id no puede modificarse una vez creado';
  end if;

  return new;
end;
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
 SET search_path TO 'public', 'iam'
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
    -- Obtener configuración del plan
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1),
        COALESCE((p.features->>'max_members')::integer, 999),
        COALESCE(p.monthly_amount, 0),
        COALESCE(p.annual_amount, 0),
        p.slug
    INTO v_seats_included, v_max_members, v_plan_price_monthly, v_plan_price_annual, v_plan_slug
    FROM public.organizations o
    JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    SELECT COALESCE(purchased_seats, 0)
    INTO v_purchased_seats
    FROM public.organizations
    WHERE id = p_organization_id;

    SELECT COUNT(*)
    INTO v_current_members
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND is_active = true;

    -- Contar invitaciones pendientes (ocupan seat) → usa iam directamente
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
    FROM public.organization_subscriptions s
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
        'prorated_price', CASE 
            WHEN v_billing_period = 'monthly' THEN v_prorated_price_monthly
            ELSE v_prorated_price_annual
        END
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
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  current_user_auth_id uuid;
  current_user_internal_id uuid;
  result json;
begin
  -- Obtener auth.uid()
  current_user_auth_id := auth.uid();

  -- Si no hay usuario autenticado, retornar NULL
  if current_user_auth_id is null then
    return null;
  end if;

  -- Obtener users.id
  select u.id
  into current_user_internal_id
  from public.users u
  where u.auth_id = current_user_auth_id
  limit 1;

  if current_user_internal_id is null then
    return null;
  end if;

  with
  -- Organización activa + plan + preferencias
  active_org as (
    select
      o.id, o.name, o.is_active, o.is_system, o.created_by, o.created_at, o.updated_at,
      o.owner_id,
      p.id as plan_id, p.name as plan_name, p.slug as plan_slug, p.features as plan_features,
      p.monthly_amount as plan_monthly_amount,
      p.annual_amount as plan_annual_amount,
      p.billing_type as plan_billing_type,
      op.default_currency_id,
      op.default_wallet_id,
      op.default_pdf_template_id,
      op.use_currency_exchange,
      op.created_at as op_created_at,
      op.updated_at as op_updated_at,
      uop.last_project_id,
      om.role_id
    from public.user_preferences up
    join public.organizations o on o.id = up.last_organization_id
    left join public.plans p on p.id = o.plan_id
    left join public.organization_preferences op on op.organization_id = o.id
    left join public.user_organization_preferences uop
      on uop.user_id = up.user_id
     and uop.organization_id = o.id
    join public.organization_members om
      on om.organization_id = o.id
     and om.user_id = up.user_id
     and om.is_active = true
    where up.user_id = current_user_internal_id
  ),

  -- Rol y permisos activos
  active_role_permissions as (
    select
      r.id as role_id,
      r.name as role_name,
      json_agg(
        json_build_object(
          'id', perm.id,
          'key', perm.key,
          'description', perm.description,
          'category', perm.category
        )
      ) filter (where perm.id is not null) as permissions
    from active_org ao
    join public.roles r on r.id = ao.role_id
    left join public.role_permissions rp on rp.role_id = r.id
    left join public.permissions perm on perm.id = rp.permission_id
    group by r.id, r.name
  ),

  -- Membresías activas
  user_memberships as (
    select json_agg(
      json_build_object(
        'organization_id', om.organization_id,
        'organization_name', org.name,
        'is_active', om.is_active,
        'joined_at', om.joined_at,
        'last_active_at', om.last_active_at,
        'role', json_build_object(
          'id', r.id,
          'name', r.name
        )
      )
    ) as memberships
    from public.organization_members om
    join public.organizations org on org.id = om.organization_id
    join public.roles r on r.id = om.role_id
    where om.user_id = current_user_internal_id
      and om.is_active = true
  ),

  -- Organizaciones del usuario
  user_organizations as (
    select json_agg(
      json_build_object(
        'id', org.id,
        'name', org.name,
        'created_at', org.created_at,
        'is_active', org.is_active,
        'is_system', org.is_system,
        'plan', case when p.id is not null then json_build_object(
          'id', p.id,
          'name', p.name,
          'slug', p.slug,
          'features', p.features,
          'monthly_amount', p.monthly_amount,
          'annual_amount', p.annual_amount,
          'billing_type', p.billing_type
        ) else null end,
        'owner_id', org.owner_id
      )
    ) as organizations
    from public.organization_members om
    join public.organizations org on org.id = om.organization_id
    left join public.plans p on p.id = org.plan_id
    where om.user_id = current_user_internal_id
      and om.is_active = true
  )

  select json_build_object(
    'user', json_build_object(
      'id', u.id,
      'auth_id', u.auth_id,
      'email', u.email,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'avatar_source', u.avatar_source,
      'created_at', u.created_at
    ),
    'user_data', case when ud.id is not null then json_build_object(
      'id', ud.id,
      'user_id', ud.user_id,
      'first_name', ud.first_name,
      'last_name', ud.last_name,
      'country', ud.country,
      'birthdate', ud.birthdate,
      'phone_e164', ud.phone_e164,
      'created_at', ud.created_at,
      'updated_at', ud.updated_at
    ) else null end,
    'preferences', case when up.id is not null then json_build_object(
      'id', up.id,
      'user_id', up.user_id,
      'theme', up.theme,
      'sidebar_docked', up.sidebar_docked,
      'last_organization_id', up.last_organization_id,
      'last_project_id', ao.last_project_id,
      'last_user_type', up.last_user_type,
      'onboarding_completed', up.onboarding_completed,
      'layout', up.layout,
      'language', up.language, -- <--- NUEVO CAMPO AGREGADO
      'created_at', up.created_at,
      'updated_at', up.updated_at
    ) else null end,
    'organization', case when ao.id is not null then json_build_object(
      'id', ao.id,
      'name', ao.name,
      'is_active', ao.is_active,
      'is_system', ao.is_system,
      'created_by', ao.created_by,
      'owner_id', ao.owner_id,
      'created_at', ao.created_at,
      'updated_at', ao.updated_at,
      'plan', case when ao.plan_id is not null then json_build_object(
        'id', ao.plan_id,
        'name', ao.plan_name,
        'slug', ao.plan_slug,
        'features', ao.plan_features,
        'monthly_amount', ao.plan_monthly_amount,
        'annual_amount', ao.plan_annual_amount,
        'billing_type', ao.plan_billing_type
      ) else null end,
      'preferences', case when ao.default_currency_id is not null then json_build_object(
        'organization_id', ao.id,
        'default_currency', ao.default_currency_id,
        'default_wallet', ao.default_wallet_id,
        'pdf_template', ao.default_pdf_template_id,
        'use_currency_exchange', ao.use_currency_exchange,
        'created_at', ao.op_created_at,
        'updated_at', ao.op_updated_at
      ) else null end
    ) else null end,
    'role', case when arp.role_id is not null then json_build_object(
      'id', arp.role_id,
      'name', arp.role_name,
      'permissions', coalesce(arp.permissions, '[]'::json)
    ) else null end,
    'organizations', coalesce(uo.organizations, '[]'::json),
    'memberships', coalesce(um.memberships, '[]'::json)
  )
  into result
  from public.users u
  left join public.user_data ud on ud.user_id = u.id
  left join public.user_preferences up on up.user_id = u.id
  left join active_org ao on ao.id = up.last_organization_id
  left join active_role_permissions arp on arp.role_id = ao.role_id
  cross join user_memberships um
  cross join user_organizations uo
  where u.id = current_user_internal_id;

  return result;
end;
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
    FROM public.organization_members om
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

### `handle_member_seat_purchase(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_member_seat_purchase(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    v_payment_id uuid;
    v_step text := 'start';
BEGIN
    -- ============================================================
    -- 1) Idempotencia fuerte
    -- ============================================================
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    -- ============================================================
    -- 2) Registrar pago
    -- ============================================================
    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider,
        p_provider_payment_id,
        p_user_id,
        p_organization_id,
        'seat_purchase',  -- product_type
        p_plan_id,
        NULL,             -- course_id
        p_amount,
        p_currency,
        p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    -- ============================================================
    -- 3) Incrementar seats disponibles
    -- ============================================================
    v_step := 'increment_seats';
    PERFORM public.step_organization_increment_seats(
        p_organization_id,
        p_seats_purchased
    );

    -- ============================================================
    -- 4) Registrar evento de compra
    -- ============================================================
    v_step := 'log_event';
    PERFORM public.step_log_seat_purchase_event(
        p_organization_id,
        p_user_id,
        p_seats_purchased,
        p_amount,
        p_currency,
        v_payment_id,
        true  -- prorated
    );

    -- ============================================================
    -- 5) Email de confirmación
    -- ============================================================
    v_step := 'send_email';
    PERFORM public.step_send_purchase_email(
        p_user_id,
        'seat_purchase',
        p_seats_purchased || ' asiento(s) adicional(es)',
        p_amount,
        p_currency,
        v_payment_id,
        p_provider
    );

    -- ============================================================
    -- OK
    -- ============================================================
    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM public.log_system_error(
        'payment',
        'seat_purchase',
        'handle_member_seat_purchase',
        SQLERRM,
        jsonb_build_object(
            'step', v_step,
            'provider', p_provider,
            'provider_payment_id', p_provider_payment_id,
            'organization_id', p_organization_id,
            'seats', p_seats_purchased,
            'amount', p_amount
        ),
        'critical'
    );

    RETURN jsonb_build_object(
        'status', 'ok_with_warning',
        'payment_id', v_payment_id,
        'warning_step', v_step
    );
END;$function$
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

### `handle_new_org_member_contact()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_new_org_member_contact()
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
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_admin_role_id uuid;
  v_recent_count integer;

  -- Defaults
  v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
  v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
  v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
  v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN

  ----------------------------------------------------------------
  -- 🛡️ GUARD: Rate limit - Max 3 orgs per hour per user
  ----------------------------------------------------------------
  SELECT count(*)
  INTO v_recent_count
  FROM public.organizations
  WHERE created_by = p_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
      USING ERRCODE = 'P0001';
  END IF;

  ----------------------------------------------------------------
  -- 1) Crear organización (now with business_mode)
  ----------------------------------------------------------------
  v_org_id := public.step_create_organization(
    p_user_id,
    p_organization_name,
    v_plan_free_id,
    p_business_mode
  );

  ----------------------------------------------------------------
  -- 2) Organization data
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_data(v_org_id);

  ----------------------------------------------------------------
  -- 3) Roles base de la organización
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_roles(v_org_id);

  ----------------------------------------------------------------
  -- 4) Obtener rol Administrador
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = v_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  ----------------------------------------------------------------
  -- 5) Agregar usuario como Admin
  ----------------------------------------------------------------
  PERFORM public.step_add_org_member(
    p_user_id,
    v_org_id,
    v_admin_role_id
  );

  ----------------------------------------------------------------
  -- 6) Asignar permisos a roles
  ----------------------------------------------------------------
  PERFORM public.step_assign_org_role_permissions(v_org_id);

  ----------------------------------------------------------------
  -- 7) Monedas
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_currencies(
    v_org_id,
    v_default_currency_id
  );

  ----------------------------------------------------------------
  -- 8) Billeteras
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_wallets(
    v_org_id,
    v_default_wallet_id
  );

  ----------------------------------------------------------------
  -- 9) Organization preferences
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_preferences(
    v_org_id,
    v_default_currency_id,
    v_default_wallet_id,
    v_default_pdf_template_id
  );

  ----------------------------------------------------------------
  -- 10) Setear como organización activa
  ----------------------------------------------------------------
  UPDATE public.user_preferences
  SET
    last_organization_id = v_org_id,
    updated_at = now()
  WHERE user_id = p_user_id;

  ----------------------------------------------------------------
  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'handle_new_organization',
      'organization',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'organization_name', p_organization_name,
        'business_mode', p_business_mode
      ),
      'critical'
    );
    RAISE;
END;
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
AS $function$declare
  v_user_id uuid;
  v_avatar_source public.avatar_source_t := 'email';
  v_avatar_url text;
  v_full_name text;
  v_provider text;
begin
  ----------------------------------------------------------------
  -- 🔒 GUARD: evitar doble ejecución del signup
  ----------------------------------------------------------------
  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  ----------------------------------------------------------------
  -- 🧠 Provider real (fuente confiable)
  ----------------------------------------------------------------
  v_provider := coalesce(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  ----------------------------------------------------------------
  -- Avatar source
  ----------------------------------------------------------------
  IF v_provider = 'google' THEN
    v_avatar_source := 'google';
  ELSIF v_provider = 'discord' THEN
    v_avatar_source := 'discord';
  ELSE
    v_avatar_source := 'email';
  END IF;

  ----------------------------------------------------------------
  -- Avatar URL (defensivo)
  ----------------------------------------------------------------
  v_avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  ----------------------------------------------------------------
  -- Full name (defensivo)
  ----------------------------------------------------------------
  v_full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  ----------------------------------------------------------------
  -- 1) User
  ----------------------------------------------------------------
  v_user_id := public.step_create_user(
    NEW.id,
    lower(NEW.email),
    v_full_name,
    v_avatar_url,
    v_avatar_source,
    'e6cc68d2-fc28-421b-8bd3-303326ef91b8'
  );

  ----------------------------------------------------------------
  -- 2) User acquisition (tracking)
  ----------------------------------------------------------------
  PERFORM public.step_create_user_acquisition(
    v_user_id,
    NEW.raw_user_meta_data
  );

  ----------------------------------------------------------------
  -- 3) User data
  ----------------------------------------------------------------
  PERFORM public.step_create_user_data(v_user_id);

  ----------------------------------------------------------------
  -- 4) User preferences (sin org — se asigna después)
  ----------------------------------------------------------------
  PERFORM public.step_create_user_preferences(v_user_id);

  -- signup_completed queda en FALSE (default)
  -- Se marca TRUE cuando el usuario completa el Onboarding 1

  RETURN NEW;

exception
  when others then
    perform public.log_system_error(
      'trigger',
      'handle_new_user',
      'signup',
      sqlerrm,
      jsonb_build_object(
        'auth_id', NEW.id,
        'email', NEW.email
      ),
      'critical'
    );
    raise;
end;$function$
```
</details>

### `handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
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
        v_payment_id,
        p_provider
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
END;$function$
```
</details>

### `handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
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
        v_payment_id,
        p_provider
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
END;$function$
```
</details>
