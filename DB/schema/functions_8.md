# Database Schema (Auto-generated)
> Generated: 2026-02-17T23:22:11.037Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 8: set_task_material_organization — step_create_user_organization_preferences)

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

### `step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid, p_business_mode text DEFAULT 'professional'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.organizations (
    id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id, business_mode
  )
  VALUES (
    v_org_id, p_org_name, p_owner_id, p_owner_id, now(), now(), true, p_plan_id, p_business_mode
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
        'plan_id', p_plan_id,
        'business_mode', p_business_mode
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.organization_currencies (
    id,
    organization_id,
    currency_id,
    is_active,
    is_default,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_org_id,
    p_currency_id,
    true,
    true,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_currencies',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'currency_id', p_currency_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_organization_data(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_data(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.organization_data (organization_id)
  VALUES (p_org_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_data',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.organization_preferences (
    organization_id, default_currency_id, default_wallet_id, default_pdf_template_id,
    use_currency_exchange, created_at, updated_at
  )
  VALUES (
    p_org_id, p_currency_id, p_wallet_id, p_pdf_template_id,
    false, now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'org_id', p_org_id,
        'currency_id', p_currency_id,
        'wallet_id', p_wallet_id,
        'pdf_template_id', p_pdf_template_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_organization_roles(p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_roles(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$DECLARE
  v_admin_id  uuid;
  v_editor_id uuid;
  v_viewer_id uuid;
BEGIN
  ----------------------------------------------------------------
  -- ADMIN
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', p_org_id, false)
    RETURNING id INTO v_admin_id;
  END IF;

  ----------------------------------------------------------------
  -- EDITOR
  ----------------------------------------------------------------
  SELECT id
  INTO v_editor_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Editor'
    AND is_system = false
  LIMIT 1;

  IF v_editor_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', p_org_id, false)
    RETURNING id INTO v_editor_id;
  END IF;

  ----------------------------------------------------------------
  -- VIEWER
  ----------------------------------------------------------------
  SELECT id
  INTO v_viewer_id
  FROM public.roles
  WHERE organization_id = p_org_id
    AND name = 'Lector'
    AND is_system = false
  LIMIT 1;

  IF v_viewer_id IS NULL THEN
    INSERT INTO public.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', p_org_id, false)
    RETURNING id INTO v_viewer_id;
  END IF;

  ----------------------------------------------------------------
  -- RETURN
  ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'admin',  v_admin_id,
    'editor', v_editor_id,
    'viewer', v_viewer_id
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_roles',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;$function$
```
</details>

### `step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.organization_wallets (
    id,
    organization_id,
    wallet_id,
    is_active,
    is_default,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_org_id,
    p_wallet_id,
    true,
    true,
    now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_organization_wallets',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'organization_id', p_org_id,
        'wallet_id', p_wallet_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_user(p_auth_user_id uuid, p_email text, p_full_name text, p_avatar_url text, p_avatar_source avatar_source_t, p_role_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_user(p_auth_user_id uuid, p_email text, p_full_name text, p_avatar_url text, p_avatar_source avatar_source_t, p_role_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.users (
    id, auth_id, email, full_name, avatar_url, avatar_source, role_id
  )
  VALUES (
    v_user_id, p_auth_user_id, p_email, p_full_name, p_avatar_url, p_avatar_source, p_role_id
  );

  RETURN v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'auth_user_id', p_auth_user_id,
        'email', p_email,
        'role_id', p_role_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_user_acquisition(p_user_id uuid, p_raw_meta jsonb)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_user_acquisition(p_user_id uuid, p_raw_meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
  v_source text;
begin
  ----------------------------------------------------------------
  -- Fuente (fallback a direct)
  ----------------------------------------------------------------
  v_source := coalesce(
    p_raw_meta->>'utm_source',
    'direct'
  );

  INSERT INTO public.user_acquisition (
    user_id,
    source,
    medium,
    campaign,
    content,
    landing_page,
    referrer
  )
  VALUES (
    p_user_id,
    v_source,
    p_raw_meta->>'utm_medium',
    p_raw_meta->>'utm_campaign',
    p_raw_meta->>'utm_content',
    p_raw_meta->>'landing_page',
    p_raw_meta->>'referrer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    source = EXCLUDED.source,
    medium = EXCLUDED.medium,
    campaign = EXCLUDED.campaign,
    content = EXCLUDED.content,
    landing_page = EXCLUDED.landing_page,
    referrer = EXCLUDED.referrer;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_acquisition',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'raw_meta', p_raw_meta
      ),
      'critical'
    );
    RAISE;
end;$function$
```
</details>

### `step_create_user_data(p_user_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_user_data(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_data (id, user_id, created_at)
  VALUES (gen_random_uuid(), p_user_id, now());

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_data',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `step_create_user_organization_preferences(p_user_id uuid, p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.step_create_user_organization_preferences(p_user_id uuid, p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_organization_preferences (
    id, user_id, organization_id, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), p_user_id, p_org_id, now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger',
      'step_create_user_organization_preferences',
      'signup',
      SQLERRM,
      jsonb_build_object('user_id', p_user_id, 'org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$
```
</details>
