-- ============================================================================
-- OPTIONAL CLEANUP: Remove functional_amount Logic (REVERSIBLE)
-- ============================================================================
-- This cleanup is OPTIONAL. functional_amount can remain as a cached value
-- for SQL-level reporting. The frontend no longer relies on it for display.
--
-- BEFORE RUNNING: Make sure all records have exchange_rate populated!
-- Query to validate: 
--   SELECT * FROM wallet_movements WHERE exchange_rate IS NULL OR exchange_rate <= 0;
-- ============================================================================

-- ==========================
-- STEP 1: Drop Triggers
-- ==========================
-- Drop trigger if it exists on wallet_movements
DROP TRIGGER IF EXISTS calculate_functional_amount_trigger ON public.wallet_movements;

-- Drop trigger on client_payments if exists
DROP TRIGGER IF EXISTS calculate_functional_amount_trigger ON public.client_payments;

-- ==========================
-- STEP 2: Drop Function
-- ==========================
DROP FUNCTION IF EXISTS public.calculate_functional_amount() CASCADE;

-- ==========================
-- STEP 3: (OPTIONAL) Drop Column
-- Only uncomment this if you're 100% sure you don't need functional_amount
-- It's recommended to keep it for backward compatibility and SQL reporting
-- ==========================
-- ALTER TABLE public.wallet_movements DROP COLUMN IF EXISTS functional_amount;
-- ALTER TABLE public.client_payments DROP COLUMN IF EXISTS functional_amount;

-- ==========================
-- ALTERNATIVE: Keep column but make nullable/default
-- ==========================
-- ALTER TABLE public.wallet_movements ALTER COLUMN functional_amount DROP NOT NULL;
-- ALTER TABLE public.wallet_movements ALTER COLUMN functional_amount SET DEFAULT NULL;

-- ============================================================================
-- ROLLBACK COMMANDS (if needed)
-- ============================================================================
-- CREATE OR REPLACE FUNCTION public.calculate_functional_amount()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   org_currency TEXT;
-- BEGIN
--   SELECT default_currency INTO org_currency
--   FROM public.organizations
--   WHERE id = NEW.organization_id;
--
--   IF NEW.currency = org_currency THEN
--     NEW.functional_amount := NEW.amount;
--   ELSE
--     NEW.functional_amount := NEW.amount * COALESCE(NEW.exchange_rate, 1);
--   END IF;
--
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER calculate_functional_amount_trigger
--   BEFORE INSERT OR UPDATE ON public.wallet_movements
--   FOR EACH ROW EXECUTE FUNCTION public.calculate_functional_amount();
