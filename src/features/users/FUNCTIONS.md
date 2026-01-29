# Funciones de PRESENCIA DE USUARIO (ENTERPRISE v2):

# Funcion heartbeat:

declare
  v_auth_id uuid;
  v_user_id uuid;
begin
  -- 1. Auth check
  v_auth_id := auth.uid();
  if v_auth_id is null then raise exception 'Unauthenticated'; end if;
  
  -- 2. Get internal ID
  select u.id into v_user_id from public.users u where u.auth_id = v_auth_id limit 1;
  if v_user_id is null then raise exception 'User not provisioned'; end if;

  -- 3. Upsert Presence (Atomic with Session ID)
  insert into public.user_presence (
    user_id, org_id, session_id, last_seen_at, status, updated_from, updated_at
  ) values (
    v_user_id, p_org_id, p_session_id, now(), coalesce(p_status, 'online'), 'heartbeat', now()
  )
  on conflict (user_id) do update set
    org_id = excluded.org_id,
    session_id = excluded.session_id, -- Takeover if new session is active
    last_seen_at = excluded.last_seen_at,
    status = excluded.status,
    updated_at = now();
    
  -- 4. (Optional) Extend active session history if exists
  -- This helps with "crash recovery" stats (updates duration progressively)
  if p_session_id is not null then
    update public.user_view_history
    set 
      exited_at = now(), -- Provisional exit time (conceptually "last known alive")
      duration_seconds = extract(epoch from (now() - entered_at))::integer
    where user_id = v_user_id 
      and session_id = p_session_id 
      and exited_at is null; -- Only active view
  end if;
    
end;

# Funcion analytics_track_navigation:

declare
  v_user_id uuid;
  v_org_id uuid;
begin
  -- 1. Identity Check
  select u.id into v_user_id from public.users u where u.auth_id = auth.uid() limit 1;
  if v_user_id is null then return; end if;

  -- 2. Close PREVIOUS view for THIS session
  update public.user_view_history
  set 
    exited_at = now(),
    duration_seconds = extract(epoch from (now() - entered_at))::integer
  where user_id = v_user_id 
    and session_id = p_session_id
    and exited_at is null;

  -- 3. Open NEW view
  insert into public.user_view_history (
    user_id, organization_id, session_id, view_name, entered_at
  ) values (
    v_user_id, p_org_id, p_session_id, p_view_name, now()
  );

  -- 4. Update Presence Pointer
  insert into public.user_presence (
    user_id, org_id, session_id, last_seen_at, current_view, status, updated_from, updated_at
  ) values (
    v_user_id, p_org_id, p_session_id, now(), p_view_name, 'online', 'navigation', now()
  )
  on conflict (user_id) do update set
    org_id = excluded.org_id,
    session_id = excluded.session_id,
    last_seen_at = excluded.last_seen_at,
    current_view = excluded.current_view,
    status = 'online',
    updated_at = now();

end;

# Tabla user_presence:

create table public.user_presence (
  user_id uuid not null,
  org_id uuid not null,
  session_id uuid null, -- NEW: Tab/Session ID
  last_seen_at timestamp with time zone not null default now(),
  status text not null default 'online'::text,
  user_agent text null,
  locale text null,
  updated_from text null,
  current_view text null,
  updated_at timestamp with time zone null default now(),
  constraint user_presence_pkey primary key (user_id),
  constraint user_presence_user_id_key unique (user_id),
  constraint user_presence_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_presence_org_idx on public.user_presence using btree (org_id) TABLESPACE pg_default;
create index IF not exists idx_user_presence_session on public.user_presence using btree (session_id) TABLESPACE pg_default; -- NEW Index

create trigger set_user_presence_updated_at BEFORE
update on user_presence for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_prevent_user_presence_user_id_update BEFORE
update on user_presence for EACH row
execute FUNCTION prevent_user_presence_user_id_update ();

# Tabla user_view_history:

create table public.user_view_history (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid null,
  session_id uuid null, -- NEW: Tab/Session ID
  view_name text not null,
  entered_at timestamp with time zone not null default now(),
  exited_at timestamp with time zone null,
  duration_seconds integer null,
  created_at timestamp with time zone null default now(),
  constraint user_view_history_pkey primary key (id),
  constraint user_view_history_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_view_history_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_view_history_user_id on public.user_view_history using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_user_view_history_session_id on public.user_view_history using btree (session_id) TABLESPACE pg_default; -- NEW Index
create index IF not exists idx_user_view_history_entered_at on public.user_view_history using btree (entered_at) TABLESPACE pg_default;
create index IF not exists idx_user_view_history_user_entered on public.user_view_history using btree (user_id, entered_at) TABLESPACE pg_default;
create index IF not exists idx_user_view_history_org on public.user_view_history using btree (organization_id) TABLESPACE pg_default;

create trigger trg_prevent_user_view_history_user_id_update BEFORE
update on user_view_history for EACH row
execute FUNCTION prevent_user_view_history_user_id_update ();

-- NOTA: El trigger trg_update_org_last_activity fue ELIMINADO porque
-- la columna organizations.last_activity_at ya no existe.

# Vistas de Analytics (ENTERPRISE v2):

-- 1. Usuarios en Tiempo Real (Online) - Excluye Admins
create or replace view analytics_realtime_overview_view as
select count(*) as active_users
from user_presence up
join users u on u.id = up.user_id
where up.last_seen_at > now() - interval '5 minutes'
and up.status = 'online'
and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2';

-- 2. Crecimiento Mensual de Usuarios (MEJORADO) - Excluye Admins
create or replace view analytics_user_growth_view as
select
  date_trunc('month', created_at) as date,
  count(*) as new_users
from users
where role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
group by 1
order by 1 desc;

-- 3. Engagement por Página (Vistas) - Excluye Admins
create or replace view analytics_page_engagement_view as
select
  h.view_name,
  count(*) as visits,
  avg(h.duration_seconds) as avg_duration,
  count(distinct h.session_id) as unique_sessions
from user_view_history h
join users u on u.id = h.user_id
where u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
group by h.view_name;

-- 4. Calidad de Sesión (Rebote y Duración) - Excluye Admins
create or replace view analytics_session_quality_view as
with session_stats as (
  select
    h.session_id,
    h.user_id,
    min(h.entered_at) as session_start,
    max(h.exited_at) as session_end,
    count(*) as views_count,
    sum(h.duration_seconds) as total_duration
  from user_view_history h
  join users u on u.id = h.user_id
  where h.session_id is not null
  and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
  group by h.session_id, h.user_id
)
select
  session_id,
  user_id,
  session_start,
  total_duration,
  views_count,
  case when views_count = 1 and total_duration < 10 then true else false end as is_bounce
from session_stats;

-- 5. Top Usuarios (Más Activos) - MEJORADO (Cuenta Vistas Totales si no hay sesiones)
create or replace view analytics_top_users_view as
select
  u.id,
  u.full_name,
  u.avatar_url,
  -- Si session_id es null (data vieja), usamos count(*) como proxy de actividad
  count(distinct h.session_id) as total_sessions,
  count(*) as total_pageviews, 
  coalesce(sum(h.duration_seconds), 0) as total_time_seconds
from users u
join user_view_history h on h.user_id = u.id
where u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
group by u.id, u.full_name, u.avatar_url
order by total_pageviews desc; -- Ordenar por volumen total de interacción

-- 6. Actividad por Hora (Heatmap) - Excluye Admins
create or replace view analytics_hourly_activity_view as
select
  extract(hour from up.last_seen_at) as hour_of_day,
  count(*) as activity_count
from user_presence up
join users u on u.id = up.user_id
where up.last_seen_at > now() - interval '7 days'
and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
group by 1
order by 1;

-- 7. Métricas Generales (KPIs) - Excluye Admins
create or replace view analytics_general_kpis_view as
select
  (select count(*) from organizations where is_active = true) as total_organizations,
  (select count(*) from projects where is_deleted = false) as total_projects,
  (select count(*) from users where is_active = true and role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2') as total_users;

-- ============================================
-- ENTERPRISE ANALYTICS VIEWS (V2.1)
-- ============================================

-- 8. Tasa de Rebote (Bounce Rate) - Sesiones con solo 1 página
create or replace view analytics_bounce_rate_view as
with session_pages as (
  select
    session_id,
    count(*) as page_count
  from user_view_history h
  join users u on u.id = h.user_id
  where h.session_id is not null
  and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
  group by session_id
)
select
  count(*) filter (where page_count = 1) as bounced_sessions,
  count(*) as total_sessions,
  round(
    (count(*) filter (where page_count = 1)::numeric / nullif(count(*), 0)) * 100, 
    1
  ) as bounce_rate_percent
from session_pages;

-- 9. Duración Promedio de Sesión
create or replace view analytics_session_duration_view as
select
  round(avg(total_duration)::numeric, 0) as avg_duration_seconds,
  round(avg(total_duration)::numeric / 60, 1) as avg_duration_minutes,
  count(*) as total_sessions
from (
  select
    session_id,
    sum(duration_seconds) as total_duration
  from user_view_history h
  join users u on u.id = h.user_id
  where h.session_id is not null
  and h.duration_seconds is not null
  and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
  group by session_id
) sessions;

-- 10. User Journeys (Últimas 20 sesiones con flujo de páginas)
create or replace view analytics_user_journeys_view as
select
  h.session_id,
  u.id as user_id,
  u.full_name,
  u.avatar_url,
  h.view_name,
  h.entered_at,
  h.exited_at,
  h.duration_seconds,
  row_number() over (partition by h.session_id order by h.entered_at) as step_number
from user_view_history h
join users u on u.id = h.user_id
where h.session_id is not null
and u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
and h.entered_at > now() - interval '7 days'
order by h.session_id, h.entered_at;

-- 11. Resumen de Sesiones por Usuario (Para lista de Drop Off mejorada)
create or replace view analytics_user_session_summary_view as
select
  u.id,
  u.full_name,
  u.avatar_url,
  u.created_at,
  count(distinct h.session_id) as session_count,
  max(h.entered_at) as last_activity_at,
  sum(h.duration_seconds) as total_time_seconds
from users u
left join user_view_history h on h.user_id = u.id
where u.role_id <> 'd5606324-af8d-487e-8c8e-552511fce2a2'
and u.is_active = true
group by u.id, u.full_name, u.avatar_url, u.created_at;

-- 12. Drop Off Real (Usuarios en riesgo: creados hace > 7 días, con < 3 sesiones)
create or replace view analytics_at_risk_users_view as
select
  id,
  full_name,
  avatar_url,
  created_at,
  session_count,
  last_activity_at
from analytics_user_session_summary_view
where created_at < now() - interval '7 days'
and session_count < 3
order by session_count asc, last_activity_at asc nulls first
limit 10;
