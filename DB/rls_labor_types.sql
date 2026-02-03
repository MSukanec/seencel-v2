-- =====================================================
-- MIGRACIÓN: labor_types → Tabla de SISTEMA (Tipo 4)
-- =====================================================
-- PASO PREVIO: Eliminar dependencias (vista y triggers)
-- =====================================================


-- =====================================================
-- 0. ELIMINAR DEPENDENCIAS PRIMERO
-- =====================================================

-- Drop vista que depende de las columnas
DROP VIEW IF EXISTS public.labor_view CASCADE;

-- Drop trigger que depende de organization_id
DROP TRIGGER IF EXISTS set_updated_by_labor_types ON public.labor_types;

-- Drop audit trigger y función
DROP TRIGGER IF EXISTS on_labor_type_audit ON public.labor_types;
DROP FUNCTION IF EXISTS public.log_labor_type_activity();


-- =====================================================
-- 1. ELIMINAR COLUMNAS INNECESARIAS
-- =====================================================

ALTER TABLE public.labor_types 
    DROP CONSTRAINT IF EXISTS labor_types_organization_fkey;

ALTER TABLE public.labor_types 
    DROP COLUMN IF EXISTS organization_id,
    DROP COLUMN IF EXISTS is_system,
    DROP COLUMN IF EXISTS is_deleted,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS updated_by;


-- =====================================================
-- 2. TRIGGER: updated_at automático
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_labor_types ON public.labor_types;
CREATE TRIGGER set_updated_at_labor_types
    BEFORE UPDATE ON public.labor_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- 3. HABILITAR RLS
-- =====================================================

ALTER TABLE public.labor_types ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 4. POLÍTICAS RLS (Patrón Tipo 4 - Tabla Global)
-- =====================================================

DROP POLICY IF EXISTS "TODOS VEN LABOR_TYPES" ON public.labor_types;
DROP POLICY IF EXISTS "ADMINS GESTIONAN LABOR_TYPES" ON public.labor_types;
DROP POLICY IF EXISTS "VEN LABOR_TYPES" ON public.labor_types;
DROP POLICY IF EXISTS "MIEMBROS CREAN LABOR_TYPES" ON public.labor_types;
DROP POLICY IF EXISTS "EDITAN LABOR_TYPES" ON public.labor_types;
DROP POLICY IF EXISTS "BORRAN LABOR_TYPES" ON public.labor_types;

CREATE POLICY "TODOS VEN LABOR_TYPES"
ON public.labor_types
FOR SELECT TO public
USING (true);

CREATE POLICY "ADMINS GESTIONAN LABOR_TYPES"
ON public.labor_types
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());


-- =====================================================
-- 5. RE-CREAR VISTA labor_view (SIN columnas eliminadas)
-- =====================================================
-- La vista ahora es más simple:
--   - labor_types es global (no tiene organization_id)
--   - El organization_id viene de labor_prices
-- =====================================================

CREATE OR REPLACE VIEW public.labor_view AS
SELECT
    lt.id AS labor_id,
    lt.name AS labor_name,
    lt.description AS labor_description,
    lt.unit_id,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    -- organization_id viene de labor_prices, no de labor_types
    lpc.organization_id,
    lpc.unit_price AS current_price,
    lpc.currency_id AS current_currency_id,
    c.code AS current_currency_code,
    c.symbol AS current_currency_symbol,
    lpc.valid_from,
    lpc.valid_to,
    lpc.updated_at,
    lap.avg_price,
    lap.price_count,
    lap.min_price,
    lap.max_price
FROM
    labor_types lt
    LEFT JOIN units u ON u.id = lt.unit_id
    LEFT JOIN (
        SELECT DISTINCT ON (lp.labor_type_id, lp.organization_id) 
            lp.labor_type_id AS labor_id,
            lp.organization_id,
            lp.currency_id,
            lp.unit_price,
            lp.valid_from,
            lp.valid_to,
            lp.updated_at
        FROM labor_prices lp
        WHERE lp.valid_to IS NULL OR lp.valid_to >= CURRENT_DATE
        ORDER BY lp.labor_type_id, lp.organization_id, lp.valid_from DESC
    ) lpc ON lpc.labor_id = lt.id
    LEFT JOIN currencies c ON c.id = lpc.currency_id
    LEFT JOIN labor_avg_prices lap ON lap.labor_id = lt.id;


-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
-- Resumen:
-- ✅ Vista labor_view eliminada y recreada
-- ✅ Trigger set_updated_by eliminado (no aplica a sistema)
-- ✅ Columnas innecesarias eliminadas
-- ✅ RLS Tipo 4 configurado
-- ✅ Vista recreada sin is_system y con org_id de labor_prices
-- =====================================================
