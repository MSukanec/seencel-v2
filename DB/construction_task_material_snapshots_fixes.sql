-- ============================================================
-- CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS — RLS + FK fix
-- Fecha: 2026-02-09
-- ============================================================


-- -------------------------------------------------------
-- 1. Agregar FK faltante en source_task_id
-- -------------------------------------------------------
ALTER TABLE public.construction_task_material_snapshots
  ADD CONSTRAINT ctms_source_task_fkey
  FOREIGN KEY (source_task_id) REFERENCES tasks (id)
  ON DELETE SET NULL;


-- -------------------------------------------------------
-- 2. RLS — Habilitar + Políticas
-- -------------------------------------------------------
ALTER TABLE public.construction_task_material_snapshots ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "MIEMBROS VEN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS"
  ON public.construction_task_material_snapshots
  FOR SELECT TO public
  USING (can_view_org(organization_id, 'projects.view'::text));

-- INSERT (generado por trigger, pero necesita policy)
CREATE POLICY "MIEMBROS CREAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS"
  ON public.construction_task_material_snapshots
  FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'projects.manage'::text));

-- UPDATE
CREATE POLICY "MIEMBROS EDITAN CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS"
  ON public.construction_task_material_snapshots
  FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'projects.manage'::text));
