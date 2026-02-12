-- ============================================================================
-- RESET ORG DASHBOARD LAYOUTS
-- ============================================================================
-- Elimina los layouts guardados del dashboard de organización.
-- Esto fuerza a que todos los usuarios usen el DEFAULT_ORG_LAYOUT actualizado
-- (que ahora incluye Galería de Archivos en vez de Equipo).
--
-- SEGURO: Solo borra la configuración de layout, no datos de negocio.
-- Los usuarios pueden volver a personalizar su dashboard después.
-- ============================================================================

DELETE FROM dashboard_layouts
WHERE layout_key = 'org_dashboard';
