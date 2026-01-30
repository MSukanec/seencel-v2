-- ============================================================
-- FIX: Enable RLS on 'wallets' table (global catalog)
-- Date: 2026-01-30
-- Issue: Table had no RLS policies, causing 400 errors on queries
-- ============================================================

-- 1. Enable RLS on the table
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 2. Create read policy for all authenticated users
-- Wallets is a global catalog, anyone authenticated can read
CREATE POLICY "USUARIOS AUTENTICADOS VEN WALLETS"
ON public.wallets
FOR SELECT
TO authenticated
USING (true);

-- 3. Admin-only management (insert, update, delete)
CREATE POLICY "ADMINS GESTIONAN WALLETS"
ON public.wallets
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
