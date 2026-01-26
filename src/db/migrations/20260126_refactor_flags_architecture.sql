-- 1. Create Categories Table
create table if not exists feature_flag_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    position integer default 0,
    parent_id uuid references feature_flag_categories(id) on delete set null,
    created_at timestamptz default now()
);

-- 2. Add Type and CategoryID to Feature Flags
alter table feature_flags 
add column if not exists flag_type text check (flag_type in ('system', 'feature')) default 'feature',
add column if not exists category_id uuid references feature_flag_categories(id) on delete set null;

-- 3. Data Migration

-- Insert 'Acceso a Módulos' category (Features)
with cat as (
    insert into feature_flag_categories (name, position) 
    values ('Acceso a Módulos', 10) 
    on conflict do nothing 
    returning id
)
update feature_flags 
set 
    flag_type = 'feature',
    category_id = (select id from cat)
where key like 'context_%';

-- Insert 'Configuración del Sistema' category (System)
with cat as (
    insert into feature_flag_categories (name, position) 
    values ('Configuración del Sistema', 20) 
    on conflict do nothing 
    returning id
)
update feature_flags 
set 
    flag_type = 'system',
    category_id = (select id from cat)
where key in (
    'dashboard_maintenance_mode',
    'pro_purchases_enabled', 
    'teams_purchases_enabled',
    'course_purchases_enabled',
    'mp_test_mode',
    'paypal_test_mode'
);
