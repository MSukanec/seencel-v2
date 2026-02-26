-- ============================================================================
-- Script 4: Función freeze_quote_prices
-- Congela los precios vivos de las recetas en los ítems del presupuesto
-- Se llama al cambiar estado a 'sent'
-- ============================================================================

CREATE OR REPLACE FUNCTION finance.freeze_quote_prices(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Para cada ítem del presupuesto que tiene receta,
    -- calcular costos actuales desde el catálogo y guardarlos como snapshot
    UPDATE finance.quote_items qi
    SET
        -- Snapshot de costos desglosados
        snapshot_mat_cost = COALESCE(rv.mat_cost, 0),
        snapshot_lab_cost = COALESCE(rv.lab_cost, 0),
        snapshot_ext_cost = COALESCE(rv.ext_cost, 0),
        -- unit_price = costo según alcance
        unit_price = CASE qi.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN
                COALESCE(rv.mat_cost, 0) + COALESCE(rv.lab_cost, 0) + COALESCE(rv.ext_cost, 0)
            WHEN 'labor_only'::cost_scope_enum THEN
                COALESCE(rv.lab_cost, 0) + COALESCE(rv.ext_cost, 0)
            ELSE
                COALESCE(rv.mat_cost, 0) + COALESCE(rv.lab_cost, 0) + COALESCE(rv.ext_cost, 0)
        END
    FROM catalog.task_recipes_view rv
    WHERE qi.quote_id = p_quote_id
      AND qi.recipe_id IS NOT NULL
      AND qi.is_deleted = false
      AND rv.id = qi.recipe_id;
END;
$$;

-- Permisos: permitir que autenticados invoquen via RPC
GRANT EXECUTE ON FUNCTION finance.freeze_quote_prices(uuid) TO authenticated;
