-- ============================================================
-- 087: Limpieza de dead code en flujo de creación de organización
-- ============================================================
-- 1. DROP función orphan step_create_default_kanban_board (no usada por handle_new_organization)
-- 2. DROP overload de step_create_organization con 3 params (el de 4 params es el activo)
-- ============================================================

-- 1. Eliminar step_create_default_kanban_board (orphan)
-- handle_new_organization usa código inline en Step 9, esta función nunca se llama
DROP FUNCTION IF EXISTS iam.step_create_default_kanban_board(uuid);

-- 2. Eliminar overload de 3 params de step_create_organization
-- Solo se usa la versión de 4 params (con p_business_mode)
DROP FUNCTION IF EXISTS iam.step_create_organization(uuid, text, uuid);
