-- =====================================================
-- MIGRACIÓN: Agregar home_checklist a user_preferences
-- =====================================================
-- Este campo almacena el progreso del onboarding checklist
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar la columna home_checklist si no existe
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS home_checklist JSONB DEFAULT '{}'::jsonb;

-- 2. Comentario descriptivo
COMMENT ON COLUMN public.user_preferences.home_checklist IS 
'Progreso del onboarding checklist. Keys: create_project, add_contact, register_payment, explore_kanban';

-- 3. Inicializar para usuarios existentes que no tengan el campo
UPDATE public.user_preferences 
SET home_checklist = '{}'::jsonb 
WHERE home_checklist IS NULL;

-- =====================================================
-- ACTUALIZAR handle_new_user PARA INICIALIZAR EL CAMPO
-- =====================================================
-- IMPORTANTE: Buscar en tu función handle_new_user donde se hace 
-- el INSERT a user_preferences y agregar home_checklist:
--
-- Cambiar de:
--   INSERT INTO public.user_preferences (user_id, ...)
--   VALUES (new_user_id, ...);
--
-- A:
--   INSERT INTO public.user_preferences (user_id, home_checklist, ...)
--   VALUES (new_user_id, '{}'::jsonb, ...);
-- 
-- O si ya existe el INSERT, agregar la columna al mismo.
-- =====================================================
