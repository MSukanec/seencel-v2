-- ============================================================================
-- ADD default_sale_unit_quantity TO materials TABLE
-- ============================================================================
-- 
-- Adds the quantity field that represents how many base units (kg, m³, etc)
-- are contained in each sale unit (bag, truck, etc).
--
-- Examples:
--   Cement: unit_id=kg, default_sale_unit_id=bag, default_sale_unit_quantity=25
--   Sand:   unit_id=m³, default_sale_unit_id=truck, default_sale_unit_quantity=6
-- ============================================================================

ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS default_sale_unit_quantity numeric(12, 4) NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.materials.default_sale_unit_quantity IS 
'Quantity of base unit (unit_id) contained in each sale unit (default_sale_unit_id). Example: 25 for a 25kg bag of cement.';
