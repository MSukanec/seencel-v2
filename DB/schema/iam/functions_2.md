# Database Schema (Auto-generated)
> Generated: 2026-02-21T14:12:15.483Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 2: handle_new_org_member_contact — step_create_organization)

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
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
  v_org_id uuid;
  v_admin_role_id uuid;
  v_recent_count integer;
  v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
  v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
  v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
  v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN
  SELECT count(*) INTO v_recent_count
  FROM public.organizations
  WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
      USING ERRCODE = 'P0001';
  END IF;

  v_org_id := public.step_create_organization(p_user_id, p_organization_name, v_plan_free_id, p_business_mode);

  PERFORM public.step_create_organization_data(v_org_id);
  PERFORM public.step_create_organization_roles(v_org_id);

  SELECT id INTO v_admin_role_id
  FROM iam.roles
  WHERE organization_id = v_org_id AND name = 'Administrador' AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  PERFORM public.step_add_org_member(p_user_id, v_org_id, v_admin_role_id);
  PERFORM public.step_assign_org_role_permissions(v_org_id);
  PERFORM public.step_create_organization_currencies(v_org_id, v_default_currency_id);
  PERFORM public.step_create_organization_wallets(v_org_id, v_default_wallet_id);
  PERFORM public.step_create_organization_preferences(
    v_org_id, v_default_currency_id, v_default_wallet_id, v_default_pdf_template_id
  );

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

### `iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.merge_contacts(p_source_contact_id uuid, p_target_contact_id uuid, p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_source record;
  v_target record;
  v_updated_count integer := 0;
  v_table_count integer;
begin
  if p_source_contact_id = p_target_contact_id then
    return jsonb_build_object('success', false, 'error', 'SAME_CONTACT', 'message', 'No podés reemplazar un contacto por sí mismo');
  end if;

  select id, organization_id, linked_user_id, full_name into v_source
  from public.contacts where id = p_source_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_source.id is null then
    return jsonb_build_object('success', false, 'error', 'SOURCE_NOT_FOUND', 'message', 'El contacto a reemplazar no existe');
  end if;

  select id, organization_id, linked_user_id, full_name into v_target
  from public.contacts where id = p_target_contact_id and organization_id = p_organization_id and is_deleted = false;

  if v_target.id is null then
    return jsonb_build_object('success', false, 'error', 'TARGET_NOT_FOUND', 'message', 'El contacto de destino no existe');
  end if;

  if v_source.linked_user_id is not null then
    if exists (
      select 1 from iam.organization_members
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true
    ) or exists (
      select 1 from iam.organization_external_actors
      where organization_id = p_organization_id and user_id = v_source.linked_user_id and is_active = true and is_deleted = false
    ) then
      return jsonb_build_object('success', false, 'error', 'SOURCE_IS_LINKED_ACTIVE', 'message', 'No se puede reemplazar un contacto vinculado a un usuario activo');
    end if;
  end if;

  update public.project_clients set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.project_labor set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontracts set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.subcontract_bids set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.movements set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_invoices set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.material_purchase_orders set provider_id = p_target_contact_id, updated_at = now() where provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.materials set default_provider_id = p_target_contact_id, updated_at = now() where default_provider_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.task_recipe_external_services set contact_id = p_target_contact_id, updated_at = now() where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.media_links set contact_id = p_target_contact_id where contact_id = p_source_contact_id;
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  update public.contact_category_links set contact_id = p_target_contact_id
  where contact_id = p_source_contact_id
    and category_id not in (select category_id from public.contact_category_links where contact_id = p_target_contact_id);
  get diagnostics v_table_count = row_count; v_updated_count := v_updated_count + v_table_count;

  delete from public.contact_category_links where contact_id = p_source_contact_id;

  update public.contacts
  set is_deleted = true, deleted_at = now(), updated_at = now(), linked_user_id = null
  where id = p_source_contact_id;

  return jsonb_build_object(
    'success', true, 'source_contact', v_source.full_name, 'target_contact', v_target.full_name,
    'references_moved', v_updated_count,
    'message', 'Contacto "' || v_source.full_name || '" reemplazado por "' || v_target.full_name || '". ' || v_updated_count || ' referencias actualizadas.'
  );

exception
  when others then
    return jsonb_build_object('success', false, 'error', 'UNEXPECTED_ERROR', 'message', SQLERRM);
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
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_is_active_member boolean;
  v_is_active_actor boolean;
  v_ref_count integer := 0;
  v_ref_tables text[] := '{}';
begin
  if not (old.is_deleted = false and new.is_deleted = true) then
    return new;
  end if;

  if new.linked_user_id is not null then
    select exists (
      select 1 from iam.organization_members om
      where om.organization_id = new.organization_id and om.user_id = new.linked_user_id and om.is_active = true
    ) into v_is_active_member;

    select exists (
      select 1 from iam.organization_external_actors oea
      where oea.organization_id = new.organization_id and oea.user_id = new.linked_user_id
        and oea.is_active = true and oea.is_deleted = false
    ) into v_is_active_actor;

    if v_is_active_member or v_is_active_actor then
      raise exception 'No se puede eliminar un contacto vinculado a un usuario activo de la organización. Primero desvinculá al miembro o colaborador externo.'
        using errcode = 'P0001';
    end if;
  end if;

  if exists (select 1 from public.project_clients where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'clientes de proyecto');
  end if;
  if exists (select 1 from public.project_labor where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'mano de obra');
  end if;
  if exists (select 1 from public.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    v_ref_tables := array_append(v_ref_tables, 'subcontratos');
  end if;
  if exists (select 1 from public.subcontract_bids where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'ofertas de subcontrato');
  end if;
  if exists (select 1 from public.movements where contact_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'movimientos financieros');
  end if;
  if exists (select 1 from public.material_invoices where provider_id = old.id) then
    v_ref_tables := array_append(v_ref_tables, 'facturas de materiales');
  end if;
  if exists (select 1 from public.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'órdenes de compra');
  end if;
  if exists (select 1 from public.materials where default_provider_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'proveedor default de materiales');
  end if;
  if exists (select 1 from public.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
    v_ref_tables := array_append(v_ref_tables, 'servicios externos de recetas');
  end if;

  if array_length(v_ref_tables, 1) > 0 then
    raise exception 'No se puede eliminar este contacto porque está siendo usado en: %. Primero reemplazalo por otro contacto.',
      array_to_string(v_ref_tables, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
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
 SET search_path TO 'iam'
AS $function$
BEGIN
  -- Validaciones
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'step_add_org_member: p_user_id IS NULL';
  END IF;

  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'step_add_org_member: p_org_id IS NULL';
  END IF;

  IF p_role_id IS NULL THEN
    RAISE EXCEPTION 'step_add_org_member: p_role_id IS NULL';
  END IF;

  -- Insert member
  INSERT INTO iam.organization_members (
    user_id, organization_id, role_id, is_active, created_at, joined_at
  )
  VALUES (
    p_user_id, p_org_id, p_role_id, true, now(), now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger',
      'step_add_org_member',
      'signup',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'org_id', p_org_id,
        'role_id', p_role_id
      ),
      'critical'
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
    PERFORM ops.log_system_error(
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
    PERFORM ops.log_system_error(
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
