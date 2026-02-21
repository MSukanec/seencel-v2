-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  073 — Fix step_add_org_member: public.log_system_error → ops  ║
-- ║  Último residuo de la migración 071                            ║
-- ╚══════════════════════════════════════════════════════════════════╝

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
$function$;
