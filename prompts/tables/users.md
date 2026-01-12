# Tablas relacionadas a USUARIOS:

# Tabla ORGANIZATION_MEMBERS:

create table public.organization_members (
  created_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  is_active boolean not null default true,
  organization_id uuid not null,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  role_id uuid null,
  last_active_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_billable boolean not null default true,
  is_over_limit boolean null default false,
  constraint organization_members_pkey primary key (id),
  constraint organization_members_idd_key unique (id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references organization_members (id) on delete set null,
  constraint organization_members_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint organization_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists organization_members_organization_id_idx on public.organization_members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists organization_members_user_id_idx on public.organization_members using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists unique_user_per_organization on public.organization_members using btree (user_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_org_members_org_user on public.organization_members using btree (organization_id, user_id) TABLESPACE pg_default;

create index IF not exists org_members_over_limit_idx on public.organization_members using btree (organization_id, is_over_limit) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on organization_members for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_create_contact_on_new_member
after INSERT on organization_members for EACH row
execute FUNCTION handle_new_org_member_contact ();

# Tabla ORGANIZATIONS:

create table public.organizations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  created_by uuid null,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  plan_id uuid null,
  is_system boolean null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  owner_id uuid null,
  settings jsonb null default '{}'::jsonb,
  is_demo boolean not null default false,
  last_activity_at timestamp with time zone null default now(),
  logo_path text null,
  constraint organizations_pkey primary key (id),
  constraint organizations_id_key unique (id),
  constraint organizations_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE,
  constraint organizations_owner_fkey foreign KEY (owner_id) references users (id) on delete set null,
  constraint organizations_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_organizations_updated_at on public.organizations using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_organizations_active_not_deleted on public.organizations using btree (is_active, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_organizations_plan on public.organizations using btree (plan_id) TABLESPACE pg_default;

create index IF not exists idx_organizations_last_activity on public.organizations using btree (last_activity_at) TABLESPACE pg_default;

create trigger organizations_set_updated_at BEFORE
update on organizations for EACH row when (old.updated_at is distinct from new.updated_at)
execute FUNCTION update_updated_at_column ();

# Tabla USERS:

create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  auth_id uuid not null,
  email text not null,
  avatar_url text null,
  avatar_source public.avatar_source_t null default 'email'::avatar_source_t,
  full_name text null,
  role_id uuid not null default 'e6cc68d2-fc28-421b-8bd3-303326ef91b8'::uuid,
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  signup_completed boolean not null default false,
  constraint users_pkey primary key (id),
  constraint users_auth_id_key unique (auth_id),
  constraint users_id_key unique (id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete RESTRICT,
  constraint users_email_format_chk check (
    (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists users_email_lower_uniq on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_avatar_source on public.users using btree (avatar_source) TABLESPACE pg_default;

create index IF not exists idx_users_signup_completed on public.users using btree (signup_completed) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trg_users_normalize_email BEFORE INSERT
or
update on users for EACH row
execute FUNCTION users_normalize_email ();

create trigger trigger_sync_contact_on_user_update
after
update on users for EACH row
execute FUNCTION sync_contact_on_user_update ();

# Funcun CURRENT_USER:

  select u.id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;

# Funcion get_user:

declare
  current_user_auth_id uuid;
  current_user_internal_id uuid;
  result json;
begin
  -- Obtener auth.uid()
  current_user_auth_id := auth.uid();

  -- Si no hay usuario autenticado, retornar NULL
  if current_user_auth_id is null then
    return null;
  end if;

  -- Obtener users.id
  select u.id
  into current_user_internal_id
  from public.users u
  where u.auth_id = current_user_auth_id
  limit 1;

  if current_user_internal_id is null then
    return null;
  end if;

  with
  -- Organización activa + plan + preferencias
  active_org as (
    select
      o.id, o.name, o.is_active, o.is_system, o.created_by, o.created_at, o.updated_at,
      o.owner_id,
      p.id as plan_id, p.name as plan_name, p.slug as plan_slug, p.features as plan_features,
      p.monthly_amount as plan_monthly_amount,
      p.annual_amount as plan_annual_amount,
      p.billing_type as plan_billing_type,
      op.default_currency_id,
      op.default_wallet_id,
      op.default_pdf_template_id,
      op.use_currency_exchange,
      op.created_at as op_created_at,
      op.updated_at as op_updated_at,
      uop.last_project_id,
      om.role_id
    from public.user_preferences up
    join public.organizations o on o.id = up.last_organization_id
    left join public.plans p on p.id = o.plan_id
    left join public.organization_preferences op on op.organization_id = o.id
    left join public.user_organization_preferences uop
      on uop.user_id = up.user_id
     and uop.organization_id = o.id
    join public.organization_members om
      on om.organization_id = o.id
     and om.user_id = up.user_id
     and om.is_active = true
    where up.user_id = current_user_internal_id
  ),

  -- Rol y permisos activos
  active_role_permissions as (
    select
      r.id as role_id,
      r.name as role_name,
      json_agg(
        json_build_object(
          'id', perm.id,
          'key', perm.key,
          'description', perm.description,
          'category', perm.category
        )
      ) filter (where perm.id is not null) as permissions
    from active_org ao
    join public.roles r on r.id = ao.role_id
    left join public.role_permissions rp on rp.role_id = r.id
    left join public.permissions perm on perm.id = rp.permission_id
    group by r.id, r.name
  ),

  -- Membresías activas
  user_memberships as (
    select json_agg(
      json_build_object(
        'organization_id', om.organization_id,
        'organization_name', org.name,
        'is_active', om.is_active,
        'joined_at', om.joined_at,
        'last_active_at', om.last_active_at,
        'role', json_build_object(
          'id', r.id,
          'name', r.name
        )
      )
    ) as memberships
    from public.organization_members om
    join public.organizations org on org.id = om.organization_id
    join public.roles r on r.id = om.role_id
    where om.user_id = current_user_internal_id
      and om.is_active = true
  ),

  -- Organizaciones del usuario
  user_organizations as (
    select json_agg(
      json_build_object(
        'id', org.id,
        'name', org.name,
        'created_at', org.created_at,
        'is_active', org.is_active,
        'is_system', org.is_system,
        'plan', case when p.id is not null then json_build_object(
          'id', p.id,
          'name', p.name,
          'slug', p.slug,
          'features', p.features,
          'monthly_amount', p.monthly_amount,
          'annual_amount', p.annual_amount,
          'billing_type', p.billing_type
        ) else null end,
        'owner_id', org.owner_id
      )
    ) as organizations
    from public.organization_members om
    join public.organizations org on org.id = om.organization_id
    left join public.plans p on p.id = org.plan_id
    where om.user_id = current_user_internal_id
      and om.is_active = true
  )

  select json_build_object(
    'user', json_build_object(
      'id', u.id,
      'auth_id', u.auth_id,
      'email', u.email,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'avatar_source', u.avatar_source,
      'created_at', u.created_at
    ),
    'user_data', case when ud.id is not null then json_build_object(
      'id', ud.id,
      'user_id', ud.user_id,
      'first_name', ud.first_name,
      'last_name', ud.last_name,
      'country', ud.country,
      'birthdate', ud.birthdate,
      'phone_e164', ud.phone_e164,
      'created_at', ud.created_at,
      'updated_at', ud.updated_at
    ) else null end,
    'preferences', case when up.id is not null then json_build_object(
      'id', up.id,
      'user_id', up.user_id,
      'theme', up.theme,
      'sidebar_docked', up.sidebar_docked,
      'last_organization_id', up.last_organization_id,
      'last_project_id', ao.last_project_id,
      'last_user_type', up.last_user_type,
      'onboarding_completed', up.onboarding_completed,
      'layout', up.layout,
      'language', up.language, -- <--- NUEVO CAMPO AGREGADO
      'created_at', up.created_at,
      'updated_at', up.updated_at
    ) else null end,
    'organization', case when ao.id is not null then json_build_object(
      'id', ao.id,
      'name', ao.name,
      'is_active', ao.is_active,
      'is_system', ao.is_system,
      'created_by', ao.created_by,
      'owner_id', ao.owner_id,
      'created_at', ao.created_at,
      'updated_at', ao.updated_at,
      'plan', case when ao.plan_id is not null then json_build_object(
        'id', ao.plan_id,
        'name', ao.plan_name,
        'slug', ao.plan_slug,
        'features', ao.plan_features,
        'monthly_amount', ao.plan_monthly_amount,
        'annual_amount', ao.plan_annual_amount,
        'billing_type', ao.plan_billing_type
      ) else null end,
      'preferences', case when ao.default_currency_id is not null then json_build_object(
        'organization_id', ao.id,
        'default_currency', ao.default_currency_id,
        'default_wallet', ao.default_wallet_id,
        'pdf_template', ao.default_pdf_template_id,
        'use_currency_exchange', ao.use_currency_exchange,
        'created_at', ao.op_created_at,
        'updated_at', ao.op_updated_at
      ) else null end
    ) else null end,
    'role', case when arp.role_id is not null then json_build_object(
      'id', arp.role_id,
      'name', arp.role_name,
      'permissions', coalesce(arp.permissions, '[]'::json)
    ) else null end,
    'organizations', coalesce(uo.organizations, '[]'::json),
    'memberships', coalesce(um.memberships, '[]'::json)
  )
  into result
  from public.users u
  left join public.user_data ud on ud.user_id = u.id
  left join public.user_preferences up on up.user_id = u.id
  left join active_org ao on ao.id = up.last_organization_id
  left join active_role_permissions arp on arp.role_id = ao.role_id
  cross join user_memberships um
  cross join user_organizations uo
  where u.id = current_user_internal_id;

  return result;
end;