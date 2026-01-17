-- Add functional_currency_id column to organization_preferences
ALTER TABLE public.organization_preferences
ADD COLUMN functional_currency_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE public.organization_preferences
ADD CONSTRAINT organization_preferences_functional_currency_id_fkey
FOREIGN KEY (functional_currency_id)
REFERENCES public.currencies (id)
ON DELETE SET NULL;

-- Optional: Comment on column
COMMENT ON COLUMN public.organization_preferences.functional_currency_id IS 'Moneda de Referencia (Funcional) para reportes y comparaciones (ej. USD)';
