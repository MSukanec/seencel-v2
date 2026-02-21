-- ==========================================
-- 082: Fix referencias public.* en funciones IAM step_*
-- ==========================================
-- Varias funciones iam.step_* todavía insertan en public.* cuando
-- las tablas ya fueron migradas a sus schemas correspondientes.
-- ==========================================

-- ==========================================
-- 1. iam.step_create_organization_preferences
-- FIX: public.organization_preferences → iam.organization_preferences
-- ==========================================
CREATE OR REPLACE FUNCTION iam.step_create_organization_preferences(p_org_id uuid, p_currency_id uuid, p_wallet_id uuid, p_pdf_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
BEGIN
  INSERT INTO iam.organization_preferences (
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

-- ==========================================
-- 2. iam.step_create_organization 
-- FIX: public.organizations → iam.organizations
-- ==========================================
CREATE OR REPLACE FUNCTION iam.step_create_organization(p_owner_id uuid, p_org_name text, p_plan_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'billing', 'public'
AS $function$
DECLARE
  v_org_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO iam.organizations (
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

-- ==========================================
-- 3. iam.step_create_organization_data
-- FIX: public.organization_data → iam.organization_data
-- ==========================================
CREATE OR REPLACE FUNCTION iam.step_create_organization_data(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'public'
AS $function$
BEGIN
  INSERT INTO iam.organization_data (organization_id)
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

-- ==========================================
-- 4. iam.step_create_organization_currencies
-- FIX: public.organization_currencies → finance.organization_currencies
-- ==========================================
CREATE OR REPLACE FUNCTION iam.step_create_organization_currencies(p_org_id uuid, p_currency_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'finance', 'public'
AS $function$
BEGIN
  INSERT INTO finance.organization_currencies (
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

-- ==========================================
-- 5. iam.step_create_organization_wallets
-- FIX: public.organization_wallets → finance.organization_wallets
-- ==========================================
CREATE OR REPLACE FUNCTION iam.step_create_organization_wallets(p_org_id uuid, p_wallet_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'iam', 'finance', 'public'
AS $function$
BEGIN
  INSERT INTO finance.organization_wallets (
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

-- ==========================================
-- 6. iam.step_organization_increment_seats
-- FIX: public.organizations → iam.organizations
-- ==========================================
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
$function$;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
-- Verificar que todas se recrearon correctamente:
-- SELECT routine_name, routine_definition 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'iam' 
-- AND routine_name LIKE 'step_%'
-- ORDER BY routine_name;
