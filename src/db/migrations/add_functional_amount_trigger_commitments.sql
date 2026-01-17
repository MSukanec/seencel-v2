-- 1. Create Trigger Function for Client Commitments
CREATE OR REPLACE FUNCTION public.set_client_commitment_functional_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if relevant fields changed
  IF (TG_OP = 'INSERT') OR 
     (OLD.amount IS DISTINCT FROM NEW.amount) OR 
     (OLD.exchange_rate IS DISTINCT FROM NEW.exchange_rate) OR 
     (OLD.currency_id IS DISTINCT FROM NEW.currency_id) THEN
     
     NEW.functional_amount := public.calculate_functional_amount(
       NEW.amount,
       NEW.exchange_rate,
       NEW.currency_id,
       NEW.organization_id
     );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS set_functional_amount_commitments ON public.client_commitments;

CREATE TRIGGER set_functional_amount_commitments
BEFORE INSERT OR UPDATE ON public.client_commitments
FOR EACH ROW
EXECUTE FUNCTION public.set_client_commitment_functional_amount();

-- 3. Backfill existing data
UPDATE public.client_commitments
SET functional_amount = public.calculate_functional_amount(
  amount,
  exchange_rate,
  currency_id,
  organization_id
)
WHERE functional_amount IS NULL 
   OR functional_amount = 0; -- Optional: recalculate all if unsure
