# Database Schema (Auto-generated)
> Generated: 2026-02-18T21:46:26.792Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 8: recalculate_po_totals — step_create_organization)

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

### `redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.redeem_coupon_universal(p_code text, p_product_type text, p_product_id uuid, p_price numeric, p_currency text DEFAULT 'USD'::text, p_order_id uuid DEFAULT NULL::uuid, p_subscription_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_validation jsonb;
  v_coupon_id uuid;
  v_discount numeric;
  v_existing_id uuid;
BEGIN
  -- ============================================================
  -- 1) Obtener usuario
  -- ============================================================
  v_user_id := public.current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'UNAUTHENTICATED'
    );
  END IF;

  -- ============================================================
  -- 2) Validar cupón usando la función universal
  -- ============================================================
  v_validation := public.validate_coupon_universal(
    p_code,
    p_product_type,
    p_product_id,
    p_price,
    p_currency
  );

  -- Si la validación falla, retornar el error
  IF (v_validation->>'ok')::boolean IS FALSE THEN
    RETURN v_validation;
  END IF;

  -- Extraer datos del cupón validado
  v_coupon_id := (v_validation->>'coupon_id')::uuid;
  v_discount := (v_validation->>'discount')::numeric;

  -- ============================================================
  -- 3) Verificar idempotencia (evitar duplicados)
  -- ============================================================
  SELECT id INTO v_existing_id
  FROM public.coupon_redemptions
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
    -- Ya fue redimido para esta orden/suscripción
    RETURN jsonb_build_object(
      'ok', true,
      'already_redeemed', true,
      'redemption_id', v_existing_id,
      'discount', v_discount,
      'final_price', (v_validation->>'final_price')::numeric
    );
  END IF;

  -- ============================================================
  -- 4) Registrar redención
  -- ============================================================
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    user_id,
    course_id,
    plan_id,
    order_id,
    subscription_id,
    amount_saved,
    currency
  )
  VALUES (
    v_coupon_id,
    v_user_id,
    CASE WHEN p_product_type = 'course' THEN p_product_id ELSE NULL END,
    CASE WHEN p_product_type = 'subscription' THEN p_product_id ELSE NULL END,
    p_order_id,
    p_subscription_id,
    v_discount,
    p_currency
  )
  RETURNING id INTO v_existing_id;

  -- ============================================================
  -- 5) Retornar éxito
  -- ============================================================
  RETURN jsonb_build_object(
    'ok', true,
    'redemption_id', v_existing_id,
    'coupon_id', v_coupon_id,
    'coupon_code', v_validation->>'coupon_code',
    'discount', v_discount,
    'final_price', (v_validation->>'final_price')::numeric,
    'is_free', (v_validation->>'is_free')::boolean
  );
END;
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

### `reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.reset_test_payments_and_subscriptions(p_user_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 🔥 CLAVE ABSOLUTA
  SET CONSTRAINTS ALL DEFERRED;

  -- 1) BORRAR ENROLLMENTS
  DELETE FROM public.course_enrollments
  WHERE user_id = p_user_id;

  -- 2) BORRAR PAGOS
  DELETE FROM public.payments
  WHERE user_id = p_user_id
     OR organization_id = p_organization_id;

  -- 3) BORRAR BILLING CYCLES
  DELETE FROM public.organization_billing_cycles
  WHERE organization_id = p_organization_id;

  -- 4) BORRAR SUBSCRIPTIONS
  DELETE FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  -- 5) RESET ORGANIZATION
  UPDATE public.organizations
  SET
    plan_id = '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2',
    settings = '{}'::jsonb,
    updated_at = now()
  WHERE id = p_organization_id;

  -- 6) LIMPIAR ERRORES
  DELETE FROM public.system_errors
  WHERE context->>'user_id' = p_user_id::text
     OR context->>'organization_id' = p_organization_id::text;
END;
$function$
```
</details>

### `send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_type text, p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_audience text DEFAULT 'direct'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_notification_id uuid;
BEGIN
    -- 1. Insertar la notificación
    INSERT INTO public.notifications (type, title, body, data, audience)
    VALUES (p_type, p_title, p_body, p_data, p_audience)
    RETURNING id INTO v_notification_id;

    -- 2. Distribuir según audiencia
    IF p_audience = 'direct' AND p_user_id IS NOT NULL THEN
        INSERT INTO public.user_notifications (user_id, notification_id)
        VALUES (p_user_id, v_notification_id);
    
    ELSIF p_audience = 'admins' THEN
        -- CORREGIDO: Usar el role_id de admin directamente
        INSERT INTO public.user_notifications (user_id, notification_id)
        SELECT id, v_notification_id
        FROM public.users
        WHERE role_id = 'd5606324-af8d-487e-8c8e-552511fce2a2'::uuid;
        
    END IF;

    RETURN v_notification_id;
END;
$function$
```
</details>

### `set_budget_task_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_budget_task_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Resolver organización desde la tarea
  select t.organization_id
  into new.organization_id
  from public.tasks t
  where t.id = new.task_id;

  -- Si no existe la tarea, es un error lógico
  if new.organization_id is null then
    raise exception
      'No se pudo resolver organization_id para task_id %',
      new.task_id;
  end if;

  return new;
end;
$function$
```
</details>

### `set_task_labor_organization()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_task_labor_organization()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si organization_id es null, heredarlo de la tarea padre
    IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM tasks
        WHERE id = NEW.task_id;
    END IF;
    
    RETURN NEW;
END;
$function$
```
</details>

### `set_task_material_organization()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_task_material_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Resolver organización desde la tarea
  select t.organization_id
  into new.organization_id
  from public.tasks t
  where t.id = new.task_id;

  -- Si no existe la tarea, es un error lógico
  if new.organization_id is null then
    raise exception
      'No se pudo resolver organization_id para task_id %',
      new.task_id;
  end if;

  return new;
end;
$function$
```
</details>

### `set_timestamp()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_timestamp()
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

### `set_updated_at()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
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

### `set_updated_at_ia_user_preferences()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at_ia_user_preferences()
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

### `step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- LOG: función llamada
  insert into public.debug_signup_log(step, payload)
  values (
    'step_add_org_member_called',
    jsonb_build_object(
      'user_id', p_user_id,
      'org_id', p_org_id,
      'role_id', p_role_id
    )
  );

  -- VALIDACIONES DURAS
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id IS NULL';
  END IF;

  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'p_org_id IS NULL';
  END IF;

  IF p_role_id IS NULL THEN
    RAISE EXCEPTION 'p_role_id IS NULL';
  END IF;

  -- INSERT
  INSERT INTO public.organization_members (
    user_id,
    organization_id,
    role_id,
    is_active,
    created_at,
    joined_at
  )
  VALUES (
    p_user_id,
    p_org_id,
    p_role_id,
    true,
    now(),
    now()
  );

  -- LOG: insert ok
  insert into public.debug_signup_log(step, payload)
  values (
    'step_add_org_member_inserted',
    jsonb_build_object(
      'user_id', p_user_id,
      'org_id', p_org_id,
      'role_id', p_role_id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    insert into public.debug_signup_log(step, payload)
    values (
      'step_add_org_member_error',
      jsonb_build_object(
        'error', sqlerrm,
        'user_id', p_user_id,
        'org_id', p_org_id,
        'role_id', p_role_id
      )
    );
    RAISE;
END;
$function$
```
</details>

### `step_apply_founders_program(p_user_id uuid, p_organization_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_apply_founders_program(p_user_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
```
</details>

### `step_assign_org_role_permissions(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- Obtener roles de la organización
  ----------------------------------------------------------------
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false;
    
  SELECT id INTO v_editor_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false;
    
  SELECT id INTO v_viewer_role_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false;

  ----------------------------------------------------------------
  -- ADMIN → todos los permisos system
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_admin_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id
  FROM public.permissions p
  WHERE p.is_system = true;

  ----------------------------------------------------------------
  -- EDITOR
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_editor_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_editor_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'projects.manage',
    'general_costs.view',
    'general_costs.manage',
    'members.view',
    'roles.view',
    'contacts.view',
    'contacts.manage',
    'kanban.view',
    'kanban.manage',
    'clients.view',
    'clients.manage',
    'sitelog.view',
    'sitelog.manage',
    'media.view',
    'media.manage',
    'tasks.view',
    'tasks.manage',
    'quotes.view',
    'quotes.manage',
    'materials.view',
    'materials.manage',
    'calendar.view',
    'calendar.manage',
    'subcontracts.view',
    'subcontracts.manage',
    'labor.view',    -- ADDED
    'labor.manage'   -- ADDED
  );

  ----------------------------------------------------------------
  -- LECTOR
  ----------------------------------------------------------------
  DELETE FROM public.role_permissions
  WHERE role_id = v_viewer_role_id;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id
  FROM public.permissions p
  WHERE p.key IN (
    'projects.view',
    'general_costs.view',
    'members.view',
    'roles.view',
    'contacts.view',
    'kanban.view',
    'clients.view',
    'sitelog.view',
    'media.view',
    'tasks.view',
    'quotes.view',
    'materials.view',
    'calendar.view',
    'subcontracts.view',
    'labor.view'    -- ADDED
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'step_assign_org_role_permissions',
      'permissions',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;$function$
```
</details>

### `step_course_enrollment_annual(p_user_id uuid, p_course_id uuid)`

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_course_enrollment_annual(p_user_id uuid, p_course_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
```
</details>

### `step_create_default_kanban_board(p_org_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_default_kanban_board(p_org_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_board_id uuid := gen_random_uuid();
BEGIN
  -- Deshabilitar triggers temporalmente
  ALTER TABLE public.kanban_boards DISABLE TRIGGER set_updated_by_kanban_boards;
  
  INSERT INTO public.kanban_boards (
    id,
    organization_id,
    project_id,
    name,
    description,
    color,
    position,
    is_archived,
    created_at,
    updated_at,
    created_by,
    updated_by
  )
  VALUES (
    v_board_id,
    p_org_id,
    NULL,
    'Mi Panel',
    'Panel de tareas principal',
    '#6366f1',
    0,
    false,
    now(),
    now(),
    NULL,
    NULL
  );
  
  -- Re-habilitar triggers
  ALTER TABLE public.kanban_boards ENABLE TRIGGER set_updated_by_kanban_boards;

  RETURN v_board_id;
END;
$function$
```
</details>

### `step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.organizations (
    id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id
  )
  VALUES (
    v_org_id, p_org_name, p_owner_id, p_owner_id, now(), now(), true, p_plan_id
  );

  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'owner_id', p_owner_id,
        'org_name', p_org_name,
        'plan_id', p_plan_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>
