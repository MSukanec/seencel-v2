-- Vista para usuarios por país
-- Ejecutar en Supabase

CREATE OR REPLACE VIEW public.analytics_users_by_country_view AS
SELECT 
    c.id AS country_id,
    c.name AS country_name,
    c.alpha_2 AS country_code,
    COUNT(ud.user_id) AS user_count
FROM public.user_data ud
JOIN public.countries c ON c.id = ud.country
WHERE ud.country IS NOT NULL
GROUP BY c.id, c.name, c.alpha_2
ORDER BY user_count DESC;

-- Permisos de lectura para usuarios autenticados
GRANT SELECT ON public.analytics_users_by_country_view TO authenticated;
