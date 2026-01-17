-- Migration: Add currency_decimal_places preference
-- This allows organizations to control the number of decimal places displayed in currency formatting

ALTER TABLE organization_preferences
ADD COLUMN IF NOT EXISTS currency_decimal_places INTEGER DEFAULT 2;

-- Add a check constraint to limit valid values (0, 1, or 2)
ALTER TABLE organization_preferences
ADD CONSTRAINT currency_decimal_places_valid 
CHECK (currency_decimal_places >= 0 AND currency_decimal_places <= 2);

COMMENT ON COLUMN organization_preferences.currency_decimal_places 
IS 'Number of decimal places to display in currency formatting (0, 1, or 2). Default is 2.';
