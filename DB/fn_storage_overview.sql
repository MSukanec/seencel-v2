-- ============================================================================
-- fn_storage_overview
-- ============================================================================
-- Reemplaza la query JS que trae TODOS los archivos de media_files
-- para calcular totales con SUM/GROUP BY en el cliente.
-- Ahora se hace directo en SQL con una sola query.
--
-- Retorna: total_bytes, file_count, folder_count, max_storage_mb,
--          y un JSONB con breakdown por tipo de archivo.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_storage_overview(
    p_org_id UUID
)
RETURNS TABLE (
    total_bytes BIGINT,
    file_count BIGINT,
    folder_count BIGINT,
    max_storage_mb INT,
    by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id UUID;
    v_max_storage INT := 500;
BEGIN
    -- 1. Get plan storage limit
    SELECT o.plan_id INTO v_plan_id
    FROM organizations o
    WHERE o.id = p_org_id;
    
    IF v_plan_id IS NOT NULL THEN
        SELECT pf.max_storage_mb INTO v_max_storage
        FROM plan_features pf
        WHERE pf.plan_id = v_plan_id;
    END IF;

    -- 2. Single aggregation query
    RETURN QUERY
    WITH file_stats AS (
        SELECT 
            COALESCE(SUM(mf.file_size), 0)::BIGINT AS total_bytes,
            COUNT(*)::BIGINT AS file_count,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'type', COALESCE(mf.file_type, 'other'),
                        'count', type_count,
                        'bytes', type_bytes
                    )
                ) FILTER (WHERE type_count IS NOT NULL),
                '[]'::JSONB
            ) AS by_type
        FROM (
            SELECT 
                COALESCE(file_type, 'other') AS file_type,
                file_size,
                COUNT(*) OVER (PARTITION BY COALESCE(file_type, 'other')) AS type_count,
                SUM(file_size) OVER (PARTITION BY COALESCE(file_type, 'other')) AS type_bytes
            FROM media_files
            WHERE organization_id = p_org_id
              AND is_deleted = false
        ) mf
    ),
    folder_stats AS (
        SELECT COUNT(*)::BIGINT AS folder_count
        FROM media_file_folders
        WHERE organization_id = p_org_id
    ),
    type_breakdown AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'type', ft.file_type,
                    'count', ft.cnt,
                    'bytes', ft.total
                )
                ORDER BY ft.total DESC
            ) AS by_type
        FROM (
            SELECT 
                COALESCE(file_type, 'other') AS file_type,
                COUNT(*) AS cnt,
                COALESCE(SUM(file_size), 0) AS total
            FROM media_files
            WHERE organization_id = p_org_id
              AND is_deleted = false
            GROUP BY COALESCE(file_type, 'other')
        ) ft
    )
    SELECT 
        COALESCE((SELECT SUM(mf.file_size) FROM media_files mf WHERE mf.organization_id = p_org_id AND mf.is_deleted = false), 0)::BIGINT,
        (SELECT COUNT(*) FROM media_files mf WHERE mf.organization_id = p_org_id AND mf.is_deleted = false)::BIGINT,
        fs.folder_count,
        v_max_storage,
        COALESCE(tb.by_type, '[]'::JSONB)
    FROM folder_stats fs
    CROSS JOIN type_breakdown tb;
END;
$$;
