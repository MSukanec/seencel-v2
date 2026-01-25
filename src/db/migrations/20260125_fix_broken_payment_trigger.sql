-- Fix broken trigger on subcontract_payments

-- 1. Drop the trigger that is likely causing "record new has no field amount_total"
-- It seems 'set_functional_amount_subcontracts' (which uses amount_total) was accidentally applied to 'subcontract_payments'.
DROP TRIGGER IF EXISTS set_functional_amount_subcontracts ON subcontract_payments;

-- 2. Drop other potentially conflicting triggers
DROP TRIGGER IF EXISTS set_subcontract_payment_functional_amount ON subcontract_payments;

-- 3. Ensure we have a correct trigger for functional amount if needed.
-- But wait, the application logic calculates functional_amount on INSERT (in the import action).
-- So we might typically NOT need a trigger unless we want to enforce it on updates.
-- For now, removing the broken trigger is the priority.

-- If we need to update the PARENT subcontract totals, that usually lives on a different trigger.
-- Ensure we don't break that.
-- Usually named 'update_subcontract_totals_trigger'.
-- If that one is broken, we should fix it. But 'amount_total' error suggests the 'set_functional_amount' one.
