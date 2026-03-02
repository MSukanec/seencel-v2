-- ================================================================
-- Standardize Capital Movement Status Values
-- ================================================================
-- Migrates legacy status values in partner_contributions and 
-- partner_withdrawals to the standard 3 values:
--   confirmed | pending | rejected
-- Also adds CHECK constraints to prevent future inconsistencies.
-- ================================================================

BEGIN;

-- 1. Migrate legacy values in partner_contributions
UPDATE finance.partner_contributions 
SET status = 'confirmed' 
WHERE status = 'completed';

UPDATE finance.partner_contributions 
SET status = 'rejected' 
WHERE status = 'cancelled';

-- 2. Migrate legacy values in partner_withdrawals
UPDATE finance.partner_withdrawals 
SET status = 'confirmed' 
WHERE status = 'completed';

UPDATE finance.partner_withdrawals 
SET status = 'rejected' 
WHERE status = 'cancelled';

-- 3. Add CHECK constraints to prevent future inconsistencies
ALTER TABLE finance.partner_contributions
ADD CONSTRAINT chk_partner_contributions_status 
CHECK (status IN ('confirmed', 'pending', 'rejected'));

ALTER TABLE finance.partner_withdrawals
ADD CONSTRAINT chk_partner_withdrawals_status 
CHECK (status IN ('confirmed', 'pending', 'rejected'));

COMMIT;
