-- Migration: Fix Subcontracts Currency FK to point to currencies(id) instead of organization_currencies(id)

-- 0. Drop Dependent Trigger FIRST to avoid dependency error
DROP TRIGGER IF EXISTS set_functional_amount_subcontracts ON subcontracts;

-- 1. Create temporary column
ALTER TABLE subcontracts ADD COLUMN new_currency_id UUID;

-- 2. Migrate Data
-- Map existing organization_currencies(id) to currencies(id)
UPDATE subcontracts s
SET new_currency_id = oc.currency_id
FROM organization_currencies oc
WHERE s.currency_id = oc.id;

-- 3. Drop existing constraint
ALTER TABLE subcontracts DROP CONSTRAINT subcontracts_currency_id_fkey;

-- 4. Swap columns
-- Now allowed because trigger is dropped
ALTER TABLE subcontracts DROP COLUMN currency_id;
ALTER TABLE subcontracts RENAME COLUMN new_currency_id TO currency_id;

-- 5. Add new Foreign Key
ALTER TABLE subcontracts 
    ADD CONSTRAINT subcontracts_currency_id_fkey 
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;

-- 6. Re-Add Indices
CREATE INDEX IF NOT EXISTS idx_subcontracts_currency ON subcontracts(currency_id);

-- 7. Re-Create Trigger
CREATE TRIGGER set_functional_amount_subcontracts 
BEFORE INSERT OR UPDATE OF amount_total, exchange_rate, currency_id 
ON subcontracts 
FOR EACH ROW 
EXECUTE FUNCTION set_subcontract_functional_amount();
