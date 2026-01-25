-- Add import_batch_id to subcontract_payments
ALTER TABLE public.subcontract_payments 
ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subcontract_payments_import_batch_id ON public.subcontract_payments(import_batch_id);
