-- ============================================================================
-- Migración: Eliminar campos obsoletos de project_data
-- Fecha: 2026-02-14
-- Descripción: Elimina internal_notes, start_date, estimated_end,
--              client_name, contact_phone, email de project_data.
--              Recrea projects_view sin esos campos.
-- ============================================================================

-- ── 1. ALTER TABLE: Eliminar columnas ──────────────────────────────────────

ALTER TABLE public.project_data
    DROP COLUMN IF EXISTS internal_notes,
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS estimated_end,
    DROP COLUMN IF EXISTS client_name,
    DROP COLUMN IF EXISTS contact_phone,
    DROP COLUMN IF EXISTS email;

-- ── 2. Recrear projects_view sin esos campos ──────────────────────────────

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
    pt.name AS project_type_name,
    pm.name AS project_modality_name
FROM
    projects p
    LEFT JOIN project_data pd ON pd.project_id = p.id
    LEFT JOIN project_settings pst ON pst.project_id = p.id
    LEFT JOIN project_types pt ON pt.id = p.project_type_id
        AND pt.is_deleted = false
    LEFT JOIN project_modalities pm ON pm.id = p.project_modality_id
        AND pm.is_deleted = false
WHERE
    p.is_deleted = false;
