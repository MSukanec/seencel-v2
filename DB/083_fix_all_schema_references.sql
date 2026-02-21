-- ============================================================================
-- 083: Fix ALL broken schema references after migration
-- ============================================================================
-- Context: Multiple functions still reference public.* for tables that were 
-- migrated to dedicated schemas (iam, billing, finance, projects, catalog, 
-- notifications, audit, planner, academy, ops).
-- ============================================================================

-- ============================================================================
-- 🔴 PRIORITY: CRITICAL — Blocks payments/subscriptions
-- ============================================================================

-- 1. billing.check_active_project_limit
-- Fix: public.projects → projects.projects
CREATE OR REPLACE FUNCTION billing.check_active_project_limit(p_organization_id uuid, p_excluded_project_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'iam', 'public'
AS $function$
DECLARE
    v_current_count INT;
    v_max_allowed INT;
    v_plan_features JSONB;
BEGIN
    SELECT COUNT(*)
    INTO v_current_count
    FROM projects.projects
    WHERE organization_id = p_organization_id
      AND status = 'active'
      AND is_deleted = false
      AND (p_excluded_project_id IS NULL OR id != p_excluded_project_id);

    SELECT p.features
    INTO v_plan_features
    FROM iam.organizations o
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
$function$;


-- 2. iam.is_demo_org
-- Fix: public.organizations → iam.organizations
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
$function$;


-- 3. iam.step_create_organization (4-param version with business_mode)
-- Fix: public.organizations → iam.organizations, search_path
CREATE OR REPLACE FUNCTION iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'billing'
AS $function$
DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO iam.organizations (
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
$function$;


-- 4. iam.handle_new_organization
-- Fix: public.organizations → iam.organizations
-- Fix: public.step_* → iam.step_*
CREATE OR REPLACE FUNCTION iam.handle_new_organization(p_user_id uuid, p_organization_name text, p_business_mode text DEFAULT 'professional'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'billing'
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
  FROM iam.organizations
  WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
      USING ERRCODE = 'P0001';
  END IF;

  v_org_id := iam.step_create_organization(p_user_id, p_organization_name, v_plan_free_id, p_business_mode);

  PERFORM iam.step_create_organization_data(v_org_id);
  PERFORM iam.step_create_organization_roles(v_org_id);

  SELECT id INTO v_admin_role_id
  FROM iam.roles
  WHERE organization_id = v_org_id AND name = 'Administrador' AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  PERFORM iam.step_add_org_member(p_user_id, v_org_id, v_admin_role_id);
  PERFORM iam.step_assign_org_role_permissions(v_org_id);
  PERFORM iam.step_create_organization_currencies(v_org_id, v_default_currency_id);
  PERFORM iam.step_create_organization_wallets(v_org_id, v_default_wallet_id);
  PERFORM iam.step_create_organization_preferences(
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
$function$;


-- 5. iam.accept_client_invitation
-- Fix: public.organizations → iam.organizations
-- Fix: public.project_access → iam.project_access
-- Fix: public.user_preferences → iam.user_preferences
-- Fix: public.user_organization_preferences → iam.user_organization_preferences
CREATE OR REPLACE FUNCTION iam.accept_client_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
    v_existing_client RECORD;
    v_client_record_id uuid;
BEGIN
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
    JOIN iam.organizations o ON o.id = i.organization_id
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

    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

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

    IF v_invitation.project_id IS NOT NULL THEN
        INSERT INTO iam.project_access (
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

    UPDATE iam.user_preferences
    SET last_organization_id = v_invitation.organization_id
    WHERE user_id = p_user_id;

    INSERT INTO iam.user_organization_preferences (
        user_id, organization_id, updated_at
    ) VALUES (
        p_user_id, v_invitation.organization_id, NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'already_client', (v_existing_client IS NOT NULL AND v_existing_client.is_active),
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'project_id', v_invitation.project_id
    );
END;
$function$;


-- 6. iam.accept_external_invitation
-- Fix: public.organizations → iam.organizations
-- Fix: public.project_access → iam.project_access
-- Fix: public.user_preferences → iam.user_preferences
-- Fix: public.user_organization_preferences → iam.user_organization_preferences
CREATE OR REPLACE FUNCTION iam.accept_external_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
    v_invitation RECORD;
    v_existing_actor RECORD;
    v_actor_id uuid;
BEGIN
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
    JOIN iam.organizations o ON o.id = i.organization_id
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

    IF v_invitation.status NOT IN ('pending', 'registered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

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

    IF v_invitation.project_id IS NOT NULL THEN
        INSERT INTO iam.project_access (
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

    UPDATE iam.user_preferences
    SET last_organization_id = v_invitation.organization_id
    WHERE user_id = p_user_id;

    INSERT INTO iam.user_organization_preferences (
        user_id, organization_id, updated_at
    ) VALUES (
        p_user_id, v_invitation.organization_id, NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'already_actor', (v_existing_actor IS NOT NULL AND v_existing_actor.is_active),
        'organization_id', v_invitation.organization_id,
        'org_name', v_invitation.org_name,
        'project_id', v_invitation.project_id
    );
END;
$function$;


-- 7. iam.accept_organization_invitation
-- Fix: public.organizations → iam.organizations
-- Fix: public.plans → billing.plans
-- Fix: public.organization_member_events → billing.organization_member_events
CREATE OR REPLACE FUNCTION iam.accept_organization_invitation(p_token text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'billing'
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
    JOIN iam.organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
    LIMIT 1;

    IF v_invitation.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_not_found',
            'message', 'Invitación no encontrada'
        );
    END IF;

    IF v_invitation.status != 'registered' AND v_invitation.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_already_used',
            'message', 'Esta invitación ya fue utilizada'
        );
    END IF;

    IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invitation_expired',
            'message', 'Esta invitación ha expirado'
        );
    END IF;

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

    SELECT id INTO v_inactive_member_id
    FROM iam.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND user_id = p_user_id
      AND is_active = false;

    SELECT 
        COALESCE((p.features->>'seats_included')::integer, 1) + COALESCE(org.purchased_seats, 0)
    INTO v_seat_capacity
    FROM iam.organizations org
    JOIN billing.plans p ON p.id = org.plan_id
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

    UPDATE iam.organization_invitations
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        user_id = p_user_id
    WHERE id = v_invitation.id;

    INSERT INTO billing.organization_member_events (
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
$function$;


-- ============================================================================
-- 🟡 PRIORITY: HIGH — Core functionality broken
-- ============================================================================

-- 8. iam.can_mutate_project
-- Fix: public.projects → projects.projects
CREATE OR REPLACE FUNCTION iam.can_mutate_project(p_project_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iam', 'projects'
AS $function$
  SELECT
    iam.is_admin()
    OR EXISTS (
      SELECT 1 FROM projects.projects p
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
$function$;


-- 9. iam.ensure_contact_for_user
-- Fix: public.contacts → projects.contacts
CREATE OR REPLACE FUNCTION iam.ensure_contact_for_user(p_organization_id uuid, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'projects'
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
  from projects.contacts c
  where c.organization_id = p_organization_id
    and c.linked_user_id = v_user.id
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    update projects.contacts c
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
  from projects.contacts c
  where c.organization_id = p_organization_id
    and c.email = v_user.email
    and c.linked_user_id is null
    and c.is_deleted = false
  limit 1;

  if v_contact_id is not null then
    update projects.contacts c
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

  insert into projects.contacts (
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
$function$;


-- 10. iam.merge_contacts
-- Fix: ALL public.* refs to their correct schemas
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
$function$;


-- 11. iam.protect_linked_contact_delete
-- Fix: ALL public.* refs to their correct schemas
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
$function$;


-- 12. notifications.notify_subscription_activated
-- Fix: public.organizations → iam.organizations
CREATE OR REPLACE FUNCTION notifications.notify_subscription_activated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'notifications', 'iam'
AS $function$
DECLARE
    v_plan_name text;
    v_owner_id uuid;
    v_is_upgrade boolean := false;
    v_previous_plan text;
    v_title_owner text;
    v_body_owner text;
    v_title_admin text;
    v_body_admin text;
    v_billing_label text;
BEGIN
    IF NEW.status = 'active' THEN
        
        SELECT name INTO v_plan_name
        FROM billing.plans
        WHERE id = NEW.plan_id;
        
        SELECT owner_id INTO v_owner_id
        FROM iam.organizations
        WHERE id = NEW.organization_id;

        v_billing_label := CASE 
            WHEN NEW.billing_period = 'annual' THEN 'anual'
            ELSE 'mensual'
        END;
        
        SELECT p.name INTO v_previous_plan
        FROM billing.organization_subscriptions s
        JOIN billing.plans p ON p.id = s.plan_id
        WHERE s.organization_id = NEW.organization_id
          AND s.id != NEW.id
          AND s.status IN ('expired', 'cancelled')
        ORDER BY s.created_at DESC
        LIMIT 1;
        
        v_is_upgrade := (v_previous_plan IS NOT NULL);
        
        IF v_is_upgrade THEN
            v_title_owner := '⬆️ ¡Plan Mejorado!';
            v_body_owner := 'Tu plan fue mejorado a ' || COALESCE(v_plan_name, '') || '. ¡A disfrutarlo! 🚀';
            v_title_admin := '⬆️ Upgrade de Plan';
            v_body_admin := 'Organización mejoró de ' || COALESCE(v_previous_plan, '?') || ' a ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        ELSE
            v_title_owner := '¡Plan Activado!';
            v_body_owner := 'Tu plan ' || COALESCE(v_plan_name, '') || ' está activo. ¡Hora de construir! 🚀';
            v_title_admin := '💰 Nueva Suscripción';
            v_body_admin := 'Organización activó plan ' || COALESCE(v_plan_name, '') || ' (' || v_billing_label || ') por ' || NEW.amount || ' ' || NEW.currency;
        END IF;
        
        IF v_owner_id IS NOT NULL THEN
            PERFORM notifications.send_notification(
                v_owner_id,
                'success',
                v_title_owner,
                v_body_owner,
                jsonb_build_object(
                    'subscription_id', NEW.id,
                    'plan_id', NEW.plan_id,
                    'plan_name', v_plan_name,
                    'billing_period', NEW.billing_period,
                    'is_upgrade', v_is_upgrade,
                    'url', '/organization/settings?tab=billing'
                ),
                'direct'
            );
        END IF;
        
        PERFORM notifications.send_notification(
            NULL,
            'info',
            v_title_admin,
            v_body_admin,
            jsonb_build_object(
                'subscription_id', NEW.id,
                'organization_id', NEW.organization_id,
                'plan_name', v_plan_name,
                'billing_period', NEW.billing_period,
                'amount', NEW.amount,
                'currency', NEW.currency,
                'is_upgrade', v_is_upgrade,
                'previous_plan', v_previous_plan
            ),
            'admins'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;


-- 13. notifications.notify_quote_status_change
-- Fix: public.projects → projects.projects, public.project_clients → projects.project_clients
CREATE OR REPLACE FUNCTION notifications.notify_quote_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'construction', 'projects'
AS $function$
DECLARE
    v_project_name TEXT;
    v_client_name TEXT;
    v_quote_name TEXT;
    v_notification_type TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
    v_project_id UUID;
BEGIN
    IF NEW.status IN ('approved', 'rejected') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

        SELECT p.name, c.name, NEW.name, p.id
        INTO v_project_name, v_client_name, v_quote_name, v_project_id
        FROM projects.projects p
        LEFT JOIN projects.project_clients c ON NEW.client_id = c.id
        WHERE p.id = NEW.project_id;

        IF NEW.status = 'approved' THEN
            v_notification_type := 'success';
            v_notification_title := '✅ Presupuesto Aprobado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') ||
                ' aprobó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') ||
                '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';
        ELSE
            v_notification_type := 'warning';
            v_notification_title := '❌ Presupuesto Rechazado';
            v_notification_body := COALESCE(v_client_name, 'Un cliente') ||
                ' rechazó el presupuesto "' || COALESCE(v_quote_name, 'Sin nombre') ||
                '" del proyecto ' || COALESCE(v_project_name, 'Sin nombre') || '.';

            IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason != '' THEN
                v_notification_body := v_notification_body ||
                    ' Motivo: "' || NEW.rejection_reason || '"';
            END IF;
        END IF;

        PERFORM notifications.send_notification(
            NULL,
            v_notification_type,
            v_notification_title,
            v_notification_body,
            jsonb_build_object(
                'quote_id', NEW.id,
                'project_id', v_project_id,
                'client_id', NEW.client_id,
                'status', NEW.status,
                'url', '/project/' || v_project_id || '/quotes'
            ),
            'admins'
        );
    END IF;

    RETURN NEW;
END;
$function$;


-- 14. notifications.notify_system_error
-- Fix: public.organizations → iam.organizations
CREATE OR REPLACE FUNCTION notifications.notify_system_error()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'iam', 'billing'
AS $function$
DECLARE
    v_user_name text := NULL;
    v_user_email text := NULL;
    v_org_name text := NULL;
    v_body text;
    v_context_parts text[] := ARRAY[]::text[];
BEGIN
    IF NEW.severity NOT IN ('error', 'critical') THEN
        RETURN NEW;
    END IF;

    IF NEW.context ? 'user_id' AND (NEW.context->>'user_id') IS NOT NULL THEN
        SELECT u.full_name, u.email
        INTO v_user_name, v_user_email
        FROM iam.users u
        WHERE u.id = (NEW.context->>'user_id')::uuid;
    END IF;

    IF NEW.context ? 'organization_id' AND (NEW.context->>'organization_id') IS NOT NULL THEN
        SELECT o.name
        INTO v_org_name
        FROM iam.organizations o
        WHERE o.id = (NEW.context->>'organization_id')::uuid;
    END IF;

    v_body := NEW.function_name || ': ' || LEFT(NEW.error_message, 100);

    IF v_org_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Org: ' || v_org_name);
    END IF;

    IF v_user_name IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_name);
    ELSIF v_user_email IS NOT NULL THEN
        v_context_parts := array_append(v_context_parts, 'Usuario: ' || v_user_email);
    END IF;

    IF array_length(v_context_parts, 1) > 0 THEN
        v_body := v_body || ' (' || array_to_string(v_context_parts, ' | ') || ')';
    END IF;

    PERFORM notifications.send_notification(
        NULL,
        CASE 
            WHEN NEW.severity = 'critical' THEN 'error'
            ELSE 'warning'
        END,
        CASE
            WHEN NEW.severity = 'critical' THEN '🚨 Error Crítico'
            ELSE '⚠️ Error del Sistema'
        END,
        v_body,
        jsonb_build_object(
            'error_id', NEW.id,
            'domain', NEW.domain,
            'entity', NEW.entity,
            'function_name', NEW.function_name,
            'severity', NEW.severity,
            'url', '/admin/monitoring'
        ),
        'admins'
    );

    RETURN NEW;
END;
$function$;


-- 15. notifications.queue_purchase_email
-- Fix: public.email_queue → notifications.email_queue
CREATE OR REPLACE FUNCTION notifications.queue_purchase_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'notifications', 'billing', 'academy', 'iam'
AS $function$
DECLARE
    v_user_email text;
    v_user_name text;
    v_product_name text;
    v_subject_user text;
    v_subject_admin text;
BEGIN
    -- Solo pagos completados
    IF NEW.status <> 'completed' THEN
        RETURN NEW;
    END IF;

    -- Obtener datos del usuario
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM iam.users
    WHERE id = NEW.user_id;

    IF v_user_email IS NULL THEN
        RAISE NOTICE 'queue_purchase_email: Usuario % no encontrado', NEW.user_id;
        RETURN NEW;
    END IF;

    -- Obtener nombre del producto desde metadata (enriquecida por los handlers)
    v_product_name := NEW.metadata->>'product_name';

    -- Fallback: construir nombre si no está en metadata
    IF v_product_name IS NULL THEN
        CASE NEW.product_type
            WHEN 'course' THEN
                SELECT title INTO v_product_name FROM academy.courses WHERE id = NEW.course_id;
                v_product_name := COALESCE(v_product_name, 'Curso');
            WHEN 'subscription' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := COALESCE(v_product_name, 'Plan');
            WHEN 'upgrade' THEN
                SELECT name INTO v_product_name FROM billing.plans WHERE id = NEW.product_id;
                v_product_name := 'Upgrade a ' || COALESCE(v_product_name, 'Plan');
            WHEN 'seat_purchase' THEN
                v_product_name := COALESCE(NEW.metadata->>'seats_purchased', '?') || ' asiento(s) adicional(es)';
            ELSE
                v_product_name := 'Producto';
        END CASE;
    END IF;

    -- Construir subjects
    v_subject_user := CASE NEW.product_type
        WHEN 'course' THEN '¡Tu curso está listo!'
        WHEN 'subscription' THEN '¡Bienvenido a SEENCEL ' || v_product_name || '!'
        WHEN 'upgrade' THEN '¡Plan mejorado!'
        ELSE 'Confirmación de compra'
    END;
    v_subject_admin := '💰 Nueva venta: ' || v_product_name;

    -- Email al comprador
    INSERT INTO notifications.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        v_user_email,
        COALESCE(v_user_name, 'Usuario'),
        'purchase_confirmation',
        v_subject_user,
        jsonb_build_object(
            'user_id', NEW.user_id, 'user_email', v_user_email,
            'user_name', v_user_name, 'product_type', NEW.product_type,
            'product_name', v_product_name, 'amount', NEW.amount,
            'currency', NEW.currency, 'payment_id', NEW.id,
            'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    -- Email al admin
    INSERT INTO notifications.email_queue (
        recipient_email, recipient_name, template_type, subject, data, created_at
    ) VALUES (
        'contacto@seencel.com',
        'Admin SEENCEL',
        'admin_sale_notification',
        v_subject_admin,
        jsonb_build_object(
            'buyer_email', v_user_email, 'buyer_name', v_user_name,
            'product_type', NEW.product_type, 'product_name', v_product_name,
            'amount', NEW.amount, 'currency', NEW.currency,
            'payment_id', NEW.id, 'provider', COALESCE(NEW.provider, NEW.gateway)
        ),
        NOW()
    );

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'queue_purchase_email error: %', SQLERRM;
    RETURN NEW;
END;
$function$;


-- ============================================================================
-- 🟢 PRIORITY: MEDIUM — Audit functions (mass fix)
-- All audit.log_* functions use public.organization_activity_logs
-- which is now audit.organization_activity_logs
-- ============================================================================
-- NOTE: These are 51 functions. Given the volume, we'll do a targeted approach
-- using the most common pattern. Each function follows the same pattern:
-- INSERT INTO public.organization_activity_logs → INSERT INTO audit.organization_activity_logs

-- The approach: Since all audit functions use the same table reference,
-- we'll fix the search_path of each function to include 'audit' as the primary schema.
-- This way, unqualified references to organization_activity_logs will resolve correctly.
-- 
-- HOWEVER: The functions explicitly write `public.organization_activity_logs`.
-- So we actually need to CREATE OR REPLACE each one.
-- 
-- Given there are 51 functions, we'll use a DO block to update them in bulk.

DO $$
DECLARE
    func_record RECORD;
    func_source TEXT;
    new_source TEXT;
BEGIN
    -- Find all audit functions that reference public.organization_activity_logs
    FOR func_record IN
        SELECT p.proname, pg_get_functiondef(p.oid) as funcdef
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'audit'
          AND pg_get_functiondef(p.oid) LIKE '%public.organization_activity_logs%'
    LOOP
        new_source := replace(func_record.funcdef, 'public.organization_activity_logs', 'audit.organization_activity_logs');
        EXECUTE new_source;
        RAISE NOTICE 'Fixed: audit.%', func_record.proname;
    END LOOP;
END;
$$;

-- Also fix audit functions that reference public.users, public.project_labor, public.contacts
DO $$
DECLARE
    func_record RECORD;
    func_source TEXT;
    new_source TEXT;
BEGIN
    FOR func_record IN
        SELECT p.proname, pg_get_functiondef(p.oid) as funcdef
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'audit'
          AND (
            pg_get_functiondef(p.oid) LIKE '%public.users%'
            OR pg_get_functiondef(p.oid) LIKE '%public.project_labor%'
            OR pg_get_functiondef(p.oid) LIKE '%public.contacts%'
          )
    LOOP
        new_source := func_record.funcdef;
        new_source := replace(new_source, 'public.users', 'iam.users');
        new_source := replace(new_source, 'public.project_labor', 'projects.project_labor');
        new_source := replace(new_source, 'public.contacts', 'projects.contacts');
        EXECUTE new_source;
        RAISE NOTICE 'Fixed refs in: audit.%', func_record.proname;
    END LOOP;
END;
$$;

-- Fix the public.audit_subcontract_payments function that refs public.organization_activity_logs
DO $$
DECLARE
    func_record RECORD;
    new_source TEXT;
BEGIN
    FOR func_record IN
        SELECT p.proname, pg_get_functiondef(p.oid) as funcdef
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'audit_subcontract_payments'
    LOOP
        new_source := replace(func_record.funcdef, 'public.organization_activity_logs', 'audit.organization_activity_logs');
        new_source := replace(new_source, 'public.subcontracts', 'finance.subcontracts');
        EXECUTE new_source;
        RAISE NOTICE 'Fixed: public.audit_subcontract_payments';
    END LOOP;
END;
$$;
