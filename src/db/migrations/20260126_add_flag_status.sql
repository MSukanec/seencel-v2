-- Migration: Add Status to Feature Flags
-- Date: 2026-01-26
-- Description: Add status column with check constraint and migrate boolean value

ALTER TABLE feature_flags
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'hidden'));

-- Migrate existing values
-- value=true -> active
-- value=false -> hidden (per user feedback "what you did now is hidden")
UPDATE feature_flags SET status = 'active' WHERE value = true;
UPDATE feature_flags SET status = 'hidden' WHERE value = false;

-- We keep the 'value' column for backward compatibility or eventual removal?
-- User might have other code using 'value'.
-- For safe migration, we can sync 'value' with status using a trigger or just ignore it in new code.
-- We will assume new code uses 'status'.
