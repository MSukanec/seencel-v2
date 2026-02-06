-- ============================================================================
-- Migration: Add import_batch_id to materials table
-- ============================================================================

-- 1. Drop dependent view
DROP VIEW IF EXISTS public.materials_view;

-- 2. Add missing column for import tracking
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS import_batch_id uuid NULL;

-- Add FK reference to import_batches table (if exists)
-- ALTER TABLE public.materials 
-- ADD CONSTRAINT materials_import_batch_id_fkey 
-- FOREIGN KEY (import_batch_id) REFERENCES import_batches (id) ON DELETE SET NULL;

-- Add index for efficient batch revert queries
CREATE INDEX IF NOT EXISTS idx_materials_import_batch 
ON public.materials USING btree (import_batch_id) 
TABLESPACE pg_default
WHERE import_batch_id IS NOT NULL;

-- 3. Recreate the view with all fields
CREATE VIEW public.materials_view AS
SELECT
  m.id,
  m.name,
  m.code,
  m.description,
  m.category_id,
  mc.name as category_name,
  m.unit_id,
  u.name as unit_of_computation,
  u.symbol as unit_symbol,
  m.default_unit_presentation_id,
  up.name as default_unit_presentation,
  up.equivalence as unit_equivalence,
  m.default_provider_id,
  c.full_name as default_provider_name,
  m.is_system,
  m.is_completed,
  m.material_type,
  m.organization_id,
  m.created_at,
  m.updated_at,
  m.import_batch_id,
  map.min_price,
  map.max_price,
  map.avg_price,
  map.product_count,
  map.provider_product_count,
  map.price_count,
  mp.unit_price as org_unit_price,
  mp.currency_id as org_price_currency_id,
  mp.valid_from as org_price_valid_from
FROM
  materials m
  LEFT JOIN material_categories mc ON mc.id = m.category_id
  LEFT JOIN units u ON u.id = m.unit_id
  LEFT JOIN unit_presentations up ON up.id = m.default_unit_presentation_id
  LEFT JOIN contacts c ON c.id = m.default_provider_id
  LEFT JOIN material_avg_prices map ON map.material_id = m.id
  LEFT JOIN LATERAL (
    SELECT
      material_prices.unit_price,
      material_prices.currency_id,
      material_prices.valid_from
    FROM
      material_prices
    WHERE
      material_prices.material_id = m.id
      AND material_prices.organization_id = m.organization_id
      AND (
        material_prices.valid_to IS NULL
        OR material_prices.valid_to >= CURRENT_DATE
      )
      AND material_prices.valid_from <= CURRENT_DATE
    ORDER BY
      material_prices.valid_from DESC
    LIMIT 1
  ) mp ON TRUE
WHERE
  m.is_deleted = false;
