-- Migration: Add 'founders' status
-- Date: 2026-01-26
-- Description: Add 'founders' to the generic check constraint for status

-- 1. Drop existing check constraint
ALTER TABLE feature_flags
DROP CONSTRAINT IF EXISTS feature_flags_status_check;

-- 2. Add updated constraint
ALTER TABLE feature_flags
ADD CONSTRAINT feature_flags_status_check 
CHECK (status IN ('active', 'maintenance', 'hidden', 'founders'));
