-- ============================================================
-- FIX: Add missing columns to organization_preferences
-- Date: 2026-01-30
-- Issue: Query requests columns that don't exist (functional_currency_id, default_wallet_id)
-- ============================================================

-- Add functional_currency_id if it doesn't exist
ALTER TABLE public.organization_preferences 
ADD COLUMN IF NOT EXISTS functional_currency_id UUID REFERENCES currencies(id);

-- Add default_wallet_id if it doesn't exist
ALTER TABLE public.organization_preferences 
ADD COLUMN IF NOT EXISTS default_wallet_id UUID REFERENCES wallets(id);

-- Verify columns exist
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'organization_preferences';
