# Database Schema (Auto-generated)
> Generated: 2026-02-21T03:04:42.923Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 2: handle_new_user — step_create_organization_roles)

### `iam.handle_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
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

### `iam.handle_registered_invitation()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_registered_invitation()
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

### `iam.handle_updated_by_organizations()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_updated_by_organizations()
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
    
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- Resolve Member ID
    -- User must be a member of THIS organization (NEW.id)
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
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

### `iam.has_permission(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.has_permission(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.organization_members om
    join iam.roles r
      on r.id = om.role_id
    join iam.role_permissions rp
      on rp.role_id = r.id
    join iam.permissions p
      on p.id = rp.permission_id
    where om.organization_id = p_organization_id
      and om.user_id = iam.current_user_id()
      and om.is_active = true
      and p.key = p_permission_key
  );
$function$
```
</details>

### `iam.is_admin()` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.admin_users_view au
    where au.auth_id = auth.uid()
  );
$function$
```
</details>

### `iam.is_demo_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_demo_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

### `iam.is_external_actor(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_external_actor(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM iam.organization_external_actors ea
    WHERE ea.organization_id = p_organization_id
      AND ea.user_id = iam.current_user_id()
      AND ea.is_active = true
      AND ea.is_deleted = false
  );
$function$
```
</details>

### `iam.is_org_member(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_org_member(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select exists (
    select 1
    from iam.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = iam.current_user_id()
      and m.is_active = true
  );
$function$
```
</details>

### `iam.is_organization_client(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_organization_client(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM iam.organization_clients oc
        WHERE oc.organization_id = p_organization_id
          AND oc.user_id = current_user_id()
          AND oc.is_active = true
          AND oc.is_deleted = false
    );
$function$
```
</details>

### `iam.is_self(p_user_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_self(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select p_user_id = iam.current_user_id();
$function$
```
</details>

### `iam.is_system_row(p_is_system boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.is_system_row(p_is_system boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select coalesce(p_is_system, false);
$function$
```
</details>

### `iam.step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_add_org_member(p_user_id uuid, p_org_id uuid, p_role_id uuid)
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
  INSERT INTO iam.organization_members (
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

### `iam.step_assign_org_role_permissions(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_assign_org_role_permissions(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
  v_admin_role_id  uuid;
  v_editor_role_id uuid;
  v_viewer_role_id uuid;
BEGIN
  SELECT id INTO v_admin_role_id FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Administrador' AND is_system = false;

  SELECT id INTO v_editor_role_id FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Editor' AND is_system = false;

  SELECT id INTO v_viewer_role_id FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Lector' AND is_system = false;

  DELETE FROM iam.role_permissions WHERE role_id = v_admin_role_id;
  INSERT INTO iam.role_permissions (role_id, permission_id)
  SELECT v_admin_role_id, p.id FROM iam.permissions p WHERE p.is_system = true;

  DELETE FROM iam.role_permissions WHERE role_id = v_editor_role_id;
  INSERT INTO iam.role_permissions (role_id, permission_id)
  SELECT v_editor_role_id, p.id FROM iam.permissions p
  WHERE p.key IN (
    'projects.view', 'projects.manage', 'general_costs.view', 'general_costs.manage',
    'members.view', 'roles.view', 'contacts.view', 'contacts.manage',
    'planner.view', 'planner.manage', 'commercial.view', 'commercial.manage',
    'sitelog.view', 'sitelog.manage', 'media.view', 'media.manage',
    'tasks.view', 'tasks.manage', 'materials.view', 'materials.manage',
    'subcontracts.view', 'subcontracts.manage', 'labor.view', 'labor.manage'
  );

  DELETE FROM iam.role_permissions WHERE role_id = v_viewer_role_id;
  INSERT INTO iam.role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, p.id FROM iam.permissions p
  WHERE p.key IN (
    'projects.view', 'general_costs.view', 'members.view', 'roles.view',
    'contacts.view', 'planner.view', 'commercial.view', 'sitelog.view',
    'media.view', 'tasks.view', 'materials.view', 'subcontracts.view', 'labor.view'
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function', 'step_assign_org_role_permissions', 'permissions',
      SQLERRM, jsonb_build_object('org_id', p_org_id), 'critical'
    );
    RAISE;
END;
$function$
```
</details>

### `iam.step_create_default_kanban_board(p_org_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_default_kanban_board(p_org_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'planner', 'iam'
AS $function$
DECLARE
  v_board_id uuid := gen_random_uuid();
BEGIN
  -- Deshabilitar triggers temporalmente
  ALTER TABLE planner.kanban_boards DISABLE TRIGGER set_updated_by_kanban_boards;
  
  INSERT INTO planner.kanban_boards (
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
  ALTER TABLE planner.kanban_boards ENABLE TRIGGER set_updated_by_kanban_boards;

  RETURN v_board_id;
END;
$function$
```
</details>

### `iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
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

### `iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid, p_business_mode text DEFAULT 'professional'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
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

### `iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

### `iam.step_create_organization_data(p_org_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_data(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

### `iam.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

### `iam.step_create_organization_roles(p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_create_organization_roles(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$DECLARE
  v_admin_id  uuid;
  v_editor_id uuid;
  v_viewer_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Administrador' AND is_system = false
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', p_org_id, false)
    RETURNING id INTO v_admin_id;
  END IF;

  SELECT id INTO v_editor_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Editor' AND is_system = false
  LIMIT 1;

  IF v_editor_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', p_org_id, false)
    RETURNING id INTO v_editor_id;
  END IF;

  SELECT id INTO v_viewer_id
  FROM iam.roles
  WHERE organization_id = p_org_id AND name = 'Lector' AND is_system = false
  LIMIT 1;

  IF v_viewer_id IS NULL THEN
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', p_org_id, false)
    RETURNING id INTO v_viewer_id;
  END IF;

  RETURN jsonb_build_object('admin', v_admin_id, 'editor', v_editor_id, 'viewer', v_viewer_id);

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'trigger', 'step_create_organization_roles', 'signup',
      SQLERRM, jsonb_build_object('org_id', p_org_id), 'critical'
    );
    RAISE;
END;$function$
```
</details>
