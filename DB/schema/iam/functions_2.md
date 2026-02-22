# Database Schema (Auto-generated)
> Generated: 2026-02-22T15:06:00.294Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 2: handle_new_org_member_contact — tick_home_checklist)

### `iam.handle_new_org_member_contact()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_new_org_member_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
begin
  perform iam.ensure_contact_for_user(new.organization_id, new.user_id);
  return new;
end;$function$
```
</details>

### `iam.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'billing'
AS $function$
DECLARE
    v_org_id uuid := gen_random_uuid();
    v_admin_role_id uuid;
    v_editor_role_id uuid;
    v_viewer_role_id uuid;
    v_member_id uuid;
    v_board_id uuid;
    v_recent_count integer;
    -- Defaults hardcodeados (datos semilla de producción)
    v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
    v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
    v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN
    -- ══════════════════════════════════════════════════════════
    -- RATE LIMITING: máximo 3 orgs por hora por usuario
    -- ══════════════════════════════════════════════════════════
    SELECT count(*) INTO v_recent_count
    FROM iam.organizations
    WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

    IF v_recent_count >= 3 THEN
        RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
            USING ERRCODE = 'P0001';
    END IF;

    -- ══════════════════════════════════════════════════════════
    -- 1. CREAR ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organizations (
        id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id, business_mode
    )
    VALUES (
        v_org_id, p_organization_name, p_user_id, p_user_id, now(), now(), true, v_plan_free_id, p_business_mode
    );

    -- ══════════════════════════════════════════════════════════
    -- 2. DATOS DE ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_data (organization_id)
    VALUES (v_org_id);

    -- ══════════════════════════════════════════════════════════
    -- 3. ROLES (Administrador, Editor, Lector)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', v_org_id, false)
    RETURNING id INTO v_admin_role_id;

    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', v_org_id, false)
    RETURNING id INTO v_editor_role_id;

    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', v_org_id, false)
    RETURNING id INTO v_viewer_role_id;

    -- ══════════════════════════════════════════════════════════
    -- 4. MIEMBRO OWNER (con rol Administrador)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_members (
        user_id, organization_id, role_id, is_active, created_at, joined_at
    )
    VALUES (
        p_user_id, v_org_id, v_admin_role_id, true, now(), now()
    )
    RETURNING id INTO v_member_id;

    -- ══════════════════════════════════════════════════════════
    -- 5. PERMISOS POR ROL
    -- ══════════════════════════════════════════════════════════

    -- Admin: todos los permisos del sistema
    INSERT INTO iam.role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, p.id FROM iam.permissions p WHERE p.is_system = true;

    -- Editor: permisos de gestión
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

    -- Lector: permisos de solo lectura
    INSERT INTO iam.role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, p.id FROM iam.permissions p
    WHERE p.key IN (
        'projects.view', 'general_costs.view', 'members.view', 'roles.view',
        'contacts.view', 'planner.view', 'commercial.view', 'sitelog.view',
        'media.view', 'tasks.view', 'materials.view', 'subcontracts.view', 'labor.view'
    );

    -- ══════════════════════════════════════════════════════════
    -- 6. MONEDA DEFAULT (ARS)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO finance.organization_currencies (
        id, organization_id, currency_id, is_active, is_default, created_at
    )
    VALUES (
        gen_random_uuid(), v_org_id, v_default_currency_id, true, true, now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 7. BILLETERA DEFAULT (Efectivo)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO finance.organization_wallets (
        id, organization_id, wallet_id, is_active, is_default, created_at
    )
    VALUES (
        gen_random_uuid(), v_org_id, v_default_wallet_id, true, true, now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 8. PREFERENCIAS DE ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_preferences (
        organization_id, default_currency_id, default_wallet_id, default_pdf_template_id,
        use_currency_exchange, created_at, updated_at
    )
    VALUES (
        v_org_id, v_default_currency_id, v_default_wallet_id, v_default_pdf_template_id,
        false, now(), now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 9. TABLERO KANBAN DEFAULT ("General" + 3 listas)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO planner.kanban_boards (name, organization_id, created_by)
    VALUES ('General', v_org_id, v_member_id)
    RETURNING id INTO v_board_id;

    INSERT INTO planner.kanban_lists (board_id, name, position, organization_id, auto_complete, created_by)
    VALUES
        (v_board_id, 'Por Hacer',    0, v_org_id, false, v_member_id),
        (v_board_id, 'En Progreso',  1, v_org_id, false, v_member_id),
        (v_board_id, 'Hecho',        2, v_org_id, true,  v_member_id);

    -- ══════════════════════════════════════════════════════════
    -- 10. ACTIVAR ORG COMO ÚLTIMA USADA
    -- ══════════════════════════════════════════════════════════
    UPDATE iam.user_preferences
    SET last_organization_id = v_org_id, updated_at = now()
    WHERE user_id = p_user_id;

    RETURN v_org_id;

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'function', 'handle_new_organization', 'organization',
            SQLERRM, jsonb_build_object(
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

### `iam.handle_new_user()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
  v_user_id      uuid;
  v_avatar_source public.avatar_source_t := 'email';
  v_avatar_url   text;
  v_full_name    text;
  v_provider     text;
  v_current_step text := 'init';
BEGIN
  -- ══════════════════════════════════════════════════════════
  -- GUARD: evitar doble ejecución del signup
  -- ══════════════════════════════════════════════════════════
  IF EXISTS (
    SELECT 1 FROM iam.users WHERE auth_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- GUARD: email obligatorio
  -- ══════════════════════════════════════════════════════════
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    PERFORM ops.log_system_error(
      'trigger', 'handle_new_user', 'signup',
      'email is NULL or empty',
      jsonb_build_object('auth_id', NEW.id),
      'critical'
    );
    RAISE EXCEPTION 'handle_new_user: email is required (auth_id=%)', NEW.id;
  END IF;

  -- ══════════════════════════════════════════════════════════
  -- EXTRAER METADATA
  -- ══════════════════════════════════════════════════════════

  -- Provider real (raw_app_meta_data es la fuente confiable)
  v_provider := coalesce(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  -- Avatar source (enum basado en provider)
  v_avatar_source := CASE v_provider
    WHEN 'google'  THEN 'google'::public.avatar_source_t
    WHEN 'discord' THEN 'discord'::public.avatar_source_t
    ELSE 'email'::public.avatar_source_t
  END;

  -- Avatar URL
  v_avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Full name (fallback: parte del email antes del @)
  v_full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- ══════════════════════════════════════════════════════════
  -- STEP 1: Crear usuario
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user';

  INSERT INTO iam.users (auth_id, email, full_name, avatar_url, avatar_source)
  VALUES (NEW.id, lower(NEW.email), v_full_name, v_avatar_url, v_avatar_source)
  RETURNING id INTO v_user_id;

  -- ══════════════════════════════════════════════════════════
  -- STEP 2: Tracking de adquisición (UTM)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_acquisition';

  INSERT INTO iam.user_acquisition (
    user_id, source, medium, campaign, content, landing_page, referrer
  )
  VALUES (
    v_user_id,
    coalesce(NEW.raw_user_meta_data->>'utm_source', 'direct'),
    NEW.raw_user_meta_data->>'utm_medium',
    NEW.raw_user_meta_data->>'utm_campaign',
    NEW.raw_user_meta_data->>'utm_content',
    NEW.raw_user_meta_data->>'landing_page',
    NEW.raw_user_meta_data->>'referrer'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    source       = EXCLUDED.source,
    medium       = EXCLUDED.medium,
    campaign     = EXCLUDED.campaign,
    content      = EXCLUDED.content,
    landing_page = EXCLUDED.landing_page,
    referrer     = EXCLUDED.referrer;

  -- ══════════════════════════════════════════════════════════
  -- STEP 3: User data (perfil extendido — vacío al inicio)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_data';

  INSERT INTO iam.user_data (user_id) VALUES (v_user_id);

  -- ══════════════════════════════════════════════════════════
  -- STEP 4: User preferences (con defaults de la tabla)
  -- ══════════════════════════════════════════════════════════
  v_current_step := 'create_user_preferences';

  INSERT INTO iam.user_preferences (user_id) VALUES (v_user_id);

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'handle_new_user',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'step', v_current_step,
        'auth_id', NEW.id,
        'email', NEW.email,
        'user_id', v_user_id
      ),
      'critical'
    );
    RAISE;
END;
$function$
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
 SET search_path TO 'iam', 'public'
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
 SET search_path TO 'iam'
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
    JOIN iam.users u ON u.id = om.user_id
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

### `iam.heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
    v_auth_id uuid;
    v_user_id uuid;
BEGIN
    -- Auth check
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

    SELECT u.id INTO v_user_id FROM iam.users u WHERE u.auth_id = v_auth_id LIMIT 1;
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not provisioned'; END IF;

    -- Upsert presencia
    INSERT INTO iam.user_presence (
        user_id, organization_id, session_id, last_seen_at, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), COALESCE(p_status, 'online'), 'heartbeat', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, iam.user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        status = EXCLUDED.status,
        updated_at = now();

    -- Actualizar duración de la sesión actual (si existe)
    IF p_session_id IS NOT NULL THEN
        UPDATE iam.user_view_history
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
 SET search_path TO 'iam'
AS $function$
  select exists (
    select 1
    from iam.organizations o
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

### `iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'projects', 'finance', 'catalog'
AS $function$
declare
  v_source_exists boolean;
  v_target_exists boolean;
  v_merged_references int := 0;
begin
  select exists(
    select 1 from projects.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_source_exists;

  if not v_source_exists then
    return jsonb_build_object('success', false, 'error', 'source_not_found');
  end if;

  select exists(
    select 1 from projects.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false
  ) into v_target_exists;

  if not v_target_exists then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  end if;

  -- Update all references from source to target
  update projects.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update projects.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  update finance.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update finance.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;

  update catalog.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;

  update catalog.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;

  -- Merge category links (avoid duplicates)
  update projects.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from projects.contact_category_links where contact_id = p_target_contact_id);

  delete from projects.contact_category_links where contact_id = p_source_contact_id;

  update projects.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now()
  where id = p_source_contact_id;

  return jsonb_build_object('success', true, 'source_id', p_source_contact_id, 'target_id', p_target_contact_id);
end;
$function$
```
</details>

### `iam.protect_linked_contact_delete()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'projects', 'finance', 'catalog'
AS $function$
begin
  if exists (select 1 from projects.project_clients where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene proyectos asociados como cliente.';
  end if;
  if exists (select 1 from projects.project_labor where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene asignaciones de personal.';
  end if;
  if exists (select 1 from finance.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    raise exception 'No se puede eliminar este contacto porque tiene subcontratos asociados.';
  end if;
  if exists (select 1 from finance.subcontract_bids where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene ofertas de subcontratos.';
  end if;
  if exists (select 1 from finance.movements where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene movimientos financieros.';
  end if;
  if exists (select 1 from finance.material_invoices where provider_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene facturas de materiales.';
  end if;
  if exists (select 1 from finance.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene órdenes de compra.';
  end if;
  if exists (select 1 from catalog.materials where default_provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque es proveedor predeterminado de materiales.';
  end if;
  if exists (select 1 from catalog.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene servicios externos asociados.';
  end if;
  return old;
end;
$function$
```
</details>

### `iam.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.step_organization_increment_seats(p_organization_id uuid, p_seats_to_add integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
BEGIN
    UPDATE iam.organizations
    SET 
        purchased_seats = COALESCE(purchased_seats, 0) + p_seats_to_add,
        updated_at = now()
    WHERE id = p_organization_id;
END;
$function$
```
</details>

### `iam.sync_contact_on_user_update()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.sync_contact_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'projects', 'iam'
AS $function$
begin
  -- Solo si cambian full_name o email
  if (old.full_name is distinct from new.full_name)
     or (old.email is distinct from new.email) then

    update projects.contacts c
    set full_name  = coalesce(new.full_name, c.full_name),
        email      = coalesce(new.email, c.email),
        updated_at = now()
    where c.linked_user_id = new.id;
  end if;

  return new;
end;
$function$
```
</details>

### `iam.sync_role_permission_org_id()`

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY INVOKER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.sync_role_permission_org_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'iam'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM iam.roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$function$
```
</details>

### `iam.tick_home_checklist(p_key text, p_value boolean)` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.tick_home_checklist(p_key text, p_value boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := iam.current_user_id();
  if v_user_id is null then return false; end if;

  update iam.user_preferences up
  set
    home_checklist = jsonb_set(
      coalesce(up.home_checklist, '{}'::jsonb), array[p_key], to_jsonb(p_value), true
    ),
    updated_at = now()
  where up.user_id = v_user_id;

  return found;
end;
$function$
```
</details>
