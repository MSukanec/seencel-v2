-- =============================================================================
-- SUPPORT_MESSAGES: RLS Policies
-- Fecha: 2026-01-31
-- Tipo: Tabla con `user_id` (Tipo 3) + acceso Admin
-- =============================================================================

-- =============================================================================
-- PASO 1: HABILITAR RLS
-- =============================================================================

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PASO 2: DROP POLÍTICAS EXISTENTES (para re-ejecución limpia)
-- =============================================================================

DROP POLICY IF EXISTS "USUARIOS VEN SUS SUPPORT_MESSAGES" ON public.support_messages;
DROP POLICY IF EXISTS "USUARIOS CREAN SUS SUPPORT_MESSAGES" ON public.support_messages;
DROP POLICY IF EXISTS "USUARIOS EDITAN SUS SUPPORT_MESSAGES" ON public.support_messages;
DROP POLICY IF EXISTS "ADMINS VEN SUPPORT_MESSAGES" ON public.support_messages;
DROP POLICY IF EXISTS "ADMINS CREAN SUPPORT_MESSAGES" ON public.support_messages;
DROP POLICY IF EXISTS "ADMINS EDITAN SUPPORT_MESSAGES" ON public.support_messages;

-- =============================================================================
-- PASO 3: POLÍTICAS RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USUARIOS: Tipo 3 - Tablas con `user_id` (datos personales)
-- Cada usuario ve y gestiona solo sus propios mensajes
-- -----------------------------------------------------------------------------

-- SELECT: Usuarios ven sus mensajes
CREATE POLICY "USUARIOS VEN SUS SUPPORT_MESSAGES"
ON public.support_messages
FOR SELECT TO public
USING (is_self(user_id));

-- INSERT: Usuarios crean mensajes (solo como sender='user')
CREATE POLICY "USUARIOS CREAN SUS SUPPORT_MESSAGES"
ON public.support_messages
FOR INSERT TO public
WITH CHECK (is_self(user_id) AND sender = 'user');

-- UPDATE: Usuarios editan sus mensajes (para marcar read_by_user)
CREATE POLICY "USUARIOS EDITAN SUS SUPPORT_MESSAGES"
ON public.support_messages
FOR UPDATE TO public
USING (is_self(user_id));

-- -----------------------------------------------------------------------------
-- ADMINS: Tipo 4 - Acceso global para administradores
-- Los admins pueden ver y gestionar todos los mensajes
-- -----------------------------------------------------------------------------

-- SELECT: Admins ven todos los mensajes
CREATE POLICY "ADMINS VEN SUPPORT_MESSAGES"
ON public.support_messages
FOR SELECT TO public
USING (is_admin());

-- INSERT: Admins crean mensajes (solo como sender='admin')
CREATE POLICY "ADMINS CREAN SUPPORT_MESSAGES"
ON public.support_messages
FOR INSERT TO public
WITH CHECK (is_admin() AND sender = 'admin');

-- UPDATE: Admins editan mensajes (para marcar read_by_admin)
CREATE POLICY "ADMINS EDITAN SUPPORT_MESSAGES"
ON public.support_messages
FOR UPDATE TO public
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
WHERE tablename = 'support_messages';

-- Listar políticas activas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'support_messages';
