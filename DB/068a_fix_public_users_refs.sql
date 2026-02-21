-- ============================================================================
-- FIX: Cross-schema references to users, user_data, user_presence,
--      user_view_history, user_preferences
-- ============================================================================
-- These tables were migrated from `public` to `iam` schema.
-- Many functions still reference `public.users` etc, causing:
--   ERROR 42P01: relation "public.users" does not exist
--
-- This script updates all affected functions to use `iam.*` references.
--
-- Affected schemas: iam (7 functions), public (4 functions)
-- Total references fixed: ~20
-- ============================================================================

-- ============================================================================
-- 1. IAM SCHEMA FUNCTIONS
-- ============================================================================

-- 1.1 iam.current_user_id  (THE MOST CRITICAL — used by ALL RLS)
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
$function$;


-- 1.2 iam.handle_new_user
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
end;$function$;


-- 1.3 iam.handle_updated_by_organizations
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
$function$;


-- 1.4 iam.ensure_contact_for_user
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
$function$;


-- 1.5 iam.fill_user_data_user_id_from_auth
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
$function$;


-- 1.6 iam.get_invitation_by_token  (fix: public.users → iam.users, public.roles → iam.roles)
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
$function$;


-- 1.7 iam.get_user  (fix: public.users → iam.users)
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
$function$;


-- ============================================================================
-- 2. PUBLIC SCHEMA FUNCTIONS
-- ============================================================================

-- 2.1 public.analytics_track_navigation  (fix: public.users, public.user_view_history, public.user_presence → iam.*)
CREATE OR REPLACE FUNCTION public.analytics_track_navigation(p_org_id uuid, p_view_name text, p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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


-- 2.2 public.heartbeat  (fix: public.users, public.user_presence, public.user_view_history → iam.*)
CREATE OR REPLACE FUNCTION public.heartbeat(p_org_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'online'::text, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
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


-- 2.3 public.handle_updated_by  (fix: public.users → iam.users)
CREATE OR REPLACE FUNCTION public.handle_updated_by()
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
    
    -- Si no hay usuario logueado (ej. seeders o sistema), no hacemos nada
    IF current_uid IS NULL THEN
        RETURN NEW;
    END IF;
    -- Buscamos el ID del miembro dentro de la organización
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid
      AND om.organization_id = NEW.organization_id
    LIMIT 1;
    -- Si encontramos al miembro, sellamos el registro
    IF resolved_member_id IS NOT NULL THEN
        -- Si es INSERT, llenamos el creador
        IF (TG_OP = 'INSERT') THEN
            NEW.created_by := resolved_member_id;
        END IF;
        -- SIEMPRE actualizamos el editor
        NEW.updated_by := resolved_member_id;
    END IF;
    RETURN NEW;
END;
$function$;


-- 2.4 public.handle_import_batch_member_id  (fix: public.users → iam.users)
CREATE OR REPLACE FUNCTION public.handle_import_batch_member_id()
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
    IF current_uid IS NULL THEN RETURN NEW; END IF;

    -- Resolver member_id: auth.uid() -> users.auth_id -> users.id -> organization_members.user_id
    SELECT om.id INTO resolved_member_id
    FROM iam.organization_members om
    JOIN iam.users u ON u.id = om.user_id
    WHERE u.auth_id = current_uid 
      AND om.organization_id = NEW.organization_id
    LIMIT 1;

    IF resolved_member_id IS NOT NULL THEN
        NEW.member_id := resolved_member_id;
    END IF;
    
    RETURN NEW;
END;
$function$;


-- ============================================================================
-- 3. IAM FUNCTIONS: step_create_user, step_create_user_data,
--    step_create_user_acquisition
-- ============================================================================

-- 3.1 iam.step_create_user  (fix: INSERT INTO public.users → iam.users)
CREATE OR REPLACE FUNCTION iam.step_create_user(p_auth_user_id uuid, p_email text, p_full_name text, p_avatar_url text, p_avatar_source avatar_source_t, p_role_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO iam.users (
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
$function$;


-- 3.2 iam.step_create_user_data  (fix: INSERT INTO public.user_data → iam.user_data)
CREATE OR REPLACE FUNCTION iam.step_create_user_data(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
BEGIN
  INSERT INTO iam.user_data (id, user_id, created_at)
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
$function$;


-- 3.3 iam.step_create_user_acquisition  (fix: INSERT INTO public.user_acquisition → iam.user_acquisition)
CREATE OR REPLACE FUNCTION iam.step_create_user_acquisition(p_user_id uuid, p_raw_meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam'
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

  INSERT INTO iam.user_acquisition (
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
end;$function$;
