-- ============================================================
-- Agregar columna image_palette a la tabla projects
-- Esta columna almacena los colores extraídos de la imagen del proyecto
-- ============================================================

-- Agregar columna JSONB para almacenar la paleta de colores
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_palette jsonb;

-- Comentario para documentación
COMMENT ON COLUMN projects.image_palette IS 'Paleta de colores extraída de la imagen del proyecto. Formato: {"primary": "#hex", "secondary": "#hex", "background": "#hex", "accent": "#hex"}';

-- ============================================================
-- Actualizar la view para incluir image_palette
-- ============================================================

DROP VIEW IF EXISTS public.projects_view;

CREATE VIEW public.projects_view AS
SELECT
  p.id,
  p.name,
  p.code,
  p.status,
  p.created_at,
  p.updated_at,
  p.last_active_at,
  p.is_active,
  p.is_deleted,
  p.deleted_at,
  p.organization_id,
  p.created_by,
  p.color,
  p.use_custom_color,
  p.custom_color_h,
  p.custom_color_hex,
  p.is_over_limit,
  p.image_url,
  p.image_palette,  -- NEW: Paleta de colores extraída
  p.project_type_id,
  p.project_modality_id,
  pd.is_public,
  pd.city,
  pd.country,
  pd.start_date,
  pd.estimated_end,
  pt.name AS project_type_name,
  pm.name AS project_modality_name
FROM
  projects p
  LEFT JOIN project_data pd ON pd.project_id = p.id
  LEFT JOIN project_types pt ON pt.id = p.project_type_id
    AND pt.is_deleted = false
  LEFT JOIN project_modalities pm ON pm.id = p.project_modality_id
    AND pm.is_deleted = false
WHERE
  p.is_deleted = false;
