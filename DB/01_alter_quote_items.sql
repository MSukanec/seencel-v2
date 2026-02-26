-- ============================================================================
-- Script 1: ALTER TABLE quote_items
-- Agrega recipe_id y columnas de snapshot de costos
-- ============================================================================

-- 1. Agregar recipe_id para saber qué receta eligió el usuario
ALTER TABLE finance.quote_items
    ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES catalog.task_recipes(id);

-- 2. Agregar columnas de snapshot (se llenan al hacer freeze/sent)
ALTER TABLE finance.quote_items
    ADD COLUMN IF NOT EXISTS snapshot_mat_cost numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS snapshot_lab_cost numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS snapshot_ext_cost numeric NOT NULL DEFAULT 0;

-- 3. Índice para buscar ítems por receta
CREATE INDEX IF NOT EXISTS idx_quote_items_recipe_id
    ON finance.quote_items(recipe_id)
    WHERE recipe_id IS NOT NULL;
