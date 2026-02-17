-- ============================================================
-- 005: Add business_mode to organizations
-- ============================================================
-- Adds a business_mode column to differentiate between
-- professional organizations (studios/constructors) and suppliers.
-- Updates handle_new_organization and step_create_organization
-- to accept and store the new parameter.
-- ============================================================

-- 1) Add column
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS business_mode text NOT NULL DEFAULT 'professional';

COMMENT ON COLUMN public.organizations.business_mode IS 
  'Organization type: professional (studio/constructor) or supplier';

-- 2) Update step_create_organization to accept business_mode
CREATE OR REPLACE FUNCTION public.step_create_organization(
  p_owner_id uuid, 
  p_org_name text, 
  p_plan_id uuid,
  p_business_mode text DEFAULT 'professional'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
$function$;

-- 3) Update handle_new_organization to accept and pass business_mode
CREATE OR REPLACE FUNCTION public.handle_new_organization(
  p_user_id uuid, 
  p_organization_name text,
  p_business_mode text DEFAULT 'professional'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_admin_role_id uuid;
  v_recent_count integer;

  -- Defaults
  v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
  v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
  v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
  v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN

  ----------------------------------------------------------------
  -- 🛡️ GUARD: Rate limit - Max 3 orgs per hour per user
  ----------------------------------------------------------------
  SELECT count(*)
  INTO v_recent_count
  FROM public.organizations
  WHERE created_by = p_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
      USING ERRCODE = 'P0001';
  END IF;

  ----------------------------------------------------------------
  -- 1) Crear organización (now with business_mode)
  ----------------------------------------------------------------
  v_org_id := public.step_create_organization(
    p_user_id,
    p_organization_name,
    v_plan_free_id,
    p_business_mode
  );

  ----------------------------------------------------------------
  -- 2) Organization data
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_data(v_org_id);

  ----------------------------------------------------------------
  -- 3) Roles base de la organización
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_roles(v_org_id);

  ----------------------------------------------------------------
  -- 4) Obtener rol Administrador
  ----------------------------------------------------------------
  SELECT id
  INTO v_admin_role_id
  FROM public.roles
  WHERE organization_id = v_org_id
    AND name = 'Administrador'
    AND is_system = false
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
  END IF;

  ----------------------------------------------------------------
  -- 5) Agregar usuario como Admin
  ----------------------------------------------------------------
  PERFORM public.step_add_org_member(
    p_user_id,
    v_org_id,
    v_admin_role_id
  );

  ----------------------------------------------------------------
  -- 6) Asignar permisos a roles
  ----------------------------------------------------------------
  PERFORM public.step_assign_org_role_permissions(v_org_id);

  ----------------------------------------------------------------
  -- 7) Monedas
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_currencies(
    v_org_id,
    v_default_currency_id
  );

  ----------------------------------------------------------------
  -- 8) Billeteras
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_wallets(
    v_org_id,
    v_default_wallet_id
  );

  ----------------------------------------------------------------
  -- 9) Organization preferences
  ----------------------------------------------------------------
  PERFORM public.step_create_organization_preferences(
    v_org_id,
    v_default_currency_id,
    v_default_wallet_id,
    v_default_pdf_template_id
  );

  ----------------------------------------------------------------
  -- 10) Setear como organización activa
  ----------------------------------------------------------------
  UPDATE public.user_preferences
  SET
    last_organization_id = v_org_id,
    updated_at = now()
  WHERE user_id = p_user_id;

  ----------------------------------------------------------------
  RETURN v_org_id;

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_system_error(
      'function',
      'handle_new_organization',
      'organization',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'organization_name', p_organization_name,
        'business_mode', p_business_mode
      ),
      'critical'
    );
    RAISE;
END;
$function$;
