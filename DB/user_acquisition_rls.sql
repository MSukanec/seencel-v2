-- =============================================================================
-- USER_ACQUISITION: RLS Policies
-- Fecha: 2026-01-31
-- Tipo: Tabla con `user_id` (Tipo 3) + acceso Admin para analytics
-- =============================================================================

-- =============================================================================
-- PASO 1: HABILITAR RLS
-- =============================================================================

ALTER TABLE public.user_acquisition ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PASO 2: DROP POLÍTICAS EXISTENTES (para re-ejecución limpia)
-- =============================================================================

DROP POLICY IF EXISTS "USUARIOS VEN SU USER_ACQUISITION" ON public.user_acquisition;
DROP POLICY IF EXISTS "USUARIOS CREAN SU USER_ACQUISITION" ON public.user_acquisition;
DROP POLICY IF EXISTS "ADMINS VEN USER_ACQUISITION" ON public.user_acquisition;

-- =============================================================================
-- PASO 3: POLÍTICAS RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USUARIOS: Tipo 3 - Tablas con `user_id` (datos personales)
-- Cada usuario ve solo su propio registro de acquisition
-- -----------------------------------------------------------------------------

-- SELECT: Usuarios ven su acquisition
CREATE POLICY "USUARIOS VEN SU USER_ACQUISITION"
ON public.user_acquisition
FOR SELECT TO public
USING (is_self(user_id));

-- INSERT: Usuarios crean su acquisition (solo 1 por usuario, hay UNIQUE index)
CREATE POLICY "USUARIOS CREAN SU USER_ACQUISITION"
ON public.user_acquisition
FOR INSERT TO public
WITH CHECK (is_self(user_id));

-- NOTA: No se necesita UPDATE porque acquisition es solo de lectura después de crearse

-- -----------------------------------------------------------------------------
-- ADMINS: Tipo 4 - Acceso global para administradores (analytics)
-- Los admins pueden ver todos los registros para análisis de marketing
-- -----------------------------------------------------------------------------

-- SELECT: Admins ven todos los acquisitions
CREATE POLICY "ADMINS VEN USER_ACQUISITION"
ON public.user_acquisition
FOR SELECT TO public
USING (is_admin());

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_acquisition';

-- Listar políticas activas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_acquisition';
