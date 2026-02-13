-- ============================================================================
-- FIX: Reemplazar YOUR_SUPABASE_URL por la URL real en logo_url
-- ============================================================================

UPDATE organizations
SET logo_url = REPLACE(logo_url, 'YOUR_SUPABASE_URL', 'https://wtatvsgeivymcppowrfy.supabase.co')
WHERE logo_url LIKE '%YOUR_SUPABASE_URL%';
