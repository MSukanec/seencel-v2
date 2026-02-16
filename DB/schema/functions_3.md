# Database Schema (Auto-generated)
> Generated: 2026-02-16T21:47:12.644Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 3: handle_updated_by — log_client_payment_activity)

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
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id -- Funciona perfecto ahora
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

### `handle_updated_by_organizations()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_by_organizations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_uid uuid;
    resolved_member_id uuid;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Resolve Member ID
    -- User must be a member of THIS organization (NEW.id)
    SELECT om.id INTO resolved_member_id
    FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.id -- Key difference: generic uses NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.updated_by := resolved_member_id;
    END IF;

    RETURN NEW;
END;
$function$
```
</details>

### `handle_upgrade_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.handle_upgrade_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_previous_plan_name text;
    v_previous_plan_id uuid;
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
    -- 2) Guardar datos del plan anterior (para metadata y email)
    -- ============================================================
    v_step := 'get_previous_plan';
    SELECT o.plan_id, p.name
    INTO v_previous_plan_id, v_previous_plan_name
    FROM public.organizations o
    LEFT JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    -- ============================================================
    -- 3) Registrar pago
    -- ============================================================
    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider,
        p_provider_payment_id,
        p_user_id,
        p_organization_id,
        'upgrade',
        p_plan_id,
        NULL,
        p_amount,
        p_currency,
        p_metadata || jsonb_build_object(
            'upgrade', true,
            'previous_plan_id', v_previous_plan_id,
            'previous_plan_name', v_previous_plan_name
        )
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_processed'
        );
    END IF;

    -- ============================================================
    -- 4) Expirar suscripción anterior (PRO)
    -- ============================================================
    v_step := 'expire_previous_subscription';
    PERFORM public.step_subscription_expire_previous(
        p_organization_id
    );

    -- ============================================================
    -- 5) Crear nueva suscripción activa (TEAMS)
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
    -- 6) Actualizar plan activo
    -- ============================================================
    v_step := 'set_organization_plan';
    PERFORM public.step_organization_set_plan(
        p_organization_id,
        p_plan_id
    );

    -- ============================================================
    -- 7) Fundadores (solo anual)
    -- ============================================================
    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM public.step_apply_founders_program(
            p_user_id,
            p_organization_id
        );
    END IF;

    -- ============================================================
    -- 8) Email de confirmación de upgrade
    -- ============================================================
    v_step := 'send_purchase_email';
    
    SELECT name INTO v_plan_name
    FROM public.plans
    WHERE id = p_plan_id;
    
    PERFORM public.step_send_purchase_email(
        p_user_id,
        'upgrade',
        'Upgrade a ' || COALESCE(v_plan_name, 'Plan') || ' (' || CASE WHEN p_billing_period = 'annual' THEN 'anual' ELSE 'mensual' END || ')',
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
        'subscription_id', v_subscription_id,
        'previous_plan_id', v_previous_plan_id,
        'previous_plan_name', v_previous_plan_name
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM public.log_system_error(
            'payment',
            'upgrade',
            'handle_upgrade_subscription_success',
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

### `has_permission(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.has_permission(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r
      on r.id = om.role_id
    join public.role_permissions rp
      on rp.role_id = r.id
    join public.permissions p
      on p.id = rp.permission_id
    where om.organization_id = p_organization_id
      and om.user_id = public.current_user_id()
      and om.is_active = true
      and p.key = p_permission_key
  );
$function$
```
</details>

### `heartbeat(p_org_id uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.heartbeat(p_org_id uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_auth_id uuid;
  v_user_id uuid;
begin
  -- Auth check
  v_auth_id := auth.uid();
  if v_auth_id is null then raise exception 'Unauthenticated'; end if;
  
  select u.id into v_user_id from public.users u where u.auth_id = v_auth_id limit 1;
  if v_user_id is null then raise exception 'User not provisioned'; end if;

  -- Upsert con session_id
  insert into public.user_presence (
    user_id, org_id, session_id, last_seen_at, status, updated_from, updated_at
  ) values (
    v_user_id, p_org_id, p_session_id, now(), coalesce(p_status, 'online'), 'heartbeat', now()
  )
  on conflict (user_id) do update set
    org_id = excluded.org_id,
    session_id = excluded.session_id,
    last_seen_at = excluded.last_seen_at,
    status = excluded.status,
    updated_at = now();
    
  -- Actualizar duración de la sesión actual (si existe)
  if p_session_id is not null then
    update public.user_view_history
    set 
      exited_at = now(),
      duration_seconds = extract(epoch from (now() - entered_at))::integer
    where user_id = v_user_id 
      and session_id = p_session_id 
      and exited_at is null;
  end if;
end;
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
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_id = auth.uid()
  );
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
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organizations o
    where o.id = p_organization_id
      and o.is_demo = true
  );
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
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = public.current_user_id()
      and m.is_active = true
  );
$function$
```
</details>

### `is_project_representative(p_project_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.is_project_representative(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM client_representatives cr
    JOIN project_clients pc ON pc.id = cr.client_id
    JOIN contacts c ON c.id = cr.contact_id
    JOIN users u ON u.id = c.linked_user_id
    WHERE pc.project_id = p_project_id
      AND u.auth_id = auth.uid()
      AND cr.is_deleted = false
      AND pc.is_deleted = false
  )
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
 SET search_path TO 'public'
AS $function$
  select p_user_id = public.current_user_id();
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
 SET search_path TO 'public'
AS $function$
  select coalesce(p_is_system, false);
$function$
```
</details>

### `kanban_auto_complete_card()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.kanban_auto_complete_card()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  list_auto_complete boolean;
BEGIN
  SELECT auto_complete INTO list_auto_complete
  FROM kanban_lists
  WHERE id = NEW.list_id;
  
  IF list_auto_complete = true AND NEW.is_completed = false THEN
    NEW.is_completed := true;
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$
```
</details>

### `kanban_set_card_board_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.kanban_set_card_board_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.board_id IS NULL AND NEW.list_id IS NOT NULL THEN
    SELECT board_id INTO NEW.board_id
    FROM kanban_lists
    WHERE id = NEW.list_id;
  END IF;
  RETURN NEW;
END;
$function$
```
</details>

### `kanban_set_updated_at()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.kanban_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
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

### `log_activity(p_organization_id uuid, p_user_id uuid, p_action text, p_target_table text, p_target_id uuid, p_metadata jsonb)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_activity(p_organization_id uuid, p_user_id uuid, p_action text, p_target_table text, p_target_id uuid, p_metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.organization_activity_logs (
    organization_id,
    user_id,
    action,
    target_table,
    target_id,
    metadata,
    created_at
  )
  values (
    p_organization_id,
    p_user_id,
    p_action,
    p_target_table,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  );
end;
$function$
```
</details>

### `log_calendar_event_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_calendar_event_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_calendar_event';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        -- AQUI ESTA EL CAMBIO: Chequeamos deleted_at en vez de is_deleted
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            audit_action := 'delete_calendar_event';
        ELSE
            audit_action := 'update_calendar_event';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_calendar_event';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'title', target_record.title,
        'start_at', target_record.start_at,
        'source_type', target_record.source_type
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id,
            resolved_member_id,
            audit_action,
            target_record.id,
            'calendar_events',
            audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `log_client_commitment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_client_commitment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_commitment'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_commitment'; ELSE audit_action := 'update_commitment'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_commitment'; resolved_member_id := NEW.created_by; END IF;
    audit_metadata := jsonb_build_object('amount', target_record.amount, 'currency_id', target_record.currency_id);
    BEGIN INSERT INTO public.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_commitments', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>

### `log_client_payment_activity()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.log_client_payment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid; audit_action text; audit_metadata jsonb; target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_record := OLD; audit_action := 'delete_payment'; resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN target_record := NEW; 
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN audit_action := 'delete_payment'; ELSE audit_action := 'update_payment'; END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN target_record := NEW; audit_action := 'create_payment'; resolved_member_id := NEW.created_by; END IF;
    audit_metadata := jsonb_build_object('amount', target_record.amount, 'date', target_record.payment_date, 'status', target_record.status);
    BEGIN INSERT INTO public.organization_activity_logs (organization_id, member_id, action, target_id, target_table, metadata)
    VALUES (target_record.organization_id, resolved_member_id, audit_action, target_record.id, 'client_payments', audit_metadata);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    RETURN NULL;
END; $function$
```
</details>
