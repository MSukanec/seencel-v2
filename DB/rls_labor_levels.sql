-- =====================================================
-- MIGRACIÓN: labor_levels → Tabla de SISTEMA (Tipo 4)
-- =====================================================
-- Elimina columnas innecesarias para tabla global
-- y configura RLS: Todos ven, solo Admin modifica
-- =====================================================


-- =====================================================
-- 1. ELIMINAR CONSTRAINTS PRIMERO
-- =====================================================

ALTER TABLE public.labor_levels 
    DROP CONSTRAINT IF EXISTS labor_levels_created_by_fkey;

ALTER TABLE public.labor_levels 
    DROP CONSTRAINT IF EXISTS labor_levels_updated_by_fkey;


-- =====================================================
-- 2. ELIMINAR COLUMNAS INNECESARIAS
-- =====================================================
-- Como es tabla de sistema, no necesita:
--   - is_system (siempre es sistema)
--   - is_deleted / deleted_at (admin borra de verdad)
--   - created_by / updated_by (sin org, no hay org_members)

ALTER TABLE public.labor_levels 
    DROP COLUMN IF EXISTS is_system,
    DROP COLUMN IF EXISTS is_deleted,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS updated_by;


-- =====================================================
-- 3. AGREGAR sort_order SI NO EXISTE
-- =====================================================
-- Para ordenar niveles: Ayudante < Medio Oficial < Oficial

ALTER TABLE public.labor_levels 
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;


-- =====================================================
-- 4. TRIGGER: updated_at automático
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_labor_levels ON public.labor_levels;
CREATE TRIGGER set_updated_at_labor_levels
    BEFORE UPDATE ON public.labor_levels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================

ALTER TABLE public.labor_levels ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 6. POLÍTICAS RLS (Patrón Tipo 4 - Tabla Global)
-- =====================================================

DROP POLICY IF EXISTS "TODOS VEN LABOR_LEVELS" ON public.labor_levels;
DROP POLICY IF EXISTS "ADMINS GESTIONAN LABOR_LEVELS" ON public.labor_levels;
DROP POLICY IF EXISTS "labor_levels_select_all" ON public.labor_levels;
DROP POLICY IF EXISTS "labor_levels_admin_all" ON public.labor_levels;

-- SELECT: Todos pueden ver (lectura pública)
CREATE POLICY "TODOS VEN LABOR_LEVELS"
ON public.labor_levels
FOR SELECT TO public
USING (true);

-- ALL (INSERT/UPDATE/DELETE): Solo admins
CREATE POLICY "ADMINS GESTIONAN LABOR_LEVELS"
ON public.labor_levels
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());


-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
-- Estructura final de labor_levels:
--
-- id          UUID PRIMARY KEY
-- name        TEXT NOT NULL
-- description TEXT NULL
-- sort_order  INTEGER NOT NULL DEFAULT 0
-- created_at  TIMESTAMPTZ
-- updated_at  TIMESTAMPTZ
--
-- RLS:
-- ✅ TODOS VEN LABOR_LEVELS (lectura pública)
-- ✅ ADMINS GESTIONAN LABOR_LEVELS (solo admin modifica)
-- =====================================================
