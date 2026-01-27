-- ============================================
-- Add Index Adjustment columns to Subcontracts
-- ============================================

-- 1. Link to economic index type
ALTER TABLE public.subcontracts ADD COLUMN IF NOT EXISTS 
    adjustment_index_type_id UUID REFERENCES public.economic_index_types(id) ON DELETE SET NULL;

-- 2. Base period (configurable by user)
ALTER TABLE public.subcontracts ADD COLUMN IF NOT EXISTS base_period_year INTEGER;
ALTER TABLE public.subcontracts ADD COLUMN IF NOT EXISTS base_period_month INTEGER;

-- 3. Snapshot of base index value at the time of configuration
ALTER TABLE public.subcontracts ADD COLUMN IF NOT EXISTS base_index_value NUMERIC(15,4);

-- Add comment for documentation
COMMENT ON COLUMN public.subcontracts.adjustment_index_type_id IS 'Economic index used for price adjustment (ICC, CAC, etc.)';
COMMENT ON COLUMN public.subcontracts.base_period_year IS 'Year of the base period for adjustment calculation';
COMMENT ON COLUMN public.subcontracts.base_period_month IS 'Month of the base period for adjustment calculation';
COMMENT ON COLUMN public.subcontracts.base_index_value IS 'Snapshot of index value at base period - used to calculate adjustment coefficient';
