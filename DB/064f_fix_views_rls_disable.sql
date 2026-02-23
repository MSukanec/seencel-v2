-- ==========================================
-- FIX URGENTE: Desactivar RLS en TODAS las vistas
-- Las vistas NO necesitan RLS propio.
-- Con SECURITY INVOKER, la RLS se evalúa en las tablas subyacentes.
-- Si una vista tiene RLS habilitada + 0 policies = 0 filas siempre.
-- ==========================================

-- PASO 1: DIAGNÓSTICO — Ver qué vistas tienen RLS habilitada
-- (ejecutar primero para confirmar el problema)

SELECT 
    n.nspname AS schema,
    c.relname AS view_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'  -- solo vistas
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'extensions', 'storage', 'auth', 'realtime', 'pgsodium', 'graphql', 'graphql_public', 'vault', 'supabase_functions', 'net', '_realtime', 'supabase_migrations')
  AND c.relrowsecurity = true
ORDER BY n.nspname, c.relname;


-- PASO 2: FIX — Desactivar RLS en TODAS las vistas de todos los schemas del proyecto

DO $$
DECLARE
    v record;
    v_count int := 0;
BEGIN
    FOR v IN
        SELECT n.nspname, c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v'
          AND n.nspname IN ('finance', 'projects', 'planner', 'ops', 'iam', 'catalog', 'construction', 'contacts', 'audit', 'academy', 'billing', 'notifications', 'public')
          AND c.relrowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', v.nspname, v.relname);
        RAISE NOTICE 'Disabled RLS on view: %.%', v.nspname, v.relname;
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE '--- Total views fixed: % ---', v_count;
END $$;


-- PASO 3: VERIFICACIÓN — Confirmar que ya no hay vistas con RLS
-- (debe devolver 0 filas)

SELECT 
    n.nspname AS schema,
    c.relname AS view_name,
    c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname IN ('finance', 'projects', 'planner', 'ops', 'iam', 'catalog', 'construction', 'contacts', 'audit', 'academy', 'billing', 'notifications', 'public')
  AND c.relrowsecurity = true
ORDER BY n.nspname, c.relname;
