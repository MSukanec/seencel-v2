-- =============================================
-- 008: Create organizations_view
-- =============================================
-- Vista de solo lectura que pre-joinea datos frecuentes:
-- - Plan info (name, slug, features)
-- - Owner info (full_name, email)
-- - Conteo de miembros activos
--
-- Uso: Reemplaza JOINs repetitivos en el frontend.
-- NO reemplaza la tabla para mutations (INSERT/UPDATE/DELETE).
-- =============================================

CREATE OR REPLACE VIEW public.organizations_view AS
SELECT
    o.id,
    o.name,
    o.logo_url,
    o.owner_id,
    o.plan_id,
    o.is_active,
    o.is_deleted,
    o.deleted_at,
    o.is_demo,
    o.business_mode,
    o.settings,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.purchased_seats,
    -- Plan info (evita JOIN a plans)
    p.name AS plan_name,
    p.slug AS plan_slug,
    p.features AS plan_features,
    -- Owner info (evita JOIN a users)
    u.full_name AS owner_name,
    u.email AS owner_email,
    -- Conteo de miembros activos (subquery correlacionada)
    (
        SELECT COUNT(*)::int
        FROM organization_members om
        WHERE om.organization_id = o.id
          AND om.is_active = true
    ) AS active_members_count
FROM organizations o
LEFT JOIN plans p ON o.plan_id = p.id
LEFT JOIN users u ON o.owner_id = u.id;

-- Comentario para documentación
COMMENT ON VIEW public.organizations_view IS 
'Vista de lectura con datos pre-joineados de organizations: plan, owner y conteo de miembros activos.';
