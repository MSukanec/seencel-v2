-- Fix: count both 'active' AND 'planning' projects towards the limit
-- Previously only counted 'active', allowing unlimited 'planning' projects

CREATE OR REPLACE FUNCTION billing.check_active_project_limit(
    p_organization_id uuid,
    p_excluded_project_id uuid DEFAULT NULL::uuid
)
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
    -- Count both active AND planning projects (both consume a "slot")
    SELECT COUNT(*)
    INTO v_current_count
    FROM projects.projects
    WHERE organization_id = p_organization_id
      AND status IN ('active', 'planning')
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
