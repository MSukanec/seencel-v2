# Database Schema (Auto-generated)
> Generated: 2026-02-21T19:23:32.061Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 1: accept_client_invitation — handle_new_external_actor_contact)

### `iam.accept_client_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.accept_client_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
DECLARE
    v_invitation RECORD;
    v_existing_client RECORD;
    v_client_record_id uuid;
BEGIN
    -- 1. Buscar invitación de cliente por token
    SELECT
        i.id,
        i.organization_id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
        i.project_id,
        i.client_id,
        o.name AS org_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
      AND i.invitation_type = 'client'
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación de cliente no encontrada o token inválido'
        );
    END IF;

    -- 2. Verificar status
    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    -- 3. Verificar expiración
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

    -- 4. Verificar si ya es cliente de esta org
    SELECT id, is_active
    INTO v_existing_client
    FROM iam.organization_clients
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id;

    IF v_existing_client IS NOT NULL AND v_existing_client.is_active THEN
        v_client_record_id := v_existing_client.id;

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

    ELSIF v_existing_client IS NOT NULL AND NOT v_existing_client.is_active THEN
        -- 5a. Reactivar cliente soft-deleted
        UPDATE iam.organization_clients
        SET
            is_active = true,
            is_deleted = false,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_client.id;

        v_client_record_id := v_existing_client.id;

        PERFORM iam.ensure_contact_for_user(
            v_invitation.organization_id,
            p_user_id
        );

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;
    ELSE
        -- 5b. Insertar nuevo cliente
        INSERT INTO iam.organization_clients (
            organization_id,
            user_id,
            is_active
        ) VALUES (
            v_invitation.organization_id,
            p_user_id,
            true
        )
        RETURNING id INTO v_client_record_id;

        PERFORM iam.ensure_contact_for_user(
            v_invitation.organization_id,
            p_user_id
        );

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;
    END IF;

    -- 6. AUTO-CREAR project_access
    IF v_invitation.project_id IS NOT NULL THEN
        INSERT INTO public.project_access (
            project_id,
            organization_id,
            user_id,
            access_type,
            access_level,
            client_id,
            is_active
        ) VALUES (
            v_invitation.project_id,
            v_invitation.organization_id,
            p_user_id,
            'client',
            'viewer',
            v_invitation.client_id,
            true
        )
        ON CONFLICT (project_id, user_id)
        WHERE is_deleted = false
        DO NOTHING;
    END IF;

    -- 7. Configurar preferencias del usuario
    UPDATE public.user_preferences
    SET last_organization_id = v_invitation.organization_id
    WHERE user_id = p_user_id;

    INSERT INTO public.user_organization_preferences (
        user_id, organization_id, updated_at
    ) VALUES (
        p_user_id, v_invitation.organization_id, NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET updated_at = NOW();

    -- 8. Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'already_client', (v_existing_client IS NOT NULL AND v_existing_client.is_active),
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'project_id', v_invitation.project_id
    );
END;
$function$
```
</details>

### `iam.accept_external_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.accept_external_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
DECLARE
    v_invitation RECORD;
    v_existing_actor RECORD;
    v_actor_id uuid;
BEGIN
    -- 1. Buscar invitación externa por token
    SELECT
        i.id,
        i.organization_id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
        i.project_id,
        i.client_id,
        o.name AS org_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
      AND i.invitation_type = 'external'
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación no encontrada o token inválido'
        );
    END IF;

    -- 2. Verificar status
    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    -- 3. Verificar expiración
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

    -- 4. Verificar si ya es actor externo (activo o inactivo)
    SELECT id, is_active
    INTO v_existing_actor
    FROM iam.organization_external_actors
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id;

    IF v_existing_actor IS NOT NULL AND v_existing_actor.is_active THEN
        v_actor_id := v_existing_actor.id;

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

    ELSIF v_existing_actor IS NOT NULL AND NOT v_existing_actor.is_active THEN
        -- 5a. Reactivar actor soft-deleted
        UPDATE iam.organization_external_actors
        SET
            is_active = true,
            actor_type = v_invitation.actor_type,
            is_deleted = false,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_actor.id;

        v_actor_id := v_existing_actor.id;

        PERFORM iam.ensure_contact_for_user(
            v_invitation.organization_id,
            p_user_id
        );

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;
    ELSE
        -- 5b. Insertar nuevo actor externo
        INSERT INTO iam.organization_external_actors (
            organization_id,
            user_id,
            actor_type,
            is_active
        ) VALUES (
            v_invitation.organization_id,
            p_user_id,
            v_invitation.actor_type,
            true
        )
        RETURNING id INTO v_actor_id;

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;
    END IF;

    -- 6. AUTO-CREAR project_access si la invitación tiene project_id
    IF v_invitation.project_id IS NOT NULL THEN
        INSERT INTO public.project_access (
            project_id,
            organization_id,
            user_id,
            access_type,
            access_level,
            client_id,
            is_active
        ) VALUES (
            v_invitation.project_id,
            v_invitation.organization_id,
            p_user_id,
            COALESCE(v_invitation.actor_type, 'external'),
            'viewer',
            v_invitation.client_id,
            true
        )
        ON CONFLICT (project_id, user_id)
        WHERE is_deleted = false
        DO NOTHING;
    END IF;

    -- 7. Configurar preferencias del usuario
    UPDATE public.user_preferences
    SET last_organization_id = v_invitation.organization_id
    WHERE user_id = p_user_id;

    INSERT INTO public.user_organization_preferences (
        user_id, organization_id, updated_at
    ) VALUES (
        p_user_id, v_invitation.organization_id, NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET updated_at = NOW();

    -- 8. Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'already_actor', (v_existing_actor IS NOT NULL AND v_existing_actor.is_active),
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'project_id', v_invitation.project_id
    );
END;
$function$
```
</details>

### `iam.accept_organization_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.accept_organization_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
    v_already_member BOOLEAN;
    v_inactive_member_id UUID;
    v_seat_capacity INT;
    v_current_members INT;
    v_pending_invitations INT;
    v_available INT;
    v_new_member_id UUID;
BEGIN
    -- 1. Buscar invitación por token
    SELECT 
        i.id,
        i.organization_id,
        i.email,
        i.role_id,
        i.status,
        i.expires_at,
        i.invited_by,
        i.invitation_type,
        o.name as org_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación no encontrada'
        );
    END IF;

    -- 2. Verificar estado
    IF v_invitation.status != 'registered' AND v_invitation.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    -- 3. Verificar expiración
    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

    -- 4. Verificar que el usuario no es ya miembro activo
    SELECT EXISTS (
        SELECT 1 FROM iam.organization_members
        WHERE organization_id = v_invitation.organization_id
          AND user_id = p_user_id
          AND is_active = true
    ) INTO v_already_member;

    IF v_already_member THEN
        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'already_member', true,
            'organization_id', v_invitation.organization_id,
            'message', 'Ya sos miembro de esta organización'
        );
    END IF;

    -- 4b. Verificar si existe un miembro INACTIVO
    SELECT id INTO v_inactive_member_id
    FROM iam.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id
      AND is_active = false;

    -- 5. Verificar asientos disponibles
    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1) + COALESCE(org.purchased_seats, 0)
    INTO v_seat_capacity
    FROM public.organizations org
    JOIN public.plans p ON p.id = org.plan_id
    WHERE org.id = v_invitation.organization_id;

    SELECT COUNT(*) INTO v_current_members
    FROM iam.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND is_active = true;

    SELECT COUNT(*) INTO v_pending_invitations
    FROM iam.organization_invitations
    WHERE organization_id = v_invitation.organization_id
      AND status IN ('pending', 'registered')
      AND id != v_invitation.id;

    v_available := v_seat_capacity - v_current_members;

    IF v_available <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_seats_available',
            'message', 'No hay asientos disponibles en esta organización'
        );
    END IF;

    -- 6. Crear o reactivar miembro
    IF v_inactive_member_id IS NOT NULL THEN
        UPDATE iam.organization_members
        SET 
            is_active = true,
            is_billable = true,
            role_id = v_invitation.role_id,
            invited_by = v_invitation.invited_by,
            joined_at = NOW(),
            updated_at = NOW(),
            is_over_limit = false
        WHERE id = v_inactive_member_id;

        v_new_member_id := v_inactive_member_id;
    ELSE
        INSERT INTO iam.organization_members (
            organization_id,
            user_id,
            role_id,
            is_active,
            is_billable,
            joined_at,
            invited_by
        ) VALUES (
            v_invitation.organization_id,
            p_user_id,
            v_invitation.role_id,
            true,
            true,
            NOW(),
            v_invitation.invited_by
        )
        RETURNING id INTO v_new_member_id;
    END IF;

    -- 7. Actualizar invitación
    UPDATE iam.organization_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE id = v_invitation.id;

    -- 8. Registrar evento
    INSERT INTO public.organization_member_events (
        organization_id,
        member_id,
        user_id,
        event_type,
        was_billable,
        is_billable,
        performed_by
    ) VALUES (
        v_invitation.organization_id,
        v_new_member_id,
        p_user_id,
        'invitation_accepted',
        false,
        true,
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'member_id', v_new_member_id,
        'message', 'Invitación aceptada correctamente'
    );
END;
$function$
```
</details>

### `iam.analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT u.id INTO v_user_id FROM iam.users u WHERE u.auth_id = auth.uid() LIMIT 1;
    IF v_user_id IS NULL THEN RETURN; END IF;

    -- A. Cerrar vista anterior de ESTA sesión
    UPDATE iam.user_view_history
    SET
        exited_at = now(),
        duration_seconds = EXTRACT(EPOCH FROM (now() - entered_at))::integer
    WHERE user_id = v_user_id
      AND session_id = p_session_id
      AND exited_at IS NULL;

    -- B. Abrir nueva vista
    INSERT INTO iam.user_view_history (
        user_id, organization_id, session_id, view_name, entered_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, p_view_name, now()
    );

    -- C. Actualizar Presencia en tiempo real
    INSERT INTO iam.user_presence (
        user_id, organization_id, session_id, last_seen_at, current_view, status, updated_from, updated_at
    ) VALUES (
        v_user_id, p_org_id, p_session_id, now(), p_view_name, 'online', 'navigation', now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, iam.user_presence.organization_id),
        session_id = EXCLUDED.session_id,
        last_seen_at = EXCLUDED.last_seen_at,
        current_view = EXCLUDED.current_view,
        status = 'online',
        updated_at = now();
END;
$function$
```
</details>

### `iam.assign_default_permissions_to_org_roles(p_organization_id uuid)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.assign_default_permissions_to_org_roles(p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  admin_role_id uuid;
  editor_role_id uuid;
  viewer_role_id uuid;
begin
  select id into admin_role_id
  from iam.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) = 'administrador';

  select id into editor_role_id
  from iam.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) = 'editor';

  select id into viewer_role_id
  from iam.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) = 'visualizador';

  -- Admin: todos los permisos no-admin
  delete from iam.role_permissions where role_id = admin_role_id;
  insert into iam.role_permissions (role_id, permission_id, organization_id)
  select admin_role_id, p.id, p_organization_id
  from iam.permissions p
  where p.category <> 'admin'
  on conflict do nothing;

  -- Editor: permisos view + edit (sin admin, billing, roles)
  delete from iam.role_permissions where role_id = editor_role_id;
  insert into iam.role_permissions (role_id, permission_id, organization_id)
  select editor_role_id, p.id, p_organization_id
  from iam.permissions p
  where p.category <> 'admin'
    and p.key not like '%delete%'
    and p.key not in ('billing.manage', 'roles.manage', 'members.manage')
  on conflict do nothing;

  -- Viewer: solo permisos view
  delete from iam.role_permissions where role_id = viewer_role_id;
  insert into iam.role_permissions (role_id, permission_id, organization_id)
  select viewer_role_id, p.id, p_organization_id
  from iam.permissions p
  where p.key IN (
    'projects.view', 'general_costs.view', 'members.view', 'roles.view',
    'contacts.view', 'planner.view', 'commercial.view', 'sitelog.view',
    'media.view', 'tasks.view', 'materials.view', 'subcontracts.view', 'labor.view'
  );
end;
$function$
```
</details>

### `iam.can_mutate_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_mutate_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  select
    iam.is_admin()
    or (
      not iam.is_demo_org(p_organization_id)
      and iam.is_org_member(p_organization_id)
      and iam.has_permission(p_organization_id, p_permission_key)
    );
$function$
```
</details>

### `iam.can_mutate_project(p_project_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_mutate_project(p_project_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT
    iam.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_project_id
        AND iam.can_mutate_org(p.organization_id, p_permission_key)
    )
    OR EXISTS (
      SELECT 1 FROM iam.project_access pa
      WHERE pa.project_id = p_project_id
        AND pa.user_id = iam.current_user_id()
        AND pa.is_active = true
        AND pa.is_deleted = false
        AND pa.access_level IN ('editor', 'admin')
    );
$function$
```
</details>

### `iam.can_view_client_data(p_project_id uuid, p_client_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_view_client_data(p_project_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'projects'
AS $function$
    SELECT
        -- Admins ven todo
        is_admin()
        -- Miembros de la org ven todo
        OR EXISTS (
            SELECT 1 FROM projects.projects p
            JOIN iam.organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = p_project_id
                AND om.user_id = current_user_id()
                AND om.is_active = true
        )
        -- Actores con acceso al proyecto:
        -- Si client_id IS NULL → ve todo (director de obra, etc.)
        -- Si client_id = p_client_id → ve los datos de ese cliente
        OR EXISTS (
            SELECT 1 FROM iam.project_access pa
            WHERE pa.project_id = p_project_id
              AND pa.user_id = current_user_id()
              AND pa.is_active = true
              AND pa.is_deleted = false
              AND (pa.client_id IS NULL OR pa.client_id = p_client_id)
        );
$function$
```
</details>

### `iam.can_view_org(p_organization_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_view_org(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
    SELECT
        iam.is_admin()
        OR iam.is_demo_org(p_organization_id)
        OR iam.is_org_member(p_organization_id)
        OR iam.is_external_actor(p_organization_id)
        OR iam.is_organization_client(p_organization_id);
$function$
```
</details>

### `iam.can_view_org(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_view_org(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT
    iam.is_admin()
    OR iam.is_demo_org(p_organization_id)
    OR (
      iam.is_org_member(p_organization_id)
      AND iam.has_permission(p_organization_id, p_permission_key)
    )
    OR iam.external_has_scope(p_organization_id, p_permission_key);
$function$
```
</details>

### `iam.can_view_project(p_project_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_view_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'projects'
AS $function$
  SELECT
    iam.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects.projects p
      JOIN iam.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = p_project_id
        AND om.user_id = iam.current_user_id()
        AND om.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM iam.project_access pa
      WHERE pa.project_id = p_project_id
        AND pa.user_id = iam.current_user_id()
        AND pa.is_active = true
        AND pa.is_deleted = false
    );
$function$
```
</details>

### `iam.current_user_id()` 🔐

- **Returns**: uuid
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
  select u.id
  from iam.users u
  where u.auth_id = auth.uid()
  limit 1;
$function$
```
</details>

### `iam.dismiss_home_banner()` 🔐

- **Returns**: boolean
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.dismiss_home_banner()
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

  update iam.user_preferences
  set home_banner_dismissed = true, updated_at = now()
  where user_id = v_user_id;

  return true;
end;
$function$
```
</details>

### `iam.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)` 🔐

- **Returns**: uuid
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
declare
  v_user record;
  v_user_data record;
  v_contact_id uuid;
  v_first_name text;
  v_last_name text;
begin
  select u.id, u.full_name, u.email, u.avatar_url
  into v_user
  from iam.users u
  where u.id = p_user_id
  limit 1;

  if v_user.id is null then
    return null;
  end if;

  if v_user.email is null then
    return null;
  end if;

  select ud.first_name, ud.last_name
  into v_user_data
  from iam.user_data ud
  where ud.user_id = p_user_id
  limit 1;

  if v_user_data.first_name is not null then
    v_first_name := v_user_data.first_name;
    v_last_name := coalesce(v_user_data.last_name, '');
  elsif v_user.full_name is not null then
    v_first_name := split_part(v_user.full_name, ' ', 1);
    v_last_name := nullif(trim(substring(v_user.full_name from position(' ' in v_user.full_name) + 1)), '');
  end if;

  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id = v_user.id
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
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

  select c.id
  into v_contact_id
  from public.contacts c
  where c.organization_id = p_organization_id
    and c.email = v_user.email
    and c.linked_user_id is null
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    update public.contacts c
    set
      linked_user_id = v_user.id,
      first_name = coalesce(c.first_name, v_first_name),
      last_name  = coalesce(c.last_name, v_last_name),
      image_url  = coalesce(c.image_url, v_user.avatar_url),
      full_name  = coalesce(v_user.full_name, c.full_name),
      updated_at = now()
    where c.id = v_contact_id;

    return v_contact_id;
  end if;

  insert into public.contacts (
    organization_id, linked_user_id, first_name, last_name,
    full_name, email, image_url, created_at, updated_at
  )
  values (
    p_organization_id, v_user.id, v_first_name, v_last_name,
    v_user.full_name, v_user.email, v_user.avatar_url, now(), now()
  )
  returning id into v_contact_id;

  return v_contact_id;
end;
$function$
```
</details>

### `iam.external_has_scope(p_organization_id uuid, p_permission_key text)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.external_has_scope(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM iam.organization_external_actors ea
    JOIN public.external_actor_scopes eas ON eas.external_actor_id = ea.id
    WHERE ea.organization_id = p_organization_id
      AND ea.user_id = iam.current_user_id()
      AND ea.is_active = true
      AND ea.is_deleted = false
      AND eas.permission_key = p_permission_key
  );
$function$
```
</details>

### `iam.fill_user_data_user_id_from_auth()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.fill_user_data_user_id_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
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
  from iam.users u
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

### `iam.forbid_user_id_change()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.forbid_user_id_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

### `iam.get_invitation_by_token(p_token text)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.get_invitation_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT 
        i.id,
        i.email,
        i.status,
        i.expires_at,
        i.invitation_type,
        i.actor_type,
        o.name AS organization_name,
        r.name AS role_name,
        u.full_name AS inviter_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN iam.organizations o ON o.id = i.organization_id
    LEFT JOIN iam.roles r ON r.id = i.role_id
    LEFT JOIN iam.organization_members m ON m.id = i.invited_by
    LEFT JOIN iam.users u ON u.id = m.user_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found'
        );
    END IF;

    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_status',
            'status', v_invitation.status
        );
    END IF;

    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'expired'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation.id,
        'email', v_invitation.email,
        'organization_name', v_invitation.organization_name,
        'role_name', v_invitation.role_name,
        'inviter_name', v_invitation.inviter_name,
        'invitation_type', v_invitation.invitation_type,
        'actor_type', v_invitation.actor_type
    );
END;
$function$
```
</details>

### `iam.get_user()` 🔐

- **Returns**: json
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.get_user()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam', 'billing'
AS $function$
declare
  current_user_auth_id uuid;
  current_user_internal_id uuid;
  result json;
begin
  current_user_auth_id := auth.uid();
  if current_user_auth_id is null then return null; end if;

  select u.id into current_user_internal_id
  from iam.users u where u.auth_id = current_user_auth_id limit 1;

  if current_user_internal_id is null then return null; end if;

  with
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
    from iam.user_preferences up
    join iam.organizations o on o.id = up.last_organization_id
    left join billing.plans p on p.id = o.plan_id
    left join iam.organization_preferences op on op.organization_id = o.id
    left join iam.user_organization_preferences uop
      on uop.user_id = up.user_id and uop.organization_id = o.id
    join iam.organization_members om
      on om.organization_id = o.id and om.user_id = up.user_id and om.is_active = true
    where up.user_id = current_user_internal_id
  ),

  active_role_permissions as (
    select
      r.id as role_id, r.name as role_name,
      json_agg(
        json_build_object('id', perm.id, 'key', perm.key, 'description', perm.description, 'category', perm.category)
      ) filter (where perm.id is not null) as permissions
    from active_org ao
    join iam.roles r on r.id = ao.role_id
    left join iam.role_permissions rp on rp.role_id = r.id
    left join iam.permissions perm on perm.id = rp.permission_id
    group by r.id, r.name
  ),

  user_memberships as (
    select json_agg(
      json_build_object(
        'organization_id', om.organization_id,
        'organization_name', org.name,
        'is_active', om.is_active,
        'joined_at', om.joined_at,
        'last_active_at', om.last_active_at,
        'role', json_build_object('id', r.id, 'name', r.name)
      )
    ) as memberships
    from iam.organization_members om
    join iam.organizations org on org.id = om.organization_id
    join iam.roles r on r.id = om.role_id
    where om.user_id = current_user_internal_id and om.is_active = true
  ),

  user_pref as (
    select up.theme, up.home_checklist, up.home_banner_dismissed,
           up.layout, up.language, up.sidebar_mode, up.timezone
    from iam.user_preferences up where up.user_id = current_user_internal_id
  )

  select json_build_object(
    'id', u.id,
    'full_name', u.full_name,
    'email', u.email,
    'avatar_url', u.avatar_url,
    'avatar_source', u.avatar_source,
    'role_id', u.role_id,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'organization', (
      select json_build_object(
        'id', ao.id, 'name', ao.name, 'is_active', ao.is_active,
        'is_system', ao.is_system, 'created_by', ao.created_by,
        'created_at', ao.created_at, 'updated_at', ao.updated_at,
        'owner_id', ao.owner_id,
        'plan_id', ao.plan_id, 'plan_name', ao.plan_name,
        'plan_slug', ao.plan_slug, 'plan_features', ao.plan_features,
        'plan_monthly_amount', ao.plan_monthly_amount,
        'plan_annual_amount', ao.plan_annual_amount,
        'plan_billing_type', ao.plan_billing_type,
        'default_currency_id', ao.default_currency_id,
        'default_wallet_id', ao.default_wallet_id,
        'default_pdf_template_id', ao.default_pdf_template_id,
        'use_currency_exchange', ao.use_currency_exchange,
        'preferences_created_at', ao.op_created_at,
        'preferences_updated_at', ao.op_updated_at,
        'last_project_id', ao.last_project_id,
        'role', (
          select json_build_object('id', arp.role_id, 'name', arp.role_name, 'permissions', coalesce(arp.permissions, '[]'::json))
          from active_role_permissions arp limit 1
        )
      ) from active_org ao limit 1
    ),
    'memberships', (select memberships from user_memberships),
    'preferences', (
      select json_build_object(
        'theme', up.theme,
        'home_checklist', up.home_checklist,
        'home_banner_dismissed', up.home_banner_dismissed,
        'layout', up.layout,
        'language', up.language,
        'sidebar_mode', up.sidebar_mode,
        'timezone', up.timezone
      ) from user_pref up limit 1
    )
  ) into result
  from iam.users u
  where u.id = current_user_internal_id;

  return result;
end;
$function$
```
</details>

### `iam.handle_new_external_actor_contact()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.handle_new_external_actor_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
begin
  perform iam.ensure_contact_for_user(new.organization_id, new.user_id);
  return new;
end;
$function$
```
</details>
