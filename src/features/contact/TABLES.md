# Detalle de las tablas de Supabase para CONTACTOS:

## Tabla CONTACT_CATEGORIES:

create table public.contact_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  organization_id uuid null,
  updated_by uuid null,
  created_by uuid null,
  constraint contact_categories_pkey primary key (id),
  constraint contact_categories_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint contact_categories_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint contact_categories_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create unique INDEX IF not exists idx_contact_categories_org_name_active on public.contact_categories using btree (organization_id, name) TABLESPACE pg_default
where
  (
    (is_deleted = false)
    and (organization_id is not null)
  );

create unique INDEX IF not exists idx_contact_categories_global_name_active on public.contact_categories using btree (name) TABLESPACE pg_default
where
  (
    (is_deleted = false)
    and (organization_id is null)
  );

create trigger on_contact_category_audit
after INSERT
or DELETE
or
update on contact_categories for EACH row
execute FUNCTION log_contact_category_activity ();

create trigger set_updated_by_contact_categories BEFORE
update on contact_categories for EACH row
execute FUNCTION handle_updated_by ();

## Tabla CONTACT_CATEGORY_LINKS:

create table public.contact_category_links (
  id uuid not null default gen_random_uuid (),
  contact_id uuid not null,
  contact_category_id uuid not null,
  created_at timestamp with time zone null default now(),
  organization_id uuid not null,
  updated_at timestamp with time zone null default now(),
  constraint contact_category_links_pkey primary key (id),
  constraint contact_category_links_contact_id_contact_category_id_key unique (contact_id, contact_category_id),
  constraint contact_category_links_contact_category_id_fkey foreign KEY (contact_category_id) references contact_categories (id) on delete CASCADE,
  constraint contact_category_links_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint contact_category_links_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trigger_contact_category_links_updated_at BEFORE
update on contact_category_links for EACH row
execute FUNCTION update_contact_category_links_updated_at ();

## Tabla CONTACTS:

create table public.contacts (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  first_name text null,
  email text null,
  phone text null,
  company_name text null,
  location text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  last_name text null,
  linked_user_id uuid null,
  full_name text null,
  updated_at timestamp with time zone not null default now(),
  national_id text null,
  avatar_updated_at timestamp with time zone null,
  is_local boolean not null default true,
  display_name_override text null,
  linked_at timestamp with time zone null,
  sync_status text not null default 'local'::text,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  image_url text null,
  import_batch_id uuid null,
  updated_by uuid null,
  created_by uuid null,
  contact_type text not null default 'person'::text,
  company_id uuid null,
  constraint contacts_pkey primary key (id),
  constraint contacts_national_id_org_key unique (organization_id, national_id),
  constraint contacts_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id),
  constraint contacts_linked_user_id_fkey foreign KEY (linked_user_id) references users (id) on delete set null,
  constraint contacts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint contacts_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint contacts_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint contacts_company_id_fkey foreign KEY (company_id) references contacts (id) on delete set null,
  constraint contacts_contact_type_check check (
    (
      contact_type = any (array['person'::text, 'company'::text])
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_contacts_org_linked_user on public.contacts using btree (organization_id, linked_user_id) TABLESPACE pg_default
where
  (linked_user_id is not null);

create unique INDEX IF not exists idx_contacts_org_email on public.contacts using btree (organization_id, email) TABLESPACE pg_default
where
  (email is not null);

create index IF not exists idx_contacts_is_deleted_org on public.contacts using btree (organization_id, is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_contacts_import_batch_id on public.contacts using btree (import_batch_id) TABLESPACE pg_default;

create index IF not exists idx_contacts_company_id on public.contacts using btree (company_id) TABLESPACE pg_default
where
  (company_id is not null);

create trigger on_contact_audit
after INSERT
or DELETE
or
update on contacts for EACH row
execute FUNCTION log_contact_activity ();

create trigger on_contact_link_user BEFORE INSERT
or
update OF email on contacts for EACH row
execute FUNCTION handle_contact_link_user ();

create trigger set_updated_by_contacts BEFORE INSERT
or
update on contacts for EACH row
execute FUNCTION handle_updated_by ();

# Vista CONTACTS_SUMMARY_VIEW:

create view public.contacts_summary_view as
select
  c.organization_id,
  count(*) as total_contacts,
  count(c.linked_user_id) as linked_contacts,
  count(
    case
      when (
        exists (
          select
            1
          from
            organization_members om
          where
            om.user_id = c.linked_user_id
            and om.organization_id = c.organization_id
        )
      ) then 1
      else null::integer
    end
  ) as member_contacts
from
  contacts c
where
  c.is_deleted = false
group by
  c.organization_id;

# Vista CONTACTS_VIEW:

create view public.contacts_view as
select
  c.id,
  c.organization_id,
  c.contact_type,
  c.first_name,
  c.last_name,
  c.full_name,
  c.email,
  c.phone,
  c.company_name,
  c.company_id,
  c.location,
  c.notes,
  c.national_id,
  c.image_url,
  c.avatar_updated_at,
  c.is_local,
  c.display_name_override,
  c.linked_user_id,
  c.linked_at,
  c.sync_status,
  c.created_at,
  c.updated_at,
  c.is_deleted,
  c.deleted_at,
  u.avatar_url as linked_user_avatar_url,
  u.full_name as linked_user_full_name,
  u.email as linked_user_email,
  COALESCE(u.avatar_url, c.image_url) as resolved_avatar_url,
  company.full_name as linked_company_name,
  COALESCE(company.full_name, c.company_name) as resolved_company_name,
  COALESCE(
    (
      select
        json_agg(json_build_object('id', cc.id, 'name', cc.name)) as json_agg
      from
        contact_category_links ccl
        join contact_categories cc on cc.id = ccl.contact_category_id
      where
        ccl.contact_id = c.id
        and cc.is_deleted = false
    ),
    '[]'::json
  ) as contact_categories,
  (
    exists (
      select
        1
      from
        organization_members om
      where
        om.user_id = c.linked_user_id
        and om.organization_id = c.organization_id
    )
  ) as is_organization_member
from
  contacts c
  left join users u on u.id = c.linked_user_id
  left join contacts company on company.id = c.company_id
  and company.is_deleted = false
where
  c.is_deleted = false;

## Tabla USERS:

create view public.contacts_view as
select
  c.id,
  c.organization_id,
  c.contact_type,
  c.first_name,
  c.last_name,
  c.full_name,
  c.email,
  c.phone,
  c.company_name,
  c.company_id,
  c.location,
  c.notes,
  c.national_id,
  c.image_url,
  c.avatar_updated_at,
  c.is_local,
  c.display_name_override,
  c.linked_user_id,
  c.linked_at,
  c.sync_status,
  c.created_at,
  c.updated_at,
  c.is_deleted,
  c.deleted_at,
  u.avatar_url as linked_user_avatar_url,
  u.full_name as linked_user_full_name,
  u.email as linked_user_email,
  COALESCE(u.avatar_url, c.image_url) as resolved_avatar_url,
  company.full_name as linked_company_name,
  COALESCE(company.full_name, c.company_name) as resolved_company_name,
  COALESCE(
    (
      select
        json_agg(json_build_object('id', cc.id, 'name', cc.name)) as json_agg
      from
        contact_category_links ccl
        join contact_categories cc on cc.id = ccl.contact_category_id
      where
        ccl.contact_id = c.id
        and cc.is_deleted = false
    ),
    '[]'::json
  ) as contact_categories,
  (
    exists (
      select
        1
      from
        organization_members om
      where
        om.user_id = c.linked_user_id
        and om.organization_id = c.organization_id
    )
  ) as is_organization_member
from
  contacts c
  left join users u on u.id = c.linked_user_id
  left join contacts company on company.id = c.company_id
  and company.is_deleted = false
where
  c.is_deleted = false;