-- ============================================================================
-- FIX: external_has_scope references public.external_actor_scopes 
-- but the table lives in iam.external_actor_scopes
-- 
-- ERROR: relation "public.external_actor_scopes" does not exist (42P01)
-- IMPACT: Any non-super-admin user gets errors on ALL pages with RLS
--         because can_view_org() calls this function
-- ============================================================================

CREATE OR REPLACE FUNCTION iam.external_has_scope(p_organization_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'iam'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM iam.organization_external_actors ea
    JOIN iam.external_actor_scopes eas ON eas.external_actor_id = ea.id
    WHERE ea.organization_id = p_organization_id
      AND ea.user_id = iam.current_user_id()
      AND ea.is_active = true
      AND ea.is_deleted = false
      AND eas.permission_key = p_permission_key
  );
$function$;
