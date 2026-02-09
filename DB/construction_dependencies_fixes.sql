-- ============================================================
-- CONSTRUCTION_DEPENDENCIES — DROP + CREATE desde cero
-- Fecha: 2026-02-09
-- ============================================================

-- Dropear tabla existente (CASCADE borra FKs dependientes)
DROP TABLE IF EXISTS public.construction_dependencies CASCADE;

-- Crear tabla nueva completa
CREATE TABLE public.construction_dependencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  predecessor_task_id uuid NOT NULL,
  successor_task_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'FS'::text,
  lag_days integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,

  -- PKs y Uniques
  CONSTRAINT construction_dependencies_pkey PRIMARY KEY (id),
  CONSTRAINT construction_dependencies_unique UNIQUE (predecessor_task_id, successor_task_id, type),

  -- FKs
  CONSTRAINT construction_dependencies_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT construction_dependencies_predecessor_task_id_fkey
    FOREIGN KEY (predecessor_task_id) REFERENCES construction_tasks (id) ON DELETE CASCADE,
  CONSTRAINT construction_dependencies_successor_task_id_fkey
    FOREIGN KEY (successor_task_id) REFERENCES construction_tasks (id) ON DELETE CASCADE,
  CONSTRAINT construction_dependencies_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES organization_members (id) ON DELETE SET NULL,
  CONSTRAINT construction_dependencies_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES organization_members (id) ON DELETE SET NULL,

  -- CHECKs
  CONSTRAINT construction_dependencies_type_check CHECK (type IN ('FS', 'FF', 'SS', 'SF')),
  CONSTRAINT construction_dependencies_no_self_reference CHECK (predecessor_task_id != successor_task_id)
) TABLESPACE pg_default;


-- Índices
CREATE INDEX idx_construction_dependencies_predecessor
  ON public.construction_dependencies (predecessor_task_id);

CREATE INDEX idx_construction_dependencies_successor
  ON public.construction_dependencies (successor_task_id);

CREATE INDEX idx_construction_dependencies_organization
  ON public.construction_dependencies (organization_id);


-- Trigger de auditoría (updated_by automático)
CREATE TRIGGER set_updated_by_construction_dependencies
  BEFORE INSERT OR UPDATE ON public.construction_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_by();


-- RLS
ALTER TABLE public.construction_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIEMBROS VEN CONSTRUCTION_DEPENDENCIES"
  ON public.construction_dependencies
  FOR SELECT TO public
  USING (can_view_org(organization_id, 'projects.view'::text));

CREATE POLICY "MIEMBROS CREAN CONSTRUCTION_DEPENDENCIES"
  ON public.construction_dependencies
  FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'projects.manage'::text));

CREATE POLICY "MIEMBROS EDITAN CONSTRUCTION_DEPENDENCIES"
  ON public.construction_dependencies
  FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'projects.manage'::text));

CREATE POLICY "MIEMBROS BORRAN CONSTRUCTION_DEPENDENCIES"
  ON public.construction_dependencies
  FOR DELETE TO public
  USING (can_mutate_org(organization_id, 'projects.manage'::text));
