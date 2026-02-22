-- ============================================================================
-- Update handle_new_organization for Planner V2
-- ============================================================================
-- Fecha: 2026-02-22
-- Descripción: Modifica el Step 9 de handle_new_organization para insertar
--              en las nuevas tablas planner.boards y planner.lists en vez de
--              las tablas legacy planner.kanban_boards y planner.kanban_lists.
-- ============================================================================

CREATE OR REPLACE FUNCTION iam.handle_new_organization(
    p_user_id uuid,
    p_organization_name text,
    p_business_mode text DEFAULT 'professional',
    p_default_currency_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'iam', 'billing'
AS $$
DECLARE
    v_organization_id uuid;
    v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    v_default_currency_id uuid := COALESCE(p_default_currency_id, '58c50aa7-b8b1-4035-b509-58028dd0e33f');
    v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
    v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
    v_admin_role_id uuid;
    v_editor_role_id uuid;
    v_reader_role_id uuid;
    v_member_id uuid;
    v_board_id uuid;
    v_list_todo_id uuid;
    v_recent_count int;
BEGIN
    -- Rate limiting: max 3 orgs per hour per user
    SELECT count(*) INTO v_recent_count
    FROM iam.organizations
    WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

    IF v_recent_count >= 3 THEN
        RAISE EXCEPTION 'Rate limit exceeded: max 3 organizations per hour';
    END IF;

    -- Step 1: Crear organización
    INSERT INTO iam.organizations (name, owner_id, plan_id, business_mode, created_by)
    VALUES (p_organization_name, p_user_id, v_plan_free_id, COALESCE(p_business_mode, 'professional'), p_user_id)
    RETURNING id INTO v_organization_id;

    -- Step 2: Datos de organización
    INSERT INTO iam.organization_data (organization_id)
    VALUES (v_organization_id);

    -- Step 3: Roles por defecto
    INSERT INTO iam.roles (organization_id, name, description, is_system, created_by)
    VALUES (v_organization_id, 'Administrador', 'Control total sobre la organización', true, p_user_id)
    RETURNING id INTO v_admin_role_id;

    INSERT INTO iam.roles (organization_id, name, description, is_system, created_by)
    VALUES (v_organization_id, 'Editor', 'Puede editar contenido', true, p_user_id)
    RETURNING id INTO v_editor_role_id;

    INSERT INTO iam.roles (organization_id, name, description, is_system, created_by)
    VALUES (v_organization_id, 'Lector', 'Solo lectura', true, p_user_id)
    RETURNING id INTO v_reader_role_id;

    -- Step 4: Agregar creador como miembro administrador
    INSERT INTO iam.organization_members (user_id, organization_id, role_id, created_by)
    VALUES (p_user_id, v_organization_id, v_admin_role_id, p_user_id)
    RETURNING id INTO v_member_id;

    -- Step 5: Asignar permisos a roles
    DELETE FROM iam.role_permissions WHERE role_id IN (v_admin_role_id, v_editor_role_id, v_reader_role_id);

    INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
    SELECT v_admin_role_id, id, v_organization_id
    FROM iam.permissions;

    INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
    SELECT v_editor_role_id, id, v_organization_id
    FROM iam.permissions
    WHERE key NOT LIKE '%.delete' AND key NOT LIKE '%.manage_roles';

    INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
    SELECT v_reader_role_id, id, v_organization_id
    FROM iam.permissions
    WHERE key LIKE '%.view';

    -- Step 6: Moneda por defecto
    INSERT INTO finance.organization_currencies (organization_id, currency_id, is_default)
    VALUES (v_organization_id, v_default_currency_id, true);

    -- Step 7: Billetera por defecto
    INSERT INTO finance.organization_wallets (organization_id, wallet_id, is_default)
    VALUES (v_organization_id, v_default_wallet_id, true);

    -- Step 8: Preferencias de organización
    INSERT INTO iam.organization_preferences (
        organization_id, default_currency_id, default_wallet_id, default_pdf_template_id
    ) VALUES (
        v_organization_id, v_default_currency_id, v_default_wallet_id, v_default_pdf_template_id
    );

    -- Step 9: Board Kanban por defecto (PLANNER V2 - nuevas tablas)
    INSERT INTO planner.boards (id, name, organization_id, created_by)
    VALUES (gen_random_uuid(), 'General', v_organization_id, v_member_id)
    RETURNING id INTO v_board_id;

    INSERT INTO planner.lists (board_id, organization_id, name, position, created_by)
    VALUES (v_board_id, v_organization_id, 'Por Hacer', 0, v_member_id)
    RETURNING id INTO v_list_todo_id;

    INSERT INTO planner.lists (board_id, organization_id, name, position, created_by)
    VALUES (v_board_id, v_organization_id, 'En Progreso', 1, v_member_id);

    INSERT INTO planner.lists (board_id, organization_id, name, position, created_by)
    VALUES (v_board_id, v_organization_id, 'Hecho', 2, v_member_id);

    -- Setear lista "Por Hacer" como default del board
    UPDATE planner.boards SET default_list_id = v_list_todo_id WHERE id = v_board_id;

    -- Step 10: Activar organización para el usuario
    UPDATE iam.user_preferences
    SET last_organization_id = v_organization_id
    WHERE user_id = p_user_id;

    RETURN v_organization_id;

EXCEPTION WHEN OTHERS THEN
    BEGIN
        PERFORM ops.log_system_error(
            'function',
            'handle_new_organization',
            'organization',
            SQLERRM,
            jsonb_build_object(
                'user_id', p_user_id,
                'organization_name', p_organization_name,
                'business_mode', p_business_mode,
                'default_currency_id', p_default_currency_id,
                'sqlstate', SQLSTATE
            ),
            'critical'
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    RAISE;
END;
$$;
