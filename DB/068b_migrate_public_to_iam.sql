-- ============================================================
-- 068b: Migrar funciones de public → iam
-- ============================================================
-- Funciones afectadas:
--   assign_default_permissions_to_org_roles, dismiss_home_banner,
--   ensure_contact_for_user, handle_new_external_actor_contact,
--   handle_new_organization, handle_new_user,
--   handle_registered_invitation, heartbeat, analytics_track_navigation,
--   merge_contacts, protect_linked_contact_delete,
--   step_create_user, step_create_user_acquisition, step_create_user_data,
--   step_create_user_organization_preferences, step_create_user_preferences,
--   step_add_org_member, step_assign_org_role_permissions,
--   step_create_organization_roles, step_organization_increment_seats,
--   sync_role_permission_org_id, tick_home_checklist,
--   update_contact_category_links_updated_at
-- ============================================================

BEGIN;

-- ============================================================
-- PARTE 1: Actualizar callers en IAM que todavía usan public.*
-- ============================================================

-- 1a. iam.handle_new_user() → cambiar public.step_* → iam.step_*
CREATE OR REPLACE FUNCTION iam.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public', 'billing'
AS $function$
declare
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
    FROM iam.users
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
  v_user_id := iam.step_create_user(
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
  PERFORM iam.step_create_user_acquisition(
    v_user_id,
    NEW.raw_user_meta_data
  );

  ----------------------------------------------------------------
  -- 3) User data
  ----------------------------------------------------------------
  PERFORM iam.step_create_user_data(v_user_id);

  ----------------------------------------------------------------
  -- 4) User preferences (sin org — se asigna después)
  ----------------------------------------------------------------
  PERFORM iam.step_create_user_preferences(v_user_id);

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
end;$function$;


-- 1b. iam.accept_client_invitation → cambiar public.ensure_contact_for_user → iam.ensure_contact_for_user
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
$function$;


-- 1b2. iam.accept_external_invitation → cambiar public.ensure_contact_for_user → iam.ensure_contact_for_user
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
$function$;


-- 1c. iam.handle_new_org_member_contact → cambiar public.ensure_contact_for_user → iam.ensure_contact_for_user
CREATE OR REPLACE FUNCTION iam.handle_new_org_member_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
begin
  perform iam.ensure_contact_for_user(new.organization_id, new.user_id);
  return new;
end;$function$;


-- ============================================================
-- PARTE 2: Crear en IAM las funciones que solo existían en public
-- ============================================================

-- 2a. heartbeat → crear en iam
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
$function$;


-- 2b. analytics_track_navigation → crear en iam
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
$function$;


-- 2c. merge_contacts → crear en iam
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
$function$;


-- 2d. protect_linked_contact_delete → crear en iam
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
$function$;


-- 2e. handle_new_external_actor_contact → crear en iam
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
$function$;


-- 2f. handle_registered_invitation ya existe en iam, pero actualizar para usar iam.ensure_contact_for_user
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
$function$;


-- 2g. sync_role_permission_org_id → crear en iam
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
$function$;


-- 2h. update_contact_category_links_updated_at → crear en iam
CREATE OR REPLACE FUNCTION iam.update_contact_category_links_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;


-- 2i. tick_home_checklist → ya existe en iam, solo DROP el wrapper


-- ============================================================
-- PARTE 3: Actualizar triggers para apuntar a iam.*
-- ============================================================

-- 3a. auth.users trigger → apuntar a iam.handle_new_user()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION iam.handle_new_user();


-- 3b. iam.organization_external_actors → apuntar a iam.handle_new_external_actor_contact()
DROP TRIGGER IF EXISTS trigger_create_contact_on_new_external_actor ON iam.organization_external_actors;
CREATE TRIGGER trigger_create_contact_on_new_external_actor
  AFTER INSERT ON iam.organization_external_actors
  FOR EACH ROW
  EXECUTE FUNCTION iam.handle_new_external_actor_contact();


-- 3c. iam.organization_invitations → apuntar a iam.handle_registered_invitation()
DROP TRIGGER IF EXISTS trigger_create_contact_on_registered_invitation ON iam.organization_invitations;
CREATE TRIGGER trigger_create_contact_on_registered_invitation
  AFTER INSERT ON iam.organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION iam.handle_registered_invitation();


-- 3d. projects.contacts → apuntar a iam.protect_linked_contact_delete()
DROP TRIGGER IF EXISTS trigger_protect_linked_contact_delete ON projects.contacts;
CREATE TRIGGER trigger_protect_linked_contact_delete
  BEFORE UPDATE ON projects.contacts
  FOR EACH ROW
  EXECUTE FUNCTION iam.protect_linked_contact_delete();


-- 3e. projects.contact_category_links → apuntar a iam.update_contact_category_links_updated_at()
DROP TRIGGER IF EXISTS trigger_contact_category_links_updated_at ON projects.contact_category_links;
CREATE TRIGGER trigger_contact_category_links_updated_at
  BEFORE UPDATE ON projects.contact_category_links
  FOR EACH ROW
  EXECUTE FUNCTION iam.update_contact_category_links_updated_at();


-- 3f. iam.role_permissions → apuntar a iam.sync_role_permission_org_id()
DROP TRIGGER IF EXISTS trg_role_permissions_sync_org ON iam.role_permissions;
CREATE TRIGGER trg_role_permissions_sync_org
  BEFORE INSERT ON iam.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION iam.sync_role_permission_org_id();


-- ============================================================
-- PARTE 4: DROP funciones de public
-- ============================================================

-- Wrappers puros (Grupo A)
DROP FUNCTION IF EXISTS public.assign_default_permissions_to_org_roles(uuid);
DROP FUNCTION IF EXISTS public.dismiss_home_banner();
DROP FUNCTION IF EXISTS public.tick_home_checklist(text, boolean);
DROP FUNCTION IF EXISTS public.step_create_user(uuid, text, text, text, public.avatar_source_t, uuid);
DROP FUNCTION IF EXISTS public.step_create_user_acquisition(uuid, jsonb);
DROP FUNCTION IF EXISTS public.step_create_user_data(uuid);
DROP FUNCTION IF EXISTS public.step_create_user_preferences(uuid);
DROP FUNCTION IF EXISTS public.step_create_user_organization_preferences(uuid, uuid);
DROP FUNCTION IF EXISTS public.step_add_org_member(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.step_assign_org_role_permissions(uuid);
DROP FUNCTION IF EXISTS public.step_create_organization_roles(uuid);
DROP FUNCTION IF EXISTS public.step_organization_increment_seats(uuid, integer);

-- Wrappers con RPC frontend (ya actualizamos frontend)
DROP FUNCTION IF EXISTS public.handle_new_organization(uuid, text, text);
DROP FUNCTION IF EXISTS public.merge_contacts(uuid, uuid, uuid);

-- Wrapper de handle_new_user (trigger ya apunta a iam)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Funciones migradas (Grupo C) - trigger ya apunta a iam
DROP FUNCTION IF EXISTS public.handle_new_external_actor_contact();
DROP FUNCTION IF EXISTS public.handle_registered_invitation();
DROP FUNCTION IF EXISTS public.protect_linked_contact_delete();
DROP FUNCTION IF EXISTS public.update_contact_category_links_updated_at();
DROP FUNCTION IF EXISTS public.sync_role_permission_org_id();

-- Funciones con lógica propia migradas (Grupo D)
DROP FUNCTION IF EXISTS public.heartbeat(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.analytics_track_navigation(uuid, text, uuid);

-- ensure_contact_for_user wrapper (ya existe en iam, callers actualizados)
DROP FUNCTION IF EXISTS public.ensure_contact_for_user(uuid, uuid);

COMMIT;
