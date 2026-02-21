-- ============================================================
-- Feature Flag: Bloquear creación de nuevas organizaciones
-- ============================================================
-- Cuando status != 'active', bloquea la creación de organizaciones
-- para usuarios normales. Los admins pueden saltarse el bloqueo.
-- ============================================================

INSERT INTO public.feature_flags (
    key,
    value,
    description,
    category,
    status,
    flag_type,
    category_id
) VALUES (
    'org_creation_enabled',
    true,
    'Habilita o deshabilita la creación de nuevas organizaciones',
    'system',
    'active',
    'system',
    '9ef601f4-0dd8-459e-8a7a-f61084291a3d'
);
