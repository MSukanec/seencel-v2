-- ============================================================
-- 086: Auto-crear tablero Kanban "General" al crear organización
-- ============================================================
-- Se agrega un paso al final de iam.handle_new_organization
-- que inserta un kanban_board + 3 kanban_lists por defecto.
-- ============================================================

CREATE OR REPLACE FUNCTION iam.handle_new_organization(
    p_user_id uuid,
    p_organization_name text,
    p_business_mode text DEFAULT 'professional'::text
)
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
    v_member_id uuid;
    v_board_id uuid;
BEGIN
    -- Rate limiting: max 3 orgs por hora
    SELECT count(*) INTO v_recent_count
    FROM iam.organizations
    WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

    IF v_recent_count >= 3 THEN
        RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Step 1: Crear organización
    v_org_id := iam.step_create_organization(p_user_id, p_organization_name, v_plan_free_id, p_business_mode);

    -- Step 2: Datos de org
    PERFORM iam.step_create_organization_data(v_org_id);

    -- Step 3: Roles
    PERFORM iam.step_create_organization_roles(v_org_id);

    SELECT id INTO v_admin_role_id
    FROM iam.roles
    WHERE organization_id = v_org_id AND name = 'Administrador' AND is_system = false
    LIMIT 1;

    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found for organization %', v_org_id;
    END IF;

    -- Step 4: Agregar miembro owner
    PERFORM iam.step_add_org_member(p_user_id, v_org_id, v_admin_role_id);

    -- Step 5: Permisos
    PERFORM iam.step_assign_org_role_permissions(v_org_id);

    -- Step 6: Monedas
    PERFORM iam.step_create_organization_currencies(v_org_id, v_default_currency_id);

    -- Step 7: Billeteras
    PERFORM iam.step_create_organization_wallets(v_org_id, v_default_wallet_id);

    -- Step 8: Preferencias
    PERFORM iam.step_create_organization_preferences(
        v_org_id, v_default_currency_id, v_default_wallet_id, v_default_pdf_template_id
    );

    -- Step 9: Crear tablero Kanban "General" con 3 listas
    -- Resolver member_id del owner (fue insertado en step 4)
    SELECT id INTO v_member_id
    FROM iam.organization_members
    WHERE organization_id = v_org_id AND user_id = p_user_id
    LIMIT 1;

    INSERT INTO planner.kanban_boards (name, organization_id, created_by)
    VALUES ('General', v_org_id, v_member_id)
    RETURNING id INTO v_board_id;

    INSERT INTO planner.kanban_lists (board_id, name, position, organization_id, auto_complete, created_by)
    VALUES
        (v_board_id, 'Por Hacer',    0, v_org_id, false, v_member_id),
        (v_board_id, 'En Progreso',  1, v_org_id, false, v_member_id),
        (v_board_id, 'Hecho',        2, v_org_id, true,  v_member_id);

    -- Actualizar preferencias de usuario con la org activa
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
