-- ============================================================================
-- CONSOLIDACIÓN DE FEATURE FLAGS DEL SIDEBAR
-- ============================================================================
-- Contexto: Antes teníamos 2 sidebars (org y project), ahora solo hay uno.
-- Se eliminan duplicados, se remueven flags de features eliminados (advanced, identity),
-- y se renombran todos a nombres simples sin prefijo org_/project_.
-- ============================================================================

-- ============================================================================
-- 1. ELIMINAR flags de features que ya no existen
-- ============================================================================

-- Avanzado (feature removido)
DELETE FROM feature_flags WHERE key = 'sidebar_org_advanced';

-- Identidad (feature removido)
DELETE FROM feature_flags WHERE key = 'sidebar_org_identity';

-- ============================================================================
-- 2. ELIMINAR duplicados de proyecto (ya cubiertos por la versión org)
-- ============================================================================

-- overview duplicado (ya existe sidebar_org_overview)
DELETE FROM feature_flags WHERE key = 'sidebar_project_overview';

-- planner duplicado (ya existe sidebar_org_planner)
DELETE FROM feature_flags WHERE key = 'sidebar_project_planner';

-- files duplicado (ya existe sidebar_org_files)
DELETE FROM feature_flags WHERE key = 'sidebar_project_files';

-- finance duplicado (ya existe sidebar_org_finance)
DELETE FROM feature_flags WHERE key = 'sidebar_project_finance';

-- quotes duplicado (ya existe sidebar_org_quotes)
DELETE FROM feature_flags WHERE key = 'sidebar_project_quotes';

-- ============================================================================
-- 3. RENOMBRAR flags de organización (quitar prefijo org_)
-- ============================================================================

UPDATE feature_flags SET key = 'sidebar_overview',      description = 'Visión General'    WHERE key = 'sidebar_org_overview';
UPDATE feature_flags SET key = 'sidebar_projects',       description = 'Proyectos'         WHERE key = 'sidebar_org_projects';
UPDATE feature_flags SET key = 'sidebar_files',          description = 'Documentación'     WHERE key = 'sidebar_org_files';
UPDATE feature_flags SET key = 'sidebar_contacts',       description = 'Contactos'         WHERE key = 'sidebar_org_contacts';
UPDATE feature_flags SET key = 'sidebar_settings',       description = 'Configuración'     WHERE key = 'sidebar_org_settings';
UPDATE feature_flags SET key = 'sidebar_catalog',        description = 'Catálogo Técnico'  WHERE key = 'sidebar_org_catalog';
UPDATE feature_flags SET key = 'sidebar_quotes',         description = 'Presupuestos'      WHERE key = 'sidebar_org_quotes';
UPDATE feature_flags SET key = 'sidebar_reports',        description = 'Informes'          WHERE key = 'sidebar_org_reports';
UPDATE feature_flags SET key = 'sidebar_finance',        description = 'Finanzas'          WHERE key = 'sidebar_org_finance';
UPDATE feature_flags SET key = 'sidebar_capital',        description = 'Capital'            WHERE key = 'sidebar_org_capital';
UPDATE feature_flags SET key = 'sidebar_general_costs',  description = 'Gastos Generales'  WHERE key = 'sidebar_org_general_costs';
UPDATE feature_flags SET key = 'sidebar_planner',        description = 'Planificador'      WHERE key = 'sidebar_org_planner';

-- ============================================================================
-- 4. RENOMBRAR flags exclusivos de proyecto (quitar prefijo project_)
-- ============================================================================

UPDATE feature_flags SET key = 'sidebar_clients',        description = 'Clientes'           WHERE key = 'sidebar_project_clients';
UPDATE feature_flags SET key = 'sidebar_details',        description = 'Información'        WHERE key = 'sidebar_project_details';
UPDATE feature_flags SET key = 'sidebar_health',         description = 'Salud'              WHERE key = 'sidebar_project_health';
UPDATE feature_flags SET key = 'sidebar_tasks',          description = 'Tareas'             WHERE key = 'sidebar_project_tasks';
UPDATE feature_flags SET key = 'sidebar_materials',      description = 'Materiales'         WHERE key = 'sidebar_project_materials';
UPDATE feature_flags SET key = 'sidebar_labor',          description = 'Mano de Obra'       WHERE key = 'sidebar_project_labor';
UPDATE feature_flags SET key = 'sidebar_subcontracts',   description = 'Subcontratos'       WHERE key = 'sidebar_project_subcontracts';
UPDATE feature_flags SET key = 'sidebar_sitelog',        description = 'Bitácora'           WHERE key = 'sidebar_project_sitelog';
UPDATE feature_flags SET key = 'sidebar_portal',         description = 'Portal de Clientes' WHERE key = 'sidebar_project_portal';

-- ============================================================================
-- VERIFICACIÓN: Listar flags del sidebar después de la migración
-- ============================================================================
SELECT key, description, status, value FROM feature_flags 
WHERE key LIKE 'sidebar_%' 
ORDER BY key;
