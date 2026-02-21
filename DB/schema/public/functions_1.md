# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Functions (chunk 1: analytics_track_navigation — external_has_scope)

### `analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN RETURN; END IF;

    -- A. Cerrar vista anterior de ESTA sesión
    UPDATE public.user_view_history
    SET
        exited_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - entered_at))::integer
    WHERE user_id = v_user_id
      AND session_id = p_session_id
      AND exited_at IS NULL;

    -- B. Abrir nueva vista
    INSERT INTO public.user_view_history (
        user_id, organization_id, session_id, view_name, entered_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, p_view_name, now()
    );

    -- C. Actualizar Presencia en tiempo real
    INSERT INTO public.user_presence (
        user_id, organization_id, session_id, last_seen_at, current_view, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), p_view_name, 'online', 'navigation', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        current_view = EXCLUDED.current_view,
        status = 'online',
        updated_at = now();
END;
$function$
```
</details>

### `assert_project_is_active(p_project_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.assert_project_is_active(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM projects
        WHERE id = p_project_id
          AND status = 'active'
          AND is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Project is not active. Mutations are blocked.'
            USING ERRCODE = 'P0001';
    END IF;
END;
$function$
```
</details>

### `assign_default_permissions_to_org_roles(p_organization_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.assign_default_permissions_to_org_roles(p_organization_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.assign_default_permissions_to_org_roles(p_organization_id);
$function$
```
</details>

### `audit_subcontract_payments()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.audit_subcontract_payments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
    subcontract_name text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD; audit_action := 'delete_subcontract_payment';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (NEW.status = 'void' AND OLD.status != 'void') THEN
            audit_action := 'void_subcontract_payment';
        ELSE
            audit_action := 'update_subcontract_payment';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW; audit_action := 'create_subcontract_payment';
        resolved_member_id := NEW.created_by;
    END IF;

    -- NUEVO: Obtener nombre del subcontrato relacionado
    SELECT name INTO subcontract_name 
    FROM public.subcontracts 
    WHERE id = target_record.subcontract_id;

    -- Incluir name en metadata
    audit_metadata := jsonb_build_object(
        'name', COALESCE(subcontract_name, 'Pago'),
        'amount', target_record.amount, 
        'currency', target_record.currency_id
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'subcontract_payments', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$
```
</details>

### `budget_item_move(p_budget_id uuid, p_item_id uuid, p_prev_item_id uuid, p_next_item_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.budget_item_move(p_budget_id uuid, p_item_id uuid, p_prev_item_id uuid, p_next_item_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_prev numeric(18,6);
  v_next numeric(18,6);
  v_new  numeric(18,6);
begin
  -- Seguridad: el caller debe ser miembro de la organización del presupuesto
  perform 1
  from public.budgets b
  join public.budget_items bi
    on bi.id = p_item_id
   and bi.budget_id = b.id
  where b.id = p_budget_id
    and public.is_org_member(b.organization_id);

  if not found then
    raise exception 'No autorizado o item/budget inválido';
  end if;

  -- Obtener sort_key anterior
  if p_prev_item_id is not null then
    select sort_key
    into v_prev
    from public.budget_items
    where id = p_prev_item_id
      and budget_id = p_budget_id;
  end if;

  -- Obtener sort_key siguiente
  if p_next_item_id is not null then
    select sort_key
    into v_next
    from public.budget_items
    where id = p_next_item_id
      and budget_id = p_budget_id;
  end if;

  -- Cálculo del nuevo sort_key
  if p_prev_item_id is null and p_next_item_id is null then
    -- mover al final
    select coalesce(max(sort_key), 0) + 1000
    into v_new
    from public.budget_items
    where budget_id = p_budget_id;

  elsif p_prev_item_id is null then
    -- mover al principio
    select coalesce(min(sort_key), 0) - 1000
    into v_new
    from public.budget_items
    where budget_id = p_budget_id;

  elsif p_next_item_id is null then
    -- mover al final
    select coalesce(max(sort_key), 0) + 1000
    into v_new
    from public.budget_items
    where budget_id = p_budget_id;

  else
    -- entre dos
    v_new := (v_prev + v_next) / 2.0;

    -- si quedaron demasiado cerca, renormalizamos
    if v_next - v_prev < 0.001 then
      with ranked as (
        select
          id,
          row_number() over (order by sort_key) as rn
        from public.budget_items
        where budget_id = p_budget_id
      )
      update public.budget_items bi
      set sort_key = r.rn * 1000
      from ranked r
      where r.id = bi.id;

      -- recalcular y promediar nuevamente
      select sort_key
      into v_prev
      from public.budget_items
      where id = p_prev_item_id;

      select sort_key
      into v_next
      from public.budget_items
      where id = p_next_item_id;

      v_new := (v_prev + v_next) / 2.0;
    end if;
  end if;

  -- Aplicar nuevo orden
  update public.budget_items
  set sort_key = v_new
  where id = p_item_id
    and budget_id = p_budget_id;
end;
$function$
```
</details>

### `budget_item_set_default_sort_key()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.budget_item_set_default_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_max numeric(18,6);
begin
  -- Si no viene sort_key definido, asignar uno al final
  if new.sort_key = 0 then
    select coalesce(max(sort_key), 0)
    into v_max
    from public.budget_items
    where budget_id = new.budget_id;

    -- dejamos huecos para futuros reordenamientos
    new.sort_key := v_max + 1000;
  end if;

  return new;
end;
$function$
```
</details>

### `can_mutate_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_mutate_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_mutate_org(p_organization_id, p_permission_key);
$function$
```
</details>

### `can_mutate_project(p_project_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_mutate_project(p_project_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_mutate_project(p_project_id, p_permission_key);
$function$
```
</details>

### `can_view_client_data(p_project_id uuid, p_client_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_client_data(p_project_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT iam.can_view_client_data(p_project_id, p_client_id);
$function$
```
</details>

### `can_view_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_org(p_organization_id);
$function$
```
</details>

### `can_view_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_org(p_organization_id, p_permission_key);
$function$
```
</details>

### `can_view_project(p_project_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.can_view_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.can_view_project(p_project_id);
$function$
```
</details>

### `check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: json
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'billing'
AS $function$
DECLARE
    v_current_count INT;
    v_max_allowed INT;
    v_plan_features JSONB;
BEGIN
    SELECT COUNT(*)
    INTO v_current_count
    FROM public.projects
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND is_deleted = false
      AND (p_excluded_project_id IS NULL OR id != p_excluded_project_id);

    SELECT p.features
    INTO v_plan_features
    FROM public.organizations o
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

### `cleanup_media_file_storage()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.cleanup_media_file_storage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Placeholder intencional:
  -- La eliminación física del archivo se maneja desde el backend (Node / Edge Functions).
  -- Este trigger solo marca el evento de borrado.

  return old;
end;
$function$
```
</details>

### `create_construction_task_material_snapshot()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.create_construction_task_material_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only create snapshot if recipe_id is set
    IF NEW.recipe_id IS NOT NULL THEN
        INSERT INTO construction_task_material_snapshots (
            construction_task_id,
            material_id,
            quantity_planned,
            amount_per_unit,
            unit_id,
            source_task_id,
            organization_id,
            project_id,
            snapshot_at
        )
        SELECT
            NEW.id,
            trm.material_id,
            (COALESCE(NEW.quantity, 0) * COALESCE(trm.amount, 0))::NUMERIC(20, 4),
            trm.amount,
            m.unit_id,
            NEW.task_id,
            NEW.organization_id,
            NEW.project_id,
            NOW()
        FROM task_recipe_materials trm
        INNER JOIN materials m ON m.id = trm.material_id
        WHERE trm.recipe_id = NEW.recipe_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `current_user_id()` 🔐

- **Returns**: uuid
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.current_user_id();
$function$
```
</details>

### `dismiss_home_banner()` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.dismiss_home_banner()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.dismiss_home_banner();
$function$
```
</details>

### `documents_validate_project_org()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.documents_validate_project_org()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  proj_org uuid;
begin
  -- Validar que el proyecto pertenezca a la organización
  if new.project_id is not null then
    select p.organization_id
    into proj_org
    from public.projects p
    where p.id = new.project_id;

    if proj_org is null or proj_org <> new.organization_id then
      raise exception 'El proyecto no pertenece a la organización.';
    end if;
  end if;

  return new;
end;
$function$
```
</details>

### `ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.ensure_contact_for_user(p_organization_id, p_user_id);
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
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT iam.external_has_scope(p_organization_id, p_permission_key);
$function$
```
</details>
