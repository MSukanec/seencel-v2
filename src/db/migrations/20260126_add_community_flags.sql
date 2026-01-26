-- Add new flags for Community features
-- Assigning to 'Acceso a Módulos' category (assuming id exists, otherwise null)

with cat as (
    select id from feature_flag_categories where name = 'Acceso a Módulos' limit 1
)
insert into feature_flags (key, description, value, flag_type, category_id, status)
values 
(
    'context_community_map_enabled', 
    'Habilita el acceso al Mapa de la Comunidad', 
    true, 
    'feature', 
    (select id from cat), 
    'active'
),
(
    'context_community_founders_enabled', 
    'Habilita el acceso al directorio de Fundadores', 
    true, 
    'feature', 
    (select id from cat), 
    'founders'
)
on conflict (key) do update 
set category_id = excluded.category_id,
    flag_type = excluded.flag_type;
