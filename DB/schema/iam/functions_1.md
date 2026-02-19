# Database Schema (Auto-generated)
> Generated: 2026-02-19T19:04:24.438Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [IAM] Functions (chunk 1: accept_client_invitation — is_organization_client)

### `iam.accept_client_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.accept_client_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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

        PERFORM public.ensure_contact_for_user(
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

        PERFORM public.ensure_contact_for_user(
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
 SET search_path TO 'public', 'iam'
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
    FROM public.organization_external_actors
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id;

    IF v_existing_actor IS NOT NULL AND v_existing_actor.is_active THEN
        v_actor_id := v_existing_actor.id;

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

    ELSIF v_existing_actor IS NOT NULL AND NOT v_existing_actor.is_active THEN
        -- 5a. Reactivar actor soft-deleted
        UPDATE public.organization_external_actors
        SET
            is_active = true,
            actor_type = v_invitation.actor_type,
            is_deleted = false,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_actor.id;

        v_actor_id := v_existing_actor.id;

        PERFORM public.ensure_contact_for_user(
            v_invitation.organization_id,
            p_user_id
        );

        UPDATE iam.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;
    ELSE
        -- 5b. Insertar nuevo actor externo
        INSERT INTO public.organization_external_actors (
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
        o.name AS org_name
    INTO v_invitation
    FROM iam.organization_invitations i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
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

    -- 4. Verificar que el usuario no es ya miembro activo
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
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
    FROM public.organization_members
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
    FROM public.organization_members
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
        UPDATE public.organization_members
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
        INSERT INTO public.organization_members (
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

### `iam.can_view_client_data(p_project_id uuid, p_client_id uuid)` 🔐

- **Returns**: boolean
- **Kind**: function | STABLE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION iam.can_view_client_data(p_project_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
    SELECT
        -- Admins ven todo
        is_admin()
        -- Miembros de la org ven todo
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = p_project_id
                AND om.user_id = current_user_id()
                AND om.is_active = true
        )
        -- Actores con acceso al proyecto:
        -- Si client_id IS NULL → ve todo (director de obra, etc.)
        -- Si client_id = p_client_id → ve los datos de ese cliente
        OR EXISTS (
            SELECT 1 FROM public.project_access pa
            WHERE pa.project_id = p_project_id
                AND pa.user_id = current_user_id()
                AND pa.is_active = true
                AND pa.is_deleted = false
                AND (pa.client_id IS NULL OR pa.client_id = p_client_id)
        );
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
    JOIN public.organizations o ON o.id = i.organization_id
    LEFT JOIN public.roles r ON r.id = i.role_id
    LEFT JOIN public.organization_members m ON m.id = i.invited_by
    LEFT JOIN public.users u ON u.id = m.user_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_invitation.id,
        'email', v_invitation.email,
        'status', v_invitation.status,
        'expires_at', v_invitation.expires_at,
        'invitation_type', COALESCE(v_invitation.invitation_type, 'member'),
        'actor_type', v_invitation.actor_type,
        'organization_name', v_invitation.organization_name,
        'role_name', COALESCE(v_invitation.role_name, 'Miembro'),
        'inviter_name', v_invitation.inviter_name
    );
END;
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
