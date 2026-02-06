-- Migration: Add description and default_provider_id to materials table
-- Date: 2026-02-05
-- Note: default_unit_presentation_id already exists in the table

-- Add description column
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS description text NULL;

-- Add default_provider_id column (references contacts)
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS default_provider_id uuid NULL;

-- Add foreign key constraint for provider (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'materials_default_provider_id_fkey'
    ) THEN
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_default_provider_id_fkey 
        FOREIGN KEY (default_provider_id) 
        REFERENCES contacts (id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for provider lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_materials_default_provider 
ON public.materials (default_provider_id) 
WHERE default_provider_id IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN public.materials.description IS 'Descripción detallada opcional del material';
COMMENT ON COLUMN public.materials.default_provider_id IS 'Proveedor por defecto del material (referencia a contacts)';
