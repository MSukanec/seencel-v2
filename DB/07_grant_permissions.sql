-- ============================================================================
-- Script 7: Restaurar permisos en vistas recreadas
-- Al hacer DROP + CREATE se pierden los GRANTs originales
-- ============================================================================

-- task_recipes_view (script 02)
GRANT SELECT ON catalog.task_recipes_view TO authenticated;
GRANT SELECT ON catalog.task_recipes_view TO anon;

-- quotes_items_view (script 03)
GRANT SELECT ON finance.quotes_items_view TO authenticated;
GRANT SELECT ON finance.quotes_items_view TO anon;

-- quotes_view (script 05)
GRANT SELECT ON finance.quotes_view TO authenticated;
GRANT SELECT ON finance.quotes_view TO anon;

-- contract_summary_view (script 06)
GRANT SELECT ON finance.contract_summary_view TO authenticated;
GRANT SELECT ON finance.contract_summary_view TO anon;
