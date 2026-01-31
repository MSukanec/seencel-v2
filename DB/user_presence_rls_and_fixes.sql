-- =============================================================================
-- USER_PRESENCE: RLS Policies & Schema Improvements
-- Fecha: 2026-01-31
-- =============================================================================

-- =============================================================================
-- PARTE 1: MEJORAS A LA TABLA
-- =============================================================================

-- 1.1 Agregar FK a organizations (opcional, pero recomendado para integridad)
-- NOTA: Si hay org_id que no existen en organizations, esto fallará.
-- Descomentar solo si estás seguro de la integridad de datos.
/*
ALTER TABLE public.user_presence
ADD CONSTRAINT user_presence_org_id_fkey 
    FOREIGN KEY (org_id) 
    REFERENCES public.organizations(id) 
    ON DELETE CASCADE;
*/

-- 1.2 Agregar índice en last_seen_at (usado en ORDER BY del dashboard)
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen 
    ON public.user_presence USING btree (last_seen_at DESC) 
    TABLESPACE pg_default;

-- 1.3 Agregar índice compuesto para queries de "usuarios online"
CREATE INDEX IF NOT EXISTS idx_user_presence_status_last_seen 
    ON public.user_presence (status, last_seen_at DESC)
    WHERE status = 'online';

-- =============================================================================
-- PARTE 2: HABILITAR RLS
-- =============================================================================

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 3: POLÍTICAS RLS
-- =============================================================================

-- DROP de políticas existentes si las hay (para re-ejecución limpia)
DROP POLICY IF EXISTS "USUARIOS VEN SU PROPIA PRESENCIA" ON public.user_presence;
DROP POLICY IF EXISTS "ADMINS VEN TODA PRESENCIA" ON public.user_presence;
DROP POLICY IF EXISTS "SISTEMA GESTIONA PRESENCIA" ON public.user_presence;

-- -----------------------------------------------------------------------------
-- SELECT: Los usuarios solo ven su propia presencia
-- Los admins ven toda la presencia (para el dashboard)
-- -----------------------------------------------------------------------------

CREATE POLICY "USUARIOS VEN SU PROPIA PRESENCIA"
ON public.user_presence
FOR SELECT TO public
USING (
    is_self(user_id) -- El usuario ve su propia presencia
);

CREATE POLICY "ADMINS VEN TODA PRESENCIA"
ON public.user_presence
FOR SELECT TO public
USING (
    is_admin() -- Los admins ven todo para analytics
);

-- -----------------------------------------------------------------------------
-- INSERT/UPDATE: Solo el sistema (vía funciones SECURITY DEFINER)
-- El heartbeat y analytics_track_navigation corren con SECURITY DEFINER
-- por lo que atraviesan RLS. No necesitamos políticas de INSERT/UPDATE
-- para usuarios normales.
-- -----------------------------------------------------------------------------

-- Política que permite que las funciones SECURITY DEFINER funcionen
-- como "bypass" efectivo para INSERT/UPDATE cuando el usuario es el dueño
CREATE POLICY "SISTEMA GESTIONA PRESENCIA"
ON public.user_presence
FOR ALL TO public
USING (
    is_self(user_id) -- Solo el propio usuario (vía SECURITY DEFINER RPC)
)
WITH CHECK (
    is_self(user_id)
);

-- =============================================================================
-- PARTE 4: VERIFICACIÓN
-- =============================================================================

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_presence';

-- Listar políticas activas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_presence';
