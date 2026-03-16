-- ============================================================================
-- UPDATE projects_view — Agregar campos de ubicación de project_data
-- ============================================================================
-- Agrega: address, state, zip_code, lat, lng, place_id
-- Estos campos se necesitan para el AddressChip/AddressColumn inline editing
-- ============================================================================

DROP VIEW IF EXISTS projects.projects_view;

CREATE VIEW projects.projects_view AS
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
  p.is_over_limit,
  p.image_url,
  p.image_palette,
  p.project_type_id,
  p.project_modality_id,
  COALESCE(pst.use_custom_color, false) AS use_custom_color,
  pst.custom_color_h,
  pst.custom_color_hex,
  COALESCE(pst.use_palette_theme, false) AS use_palette_theme,
  pd.is_public,
  pd.city,
  pd.country,
  -- Campos de ubicación (nuevos)
  pd.address,
  pd.state,
  pd.zip_code,
  pd.lat,
  pd.lng,
  pd.place_id,
  pt.name AS project_type_name,
  pm.name AS project_modality_name
FROM
  projects.projects p
  LEFT JOIN projects.project_data pd ON pd.project_id = p.id
  LEFT JOIN projects.project_settings pst ON pst.project_id = p.id
  LEFT JOIN projects.project_types pt ON pt.id = p.project_type_id
    AND pt.is_deleted = false
  LEFT JOIN projects.project_modalities pm ON pm.id = p.project_modality_id
    AND pm.is_deleted = false
WHERE
  p.is_deleted = false;

-- Grants
GRANT SELECT ON projects.projects_view TO authenticated;
GRANT SELECT ON projects.projects_view TO anon;
