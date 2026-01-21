-- Add maintenance mode feature flag
INSERT INTO public.feature_flags (key, value, description, category)
VALUES (
    'dashboard_maintenance_mode',
    false,
    'Cuando está activado, los usuarios verán una página de mantenimiento al intentar acceder al dashboard. Las páginas públicas siguen funcionando normalmente.',
    'system'
)
ON CONFLICT (key) DO NOTHING;
