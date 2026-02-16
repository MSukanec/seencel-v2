-- ============================================================================
-- Fix: log_recipe_external_service_activity()
-- El trigger de auditoría referencia target_record.quantity que ya no existe.
-- Se reemplaza 'quantity' por 'unit_price' e 'includes_materials' en metadata.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_recipe_external_service_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_recipe_external_service';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_recipe_external_service';
        ELSE
            audit_action := 'update_recipe_external_service';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_recipe_external_service';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object(
        'recipe_id', target_record.recipe_id,
        'name', target_record.name,
        'unit_price', target_record.unit_price,
        'includes_materials', target_record.includes_materials
    );

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, 'task_recipe_external_services', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$function$;
