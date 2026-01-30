-- ============================================================
-- FIX: Enable RLS on 'organization_preferences' table
-- Date: 2026-01-30
-- Issue: Table had no RLS policies, causing 400 errors on queries
-- Pattern: Tipo 1 (tabla con organization_id) - Skill RLS
-- ============================================================

-- 1. Enable RLS on the table
ALTER TABLE public.organization_preferences ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Miembros ven preferencias de su organización
CREATE POLICY "MIEMBROS VEN ORGANIZATION_PREFERENCES"
ON public.organization_preferences
FOR SELECT TO public
USING (can_view_org(organization_id, 'org.view'::text));

-- 3. INSERT: Miembros con permiso crean preferencias
CREATE POLICY "MIEMBROS CREAN ORGANIZATION_PREFERENCES"
ON public.organization_preferences
FOR INSERT TO public
WITH CHECK (can_mutate_org(organization_id, 'org.manage'::text));

-- 4. UPDATE: Miembros con permiso editan preferencias
CREATE POLICY "MIEMBROS EDITAN ORGANIZATION_PREFERENCES"
ON public.organization_preferences
FOR UPDATE TO public
USING (can_mutate_org(organization_id, 'org.manage'::text));

