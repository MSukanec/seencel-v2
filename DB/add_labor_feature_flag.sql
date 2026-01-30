-- ============================================================
-- ADD FEATURE FLAG: Mano de Obra (Labor) Module
-- Date: 2026-01-30
-- Key: sidebar_project_labor
-- ============================================================

-- Insert the feature flag for Labor module
-- Status options: 'active', 'maintenance', 'hidden', 'founders'
INSERT INTO public.feature_flags (key, value, description, category, status, flag_type)
VALUES (
    'sidebar_project_labor',
    true,
    'Mano de Obra',
    'sidebar',
    'active',  -- Cambiar a 'maintenance' para bloquear, 'hidden' para ocultar, 'founders' para acceso fundadores
    'feature'
)
ON CONFLICT (key) DO UPDATE 
SET description = EXCLUDED.description,
    category = EXCLUDED.category,
    flag_type = EXCLUDED.flag_type;

-- Para poner en mantenimiento:
-- UPDATE public.feature_flags SET status = 'maintenance' WHERE key = 'sidebar_project_labor';

-- Para ocultar (solo admins ven):
-- UPDATE public.feature_flags SET status = 'hidden' WHERE key = 'sidebar_project_labor';

-- Para activar:
-- UPDATE public.feature_flags SET status = 'active' WHERE key = 'sidebar_project_labor';
