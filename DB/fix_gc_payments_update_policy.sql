-- ==================================================================
-- MIGRACIÓN: Asignar permisos general_costs a roles existentes
-- ==================================================================
-- Los permisos general_costs.view y general_costs.manage existen pero
-- nunca fueron asignados a los roles de las organizaciones.
--

DO $$
DECLARE
    v_view_perm_id uuid;
    v_manage_perm_id uuid;
    v_count_admin int;
    v_count_editor int;
    v_count_lector int;
BEGIN
    -- Obtener IDs de permisos
    SELECT id INTO v_view_perm_id FROM permissions WHERE key = 'general_costs.view';
    SELECT id INTO v_manage_perm_id FROM permissions WHERE key = 'general_costs.manage';

    IF v_view_perm_id IS NULL OR v_manage_perm_id IS NULL THEN
        RAISE EXCEPTION 'Permisos general_costs no encontrados';
    END IF;

    -- ADMINISTRADOR: view + manage
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id FROM roles r
    WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_manage_perm_id FROM roles r
    WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count_admin = ROW_COUNT;

    -- EDITOR: view + manage
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id FROM roles r
    WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_manage_perm_id FROM roles r
    WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count_editor = ROW_COUNT;

    -- LECTOR: solo view
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, v_view_perm_id FROM roles r
    WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count_lector = ROW_COUNT;

    RAISE NOTICE 'Permisos general_costs asignados: Admin=%, Editor=%, Lector=%', 
        v_count_admin, v_count_editor, v_count_lector;
END $$;

-- Verificar resultado
SELECT 
    r.name as role_name,
    r.organization_id,
    p.key as permission_key
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.key LIKE 'general_costs%'
ORDER BY r.organization_id, r.name;
