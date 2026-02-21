-- ============================================================
-- 071: Migrar log_system_error de audit → ops + fix referencias
-- ============================================================
-- CONTEXTO:
--   1. log_system_error fue movida de public a audit, pero 20+ funciones
--      IAM/billing siguen llamándola como public.log_system_error → signup roto.
--   2. system_error_logs pertenece semánticamente a ops (infraestructura),
--      no a audit (actividad de producto).
--
-- ACCIONES:
--   A. DROP wrapper public.log_system_error (creado por error)
--   B. Mover tabla audit.system_error_logs → ops
--   C. Crear ops.log_system_error() + DROP audit.log_system_error()
--   D. Recrear ops.system_errors_enriched_view apuntando a ops
--   E. Actualizar TODAS las funciones IAM/billing: public.log_system_error → ops.log_system_error
-- ============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- A. DROP wrapper public.log_system_error
-- ══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.log_system_error(text, text, text, text, jsonb, text);

-- ══════════════════════════════════════════════════════════════
-- B. Mover tabla audit.system_error_logs → ops
--    (RLS, indexes y triggers siguen a la tabla automáticamente)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE audit.system_error_logs SET SCHEMA ops;

-- Permisos sobre la tabla movida
GRANT ALL ON ops.system_error_logs TO authenticated, service_role;

-- ══════════════════════════════════════════════════════════════
-- C. Crear ops.log_system_error() + DROP audit.log_system_error()
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION ops.log_system_error(
  p_domain text,
  p_entity text,
  p_function_name text,
  p_error_message text,
  p_context jsonb DEFAULT NULL::jsonb,
  p_severity text DEFAULT 'error'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'ops'
AS $function$
BEGIN
  INSERT INTO ops.system_error_logs (
    domain,
    entity,
    function_name,
    error_message,
    context,
    severity
  )
  VALUES (
    p_domain,
    p_entity,
    p_function_name,
    p_error_message,
    p_context,
    p_severity
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'log_system_error failed: %', SQLERRM;
END;
$function$;

DROP FUNCTION IF EXISTS audit.log_system_error(text, text, text, text, jsonb, text);

-- ══════════════════════════════════════════════════════════════
-- D. Recrear ops.system_errors_enriched_view → ops.system_error_logs
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW ops.system_errors_enriched_view AS
SELECT sel.id,
    sel.domain,
    sel.entity,
    sel.function_name,
    sel.error_message,
    sel.context,
    sel.severity,
    sel.created_at,
    ((sel.context ->> 'user_id'::text))::uuid AS context_user_id,
    u.email AS user_email,
    u.full_name AS user_name,
    ((sel.context ->> 'organization_id'::text))::uuid AS context_org_id,
    o.name AS org_name,
    pl.name AS plan_name,
    ((sel.context ->> 'amount'::text))::numeric AS payment_amount,
    (sel.context ->> 'currency'::text) AS payment_currency,
    (sel.context ->> 'provider'::text) AS payment_provider,
    (sel.context ->> 'course_id'::text) AS context_course_id,
    (sel.context ->> 'step'::text) AS error_step
   FROM (((ops.system_error_logs sel
     LEFT JOIN iam.users u ON ((u.id = ((sel.context ->> 'user_id'::text))::uuid)))
     LEFT JOIN iam.organizations o ON ((o.id = ((sel.context ->> 'organization_id'::text))::uuid)))
     LEFT JOIN billing.plans pl ON ((pl.id = o.plan_id)));

-- ══════════════════════════════════════════════════════════════
-- E. Actualizar funciones IAM/billing
--    Cambio: public.log_system_error → ops.log_system_error
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- E.1  iam.handle_new_user()
--      Versión actual de producción (inline, sin step_create_* externos)
-- ──────────────────────────────────────────────────────────────
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.2  iam.handle_new_organization()
-- ──────────────────────────────────────────────────────────────
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.3  iam.step_create_user_organization_preferences()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION iam.step_create_user_organization_preferences(p_user_id uuid, p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO iam.user_organization_preferences (id, user_id, organization_id, created_at, updated_at)
  VALUES (gen_random_uuid(), p_user_id, p_org_id, now(), now());
EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
      'trigger', 'step_create_user_organization_preferences', 'signup',
      SQLERRM, jsonb_build_object('user_id', p_user_id, 'org_id', p_org_id), 'critical'
    );
    RAISE;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.8a  iam.step_create_organization() (3 params — sin business_mode)
-- ──────────────────────────────────────────────────────────────
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
    PERFORM ops.log_system_error(
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.8b  iam.step_create_organization() (4 params — con business_mode)
-- ──────────────────────────────────────────────────────────────
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.9  iam.step_create_organization_data()
-- ──────────────────────────────────────────────────────────────
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
    PERFORM ops.log_system_error(
      'trigger',
      'step_create_organization_data',
      'signup',
      SQLERRM,
      jsonb_build_object('org_id', p_org_id),
      'critical'
    );
    RAISE;
END;
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.10  iam.step_create_organization_roles()
-- ──────────────────────────────────────────────────────────────
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
    PERFORM ops.log_system_error(
      'trigger', 'step_create_organization_roles', 'signup',
      SQLERRM, jsonb_build_object('org_id', p_org_id), 'critical'
    );
    RAISE;
END;$function$;

-- ──────────────────────────────────────────────────────────────
-- E.11  iam.step_create_organization_currencies()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_currencies (
    id, organization_id, currency_id, is_active, is_default, created_at
  )
  VALUES (
    gen_random_uuid(), p_org_id, p_currency_id, true, true, now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.12  iam.step_create_organization_wallets()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION iam.step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'iam'
AS $function$
BEGIN
  INSERT INTO public.organization_wallets (
    id, organization_id, wallet_id, is_active, is_default, created_at
  )
  VALUES (
    gen_random_uuid(), p_org_id, p_wallet_id, true, true, now()
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM ops.log_system_error(
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.13  iam.step_create_organization_preferences()
-- ──────────────────────────────────────────────────────────────
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
    PERFORM ops.log_system_error(
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- NOTA: iam.step_add_org_member() NO se modifica.
-- En producción usa debug_signup_log, no log_system_error.
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- E.14  iam.step_assign_org_role_permissions()
-- ──────────────────────────────────────────────────────────────
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
$function$;

-- ──────────────────────────────────────────────────────────────
-- E.16  billing.handle_member_seat_purchase()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION billing.handle_member_seat_purchase(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_seats_purchased integer, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
AS $function$DECLARE
    v_payment_id uuid;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'seat_purchase', p_plan_id, NULL, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'increment_seats';
    PERFORM public.step_organization_increment_seats(p_organization_id, p_seats_purchased);

    v_step := 'log_event';
    PERFORM public.step_log_seat_purchase_event(
        p_organization_id, p_user_id, p_seats_purchased,
        p_amount, p_currency, v_payment_id, true
    );

    v_step := 'send_email';
    PERFORM public.step_send_purchase_email(
        p_user_id, 'seat_purchase',
        p_seats_purchased || ' asiento(s) adicional(es)',
        p_amount, p_currency, v_payment_id, p_provider
    );

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'seats_added', p_seats_purchased
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM ops.log_system_error(
        'payment', 'seat_purchase', 'handle_member_seat_purchase',
        SQLERRM,
        jsonb_build_object(
            'step', v_step,
            'provider', p_provider,
            'provider_payment_id', p_provider_payment_id,
            'organization_id', p_organization_id,
            'seats', p_seats_purchased,
            'amount', p_amount
        ),
        'critical'
    );

    RETURN jsonb_build_object(
        'status', 'ok_with_warning',
        'payment_id', v_payment_id,
        'warning_step', v_step
    );
END;$function$;

-- ──────────────────────────────────────────────────────────────
-- E.17  billing.handle_payment_course_success()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION billing.handle_payment_course_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
AS $function$DECLARE
    v_payment_id uuid;
    v_course_name text;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, NULL,
        'course', NULL, p_course_id, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'course_enrollment_annual';
    PERFORM public.step_course_enrollment_annual(p_user_id, p_course_id);

    v_step := 'send_purchase_email';
    SELECT title INTO v_course_name FROM public.courses WHERE id = p_course_id;

    PERFORM public.step_send_purchase_email(
        p_user_id, 'course', COALESCE(v_course_name, 'Curso'),
        p_amount, p_currency, v_payment_id, p_provider
    );

    v_step := 'done';
    RETURN jsonb_build_object('status', 'ok', 'payment_id', v_payment_id);

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', 'course', 'handle_payment_course_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step,
                'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id,
                'course_id', p_course_id,
                'amount', p_amount,
                'currency', p_currency
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'warning_step', v_step
        );
END;$function$;

-- ──────────────────────────────────────────────────────────────
-- E.18  billing.handle_payment_subscription_success()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION billing.handle_payment_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
AS $function$DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'subscription', p_plan_id, NULL, p_amount, p_currency, p_metadata
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'expire_previous_subscription';
    PERFORM public.step_subscription_expire_previous(p_organization_id);

    v_step := 'create_active_subscription';
    v_subscription_id := public.step_subscription_create_active(
        p_organization_id, p_plan_id, p_billing_period,
        v_payment_id, p_amount, p_currency
    );

    v_step := 'set_organization_plan';
    PERFORM public.step_organization_set_plan(p_organization_id, p_plan_id);

    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM public.step_apply_founders_program(p_user_id, p_organization_id);
    END IF;

    v_step := 'send_purchase_email';
    SELECT name INTO v_plan_name FROM public.plans WHERE id = p_plan_id;

    PERFORM public.step_send_purchase_email(
        p_user_id, 'subscription',
        COALESCE(v_plan_name, 'Plan') || ' (' || p_billing_period || ')',
        p_amount, p_currency, v_payment_id, p_provider
    );

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', 'subscription', 'handle_payment_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step,
                'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id,
                'organization_id', p_organization_id,
                'plan_id', p_plan_id,
                'billing_period', p_billing_period
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'subscription_id', v_subscription_id,
            'warning_step', v_step
        );
END;$function$;

-- ──────────────────────────────────────────────────────────────
-- E.19  billing.handle_upgrade_subscription_success()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION billing.handle_upgrade_subscription_success(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_plan_id uuid, p_billing_period text, p_amount numeric, p_currency text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'billing', 'academy', 'public'
AS $function$DECLARE
    v_payment_id uuid;
    v_subscription_id uuid;
    v_plan_name text;
    v_previous_plan_name text;
    v_previous_plan_id uuid;
    v_step text := 'start';
BEGIN
    v_step := 'idempotency_lock';
    PERFORM pg_advisory_xact_lock(hashtext(p_provider || p_provider_payment_id));

    v_step := 'get_previous_plan';
    SELECT o.plan_id, p.name
    INTO v_previous_plan_id, v_previous_plan_name
    FROM public.organizations o
    LEFT JOIN public.plans p ON p.id = o.plan_id
    WHERE o.id = p_organization_id;

    v_step := 'insert_payment';
    v_payment_id := public.step_payment_insert_idempotent(
        p_provider, p_provider_payment_id, p_user_id, p_organization_id,
        'upgrade', p_plan_id, NULL, p_amount, p_currency,
        p_metadata || jsonb_build_object(
            'upgrade', true,
            'previous_plan_id', v_previous_plan_id,
            'previous_plan_name', v_previous_plan_name
        )
    );

    IF v_payment_id IS NULL THEN
        RETURN jsonb_build_object('status', 'already_processed');
    END IF;

    v_step := 'expire_previous_subscription';
    PERFORM public.step_subscription_expire_previous(p_organization_id);

    v_step := 'create_active_subscription';
    v_subscription_id := public.step_subscription_create_active(
        p_organization_id, p_plan_id, p_billing_period,
        v_payment_id, p_amount, p_currency
    );

    v_step := 'set_organization_plan';
    PERFORM public.step_organization_set_plan(p_organization_id, p_plan_id);

    IF p_billing_period = 'annual' THEN
        v_step := 'apply_founders_program';
        PERFORM public.step_apply_founders_program(p_user_id, p_organization_id);
    END IF;

    v_step := 'send_purchase_email';
    SELECT name INTO v_plan_name FROM public.plans WHERE id = p_plan_id;

    PERFORM public.step_send_purchase_email(
        p_user_id, 'upgrade',
        'Upgrade a ' || COALESCE(v_plan_name, 'Plan') || ' (' || CASE WHEN p_billing_period = 'annual' THEN 'anual' ELSE 'mensual' END || ')',
        p_amount, p_currency, v_payment_id, p_provider
    );

    v_step := 'done';
    RETURN jsonb_build_object(
        'status', 'ok',
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id,
        'previous_plan_id', v_previous_plan_id,
        'previous_plan_name', v_previous_plan_name
    );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM ops.log_system_error(
            'payment', 'upgrade', 'handle_upgrade_subscription_success',
            SQLERRM,
            jsonb_build_object(
                'step', v_step,
                'provider', p_provider,
                'provider_payment_id', p_provider_payment_id,
                'user_id', p_user_id,
                'organization_id', p_organization_id,
                'plan_id', p_plan_id,
                'billing_period', p_billing_period
            ),
            'critical'
        );

        RETURN jsonb_build_object(
            'status', 'ok_with_warning',
            'payment_id', v_payment_id,
            'subscription_id', v_subscription_id,
            'warning_step', v_step
        );
END;$function$;

-- ──────────────────────────────────────────────────────────────
-- E.20  billing.step_payment_insert_idempotent()
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION billing.step_payment_insert_idempotent(p_provider text, p_provider_payment_id text, p_user_id uuid, p_organization_id uuid, p_product_type text, p_plan_id uuid, p_course_id uuid, p_amount numeric, p_currency text, p_metadata jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'billing', 'academy', 'public'
AS $function$
declare
  v_payment_id uuid;
  v_product_id uuid;
begin
  if p_product_type = 'subscription' then
    v_product_id := p_plan_id;
  elsif p_product_type = 'course' then
    v_product_id := p_course_id;
  else
    v_product_id := null;
  end if;

  insert into public.payments (
    provider, provider_payment_id, user_id, organization_id,
    product_type, product_id, course_id, amount, currency,
    status, metadata, gateway, approved_at
  )
  values (
    p_provider, p_provider_payment_id, p_user_id, p_organization_id,
    p_product_type, v_product_id, p_course_id, p_amount,
    coalesce(p_currency, 'USD'), 'completed',
    coalesce(p_metadata, '{}'::jsonb), p_provider, now()
  )
  on conflict (provider, provider_payment_id)
  do nothing
  returning id into v_payment_id;

  return v_payment_id;

exception
  when others then
    perform ops.log_system_error(
      'payment', 'payments', 'step_payment_insert_idempotent',
      sqlerrm,
      jsonb_build_object(
        'provider', p_provider,
        'provider_payment_id', p_provider_payment_id,
        'user_id', p_user_id,
        'organization_id', p_organization_id,
        'product_type', p_product_type,
        'plan_id', p_plan_id,
        'course_id', p_course_id,
        'amount', p_amount,
        'currency', p_currency
      ),
      'critical'
    );
    raise;
end;
$function$;

-- ══════════════════════════════════════════════════════════════
-- F. Verificación
-- ══════════════════════════════════════════════════════════════

-- Confirmar que system_error_logs está en ops
SELECT table_name, table_schema FROM information_schema.tables
WHERE table_name = 'system_error_logs';

-- Confirmar que log_system_error está en ops (y NO en audit ni public)
SELECT routine_name, routine_schema FROM information_schema.routines
WHERE routine_name = 'log_system_error';

COMMIT;
