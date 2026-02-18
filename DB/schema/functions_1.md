# Database Schema (Auto-generated)
> Generated: 2026-02-18T21:46:26.792Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## Functions & Procedures (chunk 1: accept_external_invitation — create_construction_task_material_snapshot)

### `accept_external_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.accept_external_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    FROM public.organization_invitations i
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
        -- Ya es actor activo → marcar invitación y continuar
        -- (podría tener project_id pendiente de vincular)
        v_actor_id := v_existing_actor.id;

        UPDATE public.organization_invitations
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

        -- Asegurar que el contacto existe
        PERFORM public.ensure_contact_for_user(
            v_invitation.organization_id,
            p_user_id
        );

        -- Marcar invitación como aceptada
        UPDATE public.organization_invitations
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

        -- Marcar invitación como aceptada
        UPDATE public.organization_invitations
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
        DO NOTHING; -- Si ya tiene acceso, no hacer nada
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

### `accept_organization_invitation(p_token text, p_user_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    FROM public.organization_invitations i
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
        -- Marcar invitación como aceptada igualmente
        UPDATE public.organization_invitations
        SET status = 'accepted', accepted_at = NOW(), user_id = p_user_id
        WHERE id = v_invitation.id;

        RETURN jsonb_build_object(
            'success', true,
            'already_member', true,
            'organization_id', v_invitation.organization_id,
            'message', 'Ya sos miembro de esta organización'
        );
    END IF;

    -- 4b. Verificar si existe un miembro INACTIVO (fue removido previamente)
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
    FROM public.organization_invitations
    WHERE organization_id = v_invitation.organization_id
      AND status IN ('pending', 'registered')
      AND id != v_invitation.id; -- Excluyendo la actual

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
        -- Re-activar miembro existente
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
        -- Crear miembro nuevo
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
    UPDATE public.organization_invitations
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

### `admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.admin_cleanup_test_purchase(p_user_email text, p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID;
    v_deleted_items TEXT[] := '{}';
    v_org_id UUID;
    v_affected_count INT;
    v_free_plan_id UUID := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    
BEGIN
    v_org_id := p_org_id;
    
    -- ============================================
    -- VALIDACIÓN: Obtener y validar user_id
    -- ============================================
    SELECT COUNT(*) INTO v_affected_count
    FROM public.users 
    WHERE email = p_user_email;
    
    IF v_affected_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuario no encontrado: ' || p_user_email
        );
    END IF;
    
    IF v_affected_count > 1 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '⛔ SEGURIDAD: Más de un usuario con ese email (esto no debería pasar)'
        );
    END IF;
    
    SELECT id INTO v_user_id 
    FROM public.users 
    WHERE email = p_user_email;
    
    -- ============================================
    -- OPERACIONES DE LIMPIEZA (con conteo)
    -- ============================================
    
    -- 1. Borrar course_enrollments
    DELETE FROM course_enrollments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'course_enrollments (' || v_affected_count || ')'); 
    END IF;
    
    -- 2. Borrar suscripciones de la organización
    DELETE FROM organization_subscriptions WHERE organization_id = v_org_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organization_subscriptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 3. Resetear plan_id de la organización al plan FREE
    UPDATE organizations 
    SET plan_id = v_free_plan_id 
    WHERE id = v_org_id AND plan_id IS DISTINCT FROM v_free_plan_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.plan_id → FREE'); 
    END IF;

    -- 3b. Resetear is_founder flag
    UPDATE organizations 
    SET settings = COALESCE(settings, '{}'::jsonb) - 'is_founder'
    WHERE id = v_org_id AND (settings->>'is_founder')::boolean = true;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.settings.is_founder → removed'); 
    END IF;

    -- 3c. Resetear purchased_seats a 0
    UPDATE organizations 
    SET purchased_seats = 0 
    WHERE id = v_org_id AND COALESCE(purchased_seats, 0) > 0;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'organizations.purchased_seats → 0'); 
    END IF;
    
    -- 4. Borrar payments del usuario
    DELETE FROM payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 5. Borrar bank_transfer_payments del usuario
    DELETE FROM bank_transfer_payments WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'bank_transfer_payments (' || v_affected_count || ')'); 
    END IF;
    
    -- 6. Borrar mp_preferences del usuario
    DELETE FROM mp_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'mp_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- 7. Borrar coupon_redemptions del usuario
    DELETE FROM coupon_redemptions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'coupon_redemptions (' || v_affected_count || ')'); 
    END IF;
    
    -- 8. Borrar payment_events vinculados a paypal_preferences del usuario
    DELETE FROM payment_events pe
    WHERE EXISTS (
        SELECT 1 FROM paypal_preferences pp 
        WHERE pp.id::text = pe.custom_id 
        AND pp.user_id = v_user_id
    );
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'payment_events (' || v_affected_count || ')'); 
    END IF;

    -- 9. Borrar paypal_preferences del usuario (tabla unificada)
    DELETE FROM paypal_preferences WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    IF v_affected_count > 0 THEN 
        v_deleted_items := array_append(v_deleted_items, 'paypal_preferences (' || v_affected_count || ')'); 
    END IF;
    
    -- NOTA: paypal_seat_preferences y paypal_upgrade_preferences son legacy
    -- y no existen en producción. Toda la data está en paypal_preferences.
    
    -- ============================================
    -- RESULTADO
    -- ============================================
    IF array_length(v_deleted_items, 1) IS NULL OR array_length(v_deleted_items, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', '✅ Usuario ' || p_user_email || ' encontrado pero no tenía datos de compra.',
            'deleted_items', '[]'::jsonb
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '✅ Limpieza completa para ' || p_user_email,
        'deleted_items', to_jsonb(v_deleted_items),
        'user_id', v_user_id,
        'org_id', v_org_id
    );
END;
$function$
```
</details>

### `admin_cleanup_test_user(target_email text)` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.admin_cleanup_test_user(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_org_record record;
BEGIN
    -- 1. Find the user ID from auth.users (or public.users)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = target_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found, nothing to clean.', target_email;
        RETURN;
    END IF;

    RAISE NOTICE 'Cleaning up user: % (ID: %)', target_email, v_user_id;

    -- 2. Find Organizations owned by this user
    -- We assume an org is "owned" if this user is a member with 'Administrador' role
    -- OR we can look at the simplified logic: "Orgs where this user is the CREATOR"
    -- If your logic relies on `organization_members`, we should find orgs where 
    -- this user is a member and check if we want to delete it.
    -- SAFE APPROACH: Delete Organization only if this user is the ONLY member.
    
    FOR v_org_record IN 
        SELECT o.id, o.name 
        FROM public.organizations o
        JOIN public.organization_members om ON o.id = om.organization_id
        WHERE om.user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id)
    LOOP
        -- Check if there are OTHER members in this org
        IF (SELECT count(*) FROM public.organization_members WHERE organization_id = v_org_record.id) = 1 THEN
            RAISE NOTICE 'Deleting Organization: % (ID: %)', v_org_record.name, v_org_record.id;
            
            -- Delete the Organization (Cascade should handle the rest usually, but let's be safe)
            -- Note: If you have FKs set to CASCADE, just deleting the org is enough.
            DELETE FROM public.organizations WHERE id = v_org_record.id;
        ELSE
            RAISE NOTICE 'Skipping Organization % because it has other members.', v_org_record.name;
            
            -- Just remove the member, don't kill the org
            DELETE FROM public.organization_members 
            WHERE organization_id = v_org_record.id 
            AND user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id);
        END IF;
    END LOOP;

    -- 3. Finally, delete the User from auth.users
    -- This will cascade to public.users and any remaining direct links
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Cleanup complete for %', target_email;
END;
$function$
```
</details>

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

### `approve_quote_and_create_tasks(p_quote_id uuid, p_member_id uuid DEFAULT NULL::uuid)` 🔐

- **Returns**: jsonb
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION public.approve_quote_and_create_tasks(p_quote_id uuid, p_member_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_quote RECORD;
    v_tasks_created INTEGER := 0;
    v_result JSONB;
BEGIN
    -- ========================================
    -- 1. VALIDATE: Quote exists and is valid
    -- ========================================
    SELECT 
        q.id,
        q.status,
        q.project_id,
        q.organization_id,
        q.approved_at
    INTO v_quote
    FROM quotes q
    WHERE q.id = p_quote_id
      AND q.is_deleted = false;
    
    -- Quote not found
    IF v_quote.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NOT_FOUND',
            'message', 'El presupuesto no existe o fue eliminado'
        );
    END IF;
    
    -- Quote already approved (idempotency check)
    IF v_quote.status = 'approved' OR v_quote.approved_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_ALREADY_APPROVED',
            'message', 'Este presupuesto ya fue aprobado',
            'approved_at', v_quote.approved_at
        );
    END IF;
    
    -- Quote must have a project to create construction tasks
    IF v_quote.project_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QUOTE_NO_PROJECT',
            'message', 'El presupuesto debe estar asociado a un proyecto para generar tareas de construcción'
        );
    END IF;
    
    -- ========================================
    -- 2. IDEMPOTENCY: Check no tasks already exist for this quote
    -- ========================================
    IF EXISTS (
        SELECT 1 
        FROM construction_tasks ct
        INNER JOIN quote_items qi ON ct.quote_item_id = qi.id
        WHERE qi.quote_id = p_quote_id
          AND ct.is_deleted = false
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TASKS_ALREADY_EXIST',
            'message', 'Ya existen tareas de construcción para este presupuesto'
        );
    END IF;
    
    -- ========================================
    -- 3. CREATE CONSTRUCTION TASKS from quote_items
    -- ========================================
    INSERT INTO construction_tasks (
        project_id,
        organization_id,
        task_id,
        quote_item_id,
        quantity,
        original_quantity,
        description,
        cost_scope,
        markup_pct,
        status,
        progress_percent,
        created_by
    )
    SELECT
        qi.project_id,
        qi.organization_id,
        qi.task_id,                     -- May be NULL for custom items
        qi.id AS quote_item_id,         -- Traceability
        qi.quantity,                    -- Working quantity (can be modified)
        qi.quantity AS original_quantity, -- Preserve original from quote
        qi.description,
        qi.cost_scope,
        qi.markup_pct,
        'pending'::text,                -- Initial status
        0,                              -- Initial progress
        p_member_id                     -- Who created
    FROM quote_items qi
    WHERE qi.quote_id = p_quote_id;
    
    GET DIAGNOSTICS v_tasks_created = ROW_COUNT;
    
    -- ========================================
    -- 4. UPDATE QUOTE STATUS to approved
    -- ========================================
    UPDATE quotes
    SET 
        status = 'approved',
        approved_at = NOW(),
        approved_by = p_member_id,
        updated_at = NOW(),
        updated_by = p_member_id
    WHERE id = p_quote_id;
    
    -- ========================================
    -- 5. RETURN SUCCESS
    -- ========================================
    RETURN jsonb_build_object(
        'success', true,
        'quote_id', p_quote_id,
        'project_id', v_quote.project_id,
        'tasks_created', v_tasks_created,
        'approved_at', NOW(),
        'approved_by', p_member_id
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback happens automatically
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNEXPECTED_ERROR',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
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
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  admin_role_id uuid;
  editor_role_id uuid;
  viewer_role_id uuid;
begin
  -- ============================================================
  -- 1. Obtener roles de la organización
  -- ============================================================
  select id into admin_role_id
  from public.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) = 'administrador';

  select id into editor_role_id
  from public.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) = 'editor';

  select id into viewer_role_id
  from public.roles
  where organization_id = p_organization_id
    and is_system = false
    and lower(name) in ('viewer', 'lector');

  -- ============================================================
  -- 2. ADMIN → todos los permisos organizacionales
  -- (excluye sistema/admin global)
  -- ============================================================
  insert into public.role_permissions (role_id, permission_id)
  select
    admin_role_id,
    p.id
  from public.permissions p
  where p.category <> 'admin'
  on conflict do nothing;

  -- ============================================================
  -- 3. EDITOR → view + manage
  -- + billing.view
  -- + general_costs.manage
  -- - sin organization / admin
  -- ============================================================
  insert into public.role_permissions (role_id, permission_id)
  select
    editor_role_id,
    p.id
  from public.permissions p
  where
    (
      p.key like '%.view'
      or p.key like '%.manage'
      or p.key = 'billing.view'
      or p.key = 'general_costs.manage'
    )
    and p.category not in (
      'admin',
      'organization'
    )
  on conflict do nothing;

  -- ============================================================
  -- 4. VIEWER → solo view
  -- ============================================================
  insert into public.role_permissions (role_id, permission_id)
  select
    viewer_role_id,
    p.id
  from public.permissions p
  where
    p.key like '%.view'
    and p.category <> 'admin'
  on conflict do nothing;

end;
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
 SET search_path TO 'public'
AS $function$
  select
    public.is_admin()
    or (
      not public.is_demo_org(p_organization_id)
      and public.is_org_member(p_organization_id)
      and public.has_permission(p_organization_id, p_permission_key)
    );
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
 SET search_path TO 'public'
AS $function$
  SELECT
    is_admin()
    -- Miembros con permiso mutan via can_mutate_org
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = p_project_id
        AND can_mutate_org(p.organization_id, p_permission_key)
    )
    -- Actores con access_level editor o admin
    OR EXISTS (
      SELECT 1 FROM project_access pa
      WHERE pa.project_id = p_project_id
        AND pa.user_id = current_user_id()
        AND pa.is_active = true
        AND pa.is_deleted = false
        AND pa.access_level IN ('editor', 'admin')
    );
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
    SELECT
        -- Admins ven todo
        is_admin()
        -- Miembros de la org ven todo
        OR EXISTS (
            SELECT 1 FROM projects p
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = p_project_id
                AND om.user_id = current_user_id()
                AND om.is_active = true
        )
        -- Actores con acceso al proyecto:
        -- Si client_id IS NULL → ve todo (director de obra, etc.)
        -- Si client_id = p_client_id → ve los datos de ese cliente
        OR EXISTS (
            SELECT 1 FROM project_access pa
            WHERE pa.project_id = p_project_id
                AND pa.user_id = current_user_id()
                AND pa.is_active = true
                AND pa.is_deleted = false
                AND (pa.client_id IS NULL OR pa.client_id = p_client_id)
        );
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
 SET search_path TO 'public'
AS $function$
  SELECT
    is_admin()
    OR is_demo_org(p_organization_id)
    OR (
      is_org_member(p_organization_id)
      AND has_permission(p_organization_id, p_permission_key)
    )
    OR external_has_scope(p_organization_id, p_permission_key);
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
 SET search_path TO 'public'
AS $function$
  SELECT
    is_admin()
    OR is_demo_org(p_organization_id)
    OR is_org_member(p_organization_id)
    OR is_external_actor(p_organization_id);
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
 SET search_path TO 'public'
AS $function$
  SELECT
    is_admin()
    -- Miembros de la org ven todos los proyectos de su org
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = p_project_id
        AND om.user_id = current_user_id()
        AND om.is_active = true
    )
    -- Actores con acceso explícito al proyecto (externos, clientes, empleados)
    OR EXISTS (
      SELECT 1 FROM project_access pa
      WHERE pa.project_id = p_project_id
        AND pa.user_id = current_user_id()
        AND pa.is_active = true
        AND pa.is_deleted = false
    );
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
AS $function$
DECLARE
    v_current_count INT;
    v_max_allowed INT;
    v_plan_features JSONB;
BEGIN
    -- 1. Contar proyectos activos de la organización (excluyendo el proyecto actual si se proporciona)
    SELECT COUNT(*)
    INTO v_current_count
    FROM projects
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND is_deleted = false
      AND (p_excluded_project_id IS NULL OR id != p_excluded_project_id);

    -- 2. Obtener el límite del plan
    SELECT p.features
    INTO v_plan_features
    FROM organizations o
    JOIN plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    -- Si no hay plan o features, asumir ilimitado
    IF v_plan_features IS NULL THEN
        v_max_allowed := -1;
    ELSE
        v_max_allowed := COALESCE((v_plan_features->>'max_active_projects')::INT, -1);
    END IF;

    -- 3. Retornar resultado
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
