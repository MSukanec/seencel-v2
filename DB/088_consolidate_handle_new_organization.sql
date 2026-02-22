-- ============================================================
-- 088: Consolidar handle_new_organization
-- ============================================================
-- Reemplaza la función que llamaba a 8 step functions separadas
-- por una sola función con toda la lógica inline.
-- Luego elimina las step functions que ya no se usan.
-- ============================================================

-- 1. Reemplazar handle_new_organization con versión consolidada
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
    v_org_id uuid := gen_random_uuid();
    v_admin_role_id uuid;
    v_editor_role_id uuid;
    v_viewer_role_id uuid;
    v_member_id uuid;
    v_board_id uuid;
    v_recent_count integer;
    -- Defaults hardcodeados (datos semilla de producción)
    v_plan_free_id uuid := '015d8a97-6b6e-4aec-87df-5d1e6b0e4ed2';
    v_default_currency_id uuid := '58c50aa7-b8b1-4035-b509-58028dd0e33f';
    v_default_wallet_id uuid := '2658c575-0fa8-4cf6-85d7-6430ded7e188';
    v_default_pdf_template_id uuid := 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b';
BEGIN
    -- ══════════════════════════════════════════════════════════
    -- RATE LIMITING: máximo 3 orgs por hora por usuario
    -- ══════════════════════════════════════════════════════════
    SELECT count(*) INTO v_recent_count
    FROM iam.organizations
    WHERE created_by = p_user_id AND created_at > now() - interval '1 hour';

    IF v_recent_count >= 3 THEN
        RAISE EXCEPTION 'Has alcanzado el límite de creación de organizaciones. Intentá de nuevo más tarde.'
            USING ERRCODE = 'P0001';
    END IF;

    -- ══════════════════════════════════════════════════════════
    -- 1. CREAR ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organizations (
        id, name, created_by, owner_id, created_at, updated_at, is_active, plan_id, business_mode
    )
    VALUES (
        v_org_id, p_organization_name, p_user_id, p_user_id, now(), now(), true, v_plan_free_id, p_business_mode
    );

    -- ══════════════════════════════════════════════════════════
    -- 2. DATOS DE ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_data (organization_id)
    VALUES (v_org_id);

    -- ══════════════════════════════════════════════════════════
    -- 3. ROLES (Administrador, Editor, Lector)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Administrador', 'Acceso total', 'organization', v_org_id, false)
    RETURNING id INTO v_admin_role_id;

    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Editor', 'Puede editar', 'organization', v_org_id, false)
    RETURNING id INTO v_editor_role_id;

    INSERT INTO iam.roles (name, description, type, organization_id, is_system)
    VALUES ('Lector', 'Solo lectura', 'organization', v_org_id, false)
    RETURNING id INTO v_viewer_role_id;

    -- ══════════════════════════════════════════════════════════
    -- 4. MIEMBRO OWNER (con rol Administrador)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_members (
        user_id, organization_id, role_id, is_active, created_at, joined_at
    )
    VALUES (
        p_user_id, v_org_id, v_admin_role_id, true, now(), now()
    )
    RETURNING id INTO v_member_id;

    -- ══════════════════════════════════════════════════════════
    -- 5. PERMISOS POR ROL
    -- ══════════════════════════════════════════════════════════

    -- Admin: todos los permisos del sistema
    INSERT INTO iam.role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, p.id FROM iam.permissions p WHERE p.is_system = true;

    -- Editor: permisos de gestión
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

    -- Lector: permisos de solo lectura
    INSERT INTO iam.role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, p.id FROM iam.permissions p
    WHERE p.key IN (
        'projects.view', 'general_costs.view', 'members.view', 'roles.view',
        'contacts.view', 'planner.view', 'commercial.view', 'sitelog.view',
        'media.view', 'tasks.view', 'materials.view', 'subcontracts.view', 'labor.view'
    );

    -- ══════════════════════════════════════════════════════════
    -- 6. MONEDA DEFAULT (ARS)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO finance.organization_currencies (
        id, organization_id, currency_id, is_active, is_default, created_at
    )
    VALUES (
        gen_random_uuid(), v_org_id, v_default_currency_id, true, true, now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 7. BILLETERA DEFAULT (Efectivo)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO finance.organization_wallets (
        id, organization_id, wallet_id, is_active, is_default, created_at
    )
    VALUES (
        gen_random_uuid(), v_org_id, v_default_wallet_id, true, true, now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 8. PREFERENCIAS DE ORGANIZACIÓN
    -- ══════════════════════════════════════════════════════════
    INSERT INTO iam.organization_preferences (
        organization_id, default_currency_id, default_wallet_id, default_pdf_template_id,
        use_currency_exchange, created_at, updated_at
    )
    VALUES (
        v_org_id, v_default_currency_id, v_default_wallet_id, v_default_pdf_template_id,
        false, now(), now()
    );

    -- ══════════════════════════════════════════════════════════
    -- 9. TABLERO KANBAN DEFAULT ("General" + 3 listas)
    -- ══════════════════════════════════════════════════════════
    INSERT INTO planner.kanban_boards (name, organization_id, created_by)
    VALUES ('General', v_org_id, v_member_id)
    RETURNING id INTO v_board_id;

    INSERT INTO planner.kanban_lists (board_id, name, position, organization_id, auto_complete, created_by)
    VALUES
        (v_board_id, 'Por Hacer',    0, v_org_id, false, v_member_id),
        (v_board_id, 'En Progreso',  1, v_org_id, false, v_member_id),
        (v_board_id, 'Hecho',        2, v_org_id, true,  v_member_id);

    -- ══════════════════════════════════════════════════════════
    -- 10. ACTIVAR ORG COMO ÚLTIMA USADA
    -- ══════════════════════════════════════════════════════════
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


-- ============================================================
-- 2. DROP step functions que ya no se usan
-- ============================================================
-- Nota: step_create_organization(uuid, text, uuid) de 3 params
-- y step_create_default_kanban_board ya se dropearon en 087.
-- Aquí dropeamos el resto.

DROP FUNCTION IF EXISTS iam.step_create_organization(uuid, text, uuid, text);
DROP FUNCTION IF EXISTS iam.step_create_organization_data(uuid);
DROP FUNCTION IF EXISTS iam.step_create_organization_roles(uuid);
DROP FUNCTION IF EXISTS iam.step_add_org_member(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS iam.step_assign_org_role_permissions(uuid);
DROP FUNCTION IF EXISTS iam.step_create_organization_currencies(uuid, uuid);
DROP FUNCTION IF EXISTS iam.step_create_organization_wallets(uuid, uuid);
DROP FUNCTION IF EXISTS iam.step_create_organization_preferences(uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS iam.step_create_user_organization_preferences(uuid, uuid);
