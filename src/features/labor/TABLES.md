# Tablas de BD para LABOR (Mano de Obra)

# Tabla LABOR_CATEGORIES:

create table public.labor_categories (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  unit_id uuid null,
  is_system boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint labor_categories_pkey primary key (id),
  constraint labor_categories_name_key unique (name),
  constraint labor_categories_id_key unique (id),
  constraint labor_categories_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint labor_categories_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint labor_categories_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint labor_categories_unit_id_fkey foreign KEY (unit_id) references units (id)
) TABLESPACE pg_default;

create trigger on_labor_category_audit
after INSERT
or DELETE
or
update on labor_categories for EACH row
execute FUNCTION log_labor_category_activity ();

create trigger set_updated_by_labor_categories BEFORE INSERT
or
update on labor_categories for EACH row
execute FUNCTION handle_updated_by ();

# Tabla LABOR_PAYMENTS:

create table public.labor_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  labor_id uuid null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric not null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  wallet_id uuid null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  updated_by uuid null,
  import_batch_id uuid null,
  constraint labor_payments_pkey primary key (id),
  constraint labor_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint labor_payments_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint labor_payments_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint labor_payments_labor_id_fkey foreign KEY (labor_id) references project_labor (id) on delete set null,
  constraint labor_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint labor_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete set null,
  constraint labor_payments_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint labor_payments_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint labor_payments_status_check check (
    (
      status = any (
        array[
          'confirmed'::text,
          'pending'::text,
          'rejected'::text,
          'void'::text
        ]
      )
    )
  ),
  constraint labor_payments_exchange_rate_positive check ((exchange_rate > (0)::numeric)),
  constraint labor_payments_amount_positive check ((amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_date on public.labor_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_view_project on public.labor_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_view_org on public.labor_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_not_deleted on public.labor_payments using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

create index IF not exists idx_labor_payments_org_project on public.labor_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_labor on public.labor_payments using btree (labor_id) TABLESPACE pg_default;

create index IF not exists idx_labor_payments_import_batch_id on public.labor_payments using btree (import_batch_id) TABLESPACE pg_default;

create trigger on_labor_payment_audit
after INSERT
or DELETE
or
update on labor_payments for EACH row
execute FUNCTION log_labor_payment_activity ();

create trigger set_labor_payments_updated_at BEFORE
update on labor_payments for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_labor_payments BEFORE INSERT
or
update on labor_payments for EACH row
execute FUNCTION handle_updated_by ();

# Vista LABOR_PAYMENTS_VIEW:

create view public.labor_payments_view as
select
  lp.id,
  lp.organization_id,
  lp.project_id,
  lp.labor_id,
  lp.payment_date,
  date_trunc(
    'month'::text,
    lp.payment_date::timestamp with time zone
  ) as payment_month,
  lp.amount,
  lp.currency_id,
  lp.exchange_rate,
  lp.status,
  lp.wallet_id,
  lp.notes,
  lp.reference,
  lp.created_at,
  lp.updated_at,
  lp.created_by,
  lp.updated_by,
  lp.is_deleted,
  lp.deleted_at,
  lp.import_batch_id,
  lp.amount * lp.exchange_rate as functional_amount,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  cur.name as currency_name,
  ow.id as org_wallet_id,
  w.name as wallet_name,
  pl.contact_id,
  pl.labor_type_id,
  pl.status as labor_status,
  ct.first_name as contact_first_name,
  ct.last_name as contact_last_name,
  COALESCE(
    ct.display_name_override,
    ct.full_name,
    concat(ct.first_name, ' ', ct.last_name)
  ) as contact_display_name,
  ct.national_id as contact_national_id,
  ct.phone as contact_phone,
  ct.email as contact_email,
  ct.image_url as contact_image_url,
  lt.name as labor_type_name,
  proj.name as project_name,
  om_created.id as creator_member_id,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url
from
  labor_payments lp
  left join currencies cur on cur.id = lp.currency_id
  left join organization_wallets ow on ow.id = lp.wallet_id
  left join wallets w on w.id = ow.wallet_id
  left join project_labor pl on pl.id = lp.labor_id
  left join contacts ct on ct.id = pl.contact_id
  left join labor_types lt on lt.id = pl.labor_type_id
  left join projects proj on proj.id = lp.project_id
  left join organization_members om_created on om_created.id = lp.created_by
  left join users u_created on u_created.id = om_created.user_id
where
  lp.is_deleted = false
  or lp.is_deleted is null;

# Tabla PROJECT_LABOR:

create table public.project_labor (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  contact_id uuid not null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  organization_id uuid null,
  labor_type_id uuid null,
  start_date date null,
  end_date date null,
  status text not null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_by uuid null,
  constraint project_labor_pkey primary key (id),
  constraint project_labor_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint project_labor_labor_type_id_fkey foreign KEY (labor_type_id) references labor_types (id) on delete set null,
  constraint project_labor_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint project_labor_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_labor_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint project_labor_contact_id_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint project_labor_status_check check (
    (
      status = any (
        array['active'::text, 'absent'::text, 'inactive'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_project_labor_project_id on public.project_labor using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_labor_contact_id on public.project_labor using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_project_labor_organization_id on public.project_labor using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_project_labor_labor_type_id on public.project_labor using btree (labor_type_id) TABLESPACE pg_default;

create index IF not exists idx_project_labor_status on public.project_labor using btree (status) TABLESPACE pg_default;

create index IF not exists idx_project_labor_is_deleted on public.project_labor using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_project_labor_audit
after INSERT
or DELETE
or
update on project_labor for EACH row
execute FUNCTION log_project_labor_activity ();

create trigger set_project_labor_updated_at BEFORE
update on project_labor for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_project_labor BEFORE INSERT
or
update on project_labor for EACH row
execute FUNCTION handle_updated_by ();

# Tabla PROJECT_LABOR_VIEW:

create view public.project_labor_view as
select
  pl.id,
  pl.project_id,
  pl.organization_id,
  pl.contact_id,
  pl.labor_type_id,
  pl.status,
  pl.notes,
  pl.start_date,
  pl.end_date,
  pl.created_at,
  pl.updated_at,
  pl.created_by,
  pl.updated_by,
  pl.is_deleted,
  pl.deleted_at,
  ct.first_name as contact_first_name,
  ct.last_name as contact_last_name,
  ct.full_name as contact_full_name,
  COALESCE(
    ct.display_name_override,
    ct.full_name,
    concat(ct.first_name, ' ', ct.last_name)
  ) as contact_display_name,
  ct.national_id as contact_national_id,
  ct.phone as contact_phone,
  ct.email as contact_email,
  ct.image_url as contact_image_url,
  lt.name as labor_type_name,
  lt.description as labor_type_description,
  proj.name as project_name,
  om_created.id as creator_member_id,
  u_created.full_name as creator_name,
  u_created.avatar_url as creator_avatar_url,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.contact_id = ct.id
    )
  ) as contact_has_attachments,
  COALESCE(payment_stats.total_payments, 0) as total_payments_count,
  COALESCE(payment_stats.total_amount, 0::numeric) as total_amount_paid
from
  project_labor pl
  left join contacts ct on ct.id = pl.contact_id
  left join labor_types lt on lt.id = pl.labor_type_id
  left join projects proj on proj.id = pl.project_id
  left join organization_members om_created on om_created.id = pl.created_by
  left join users u_created on u_created.id = om_created.user_id
  left join lateral (
    select
      count(*)::integer as total_payments,
      sum(lp.amount) as total_amount
    from
      labor_payments lp
    where
      lp.labor_id = pl.id
      and (
        lp.is_deleted = false
        or lp.is_deleted is null
      )
      and lp.status = 'confirmed'::text
  ) payment_stats on true
where
  pl.is_deleted = false;