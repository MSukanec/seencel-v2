# Tablas y vistas en DB para el modulo TASKS o similares:

NO MODIFICAR NUNCA; solo lo modifico yo! Si te pido modificarla solo MODIFICA LAS TABLAS PARA QUE SE ACTUALICEN A LO UTLIMO QUE HICIMOS; pero ni suplantes informacion ni nada raro. Preguntame cuaquier cosa.

# Tabla TASK_DIVISIONS:

create table public.task_divisions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  description text null,
  organization_id uuid null,
  is_system boolean null default false,
  "order" integer null,
  code text null,
  parent_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint task_rubros_pkey primary key (id),
  constraint task_divisions_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint task_divisions_parent_id_fkey foreign KEY (parent_id) references task_divisions (id) on delete set null,
  constraint task_divisions_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint task_rubros_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_task_divisions_not_deleted on public.task_divisions using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_divisions_org_active on public.task_divisions using btree (organization_id, is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_divisions_created_by on public.task_divisions using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_task_divisions_updated_by on public.task_divisions using btree (updated_by) TABLESPACE pg_default;

create trigger on_task_division_audit
after INSERT
or DELETE
or
update on task_divisions for EACH row
execute FUNCTION log_task_division_activity ();

create trigger set_updated_by_task_divisions BEFORE INSERT
or
update on task_divisions for EACH row
execute FUNCTION handle_updated_by ();

create trigger task_divisions_set_updated_at BEFORE
update on task_divisions for EACH row
execute FUNCTION set_timestamp ();

create trigger trg_task_divisions_org_immutable BEFORE
update on task_divisions for EACH row
execute FUNCTION prevent_column_change ('organization_id');

## Tabla: TASKS:

create table public.tasks (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  code text null,
  unit_id uuid not null,
  organization_id uuid null,
  is_system boolean null default true,
  custom_name text null,
  task_division_id uuid null,
  description text null,
  name text null,
  is_published boolean null default false,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint task_parametric_pkey primary key (id),
  constraint tasks_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint tasks_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint task_parametric_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint tasks_task_division_id_fkey foreign KEY (task_division_id) references task_divisions (id) on delete set null,
  constraint tasks_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint tasks_system_org_consistency_chk check (
    (
      (
        (is_system = true)
        and (organization_id is null)
      )
      or (
        (is_system = false)
        and (organization_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists tasks_custom_name_system_uniq on public.tasks using btree (lower(custom_name)) TABLESPACE pg_default
where
  (
    (organization_id is null)
    and (custom_name is not null)
  );

create index IF not exists tasks_org_idx on public.tasks using btree (organization_id) TABLESPACE pg_default;

create index IF not exists tasks_division_idx on public.tasks using btree (task_division_id) TABLESPACE pg_default;

create index IF not exists tasks_unit_idx on public.tasks using btree (unit_id) TABLESPACE pg_default;

create unique INDEX IF not exists tasks_custom_name_org_uniq on public.tasks using btree (organization_id, lower(custom_name)) TABLESPACE pg_default
where
  (
    (organization_id is not null)
    and (custom_name is not null)
  );

create unique INDEX IF not exists tasks_code_lower_uniq on public.tasks using btree (lower(code)) TABLESPACE pg_default
where
  (code is not null);

create index IF not exists tasks_active_idx on public.tasks using btree (organization_id, is_deleted, is_published) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_task_audit
after INSERT
or DELETE
or
update on tasks for EACH row
execute FUNCTION log_task_activity ();

create trigger set_updated_by_tasks BEFORE INSERT
or
update on tasks for EACH row
execute FUNCTION handle_updated_by ();

# Vista TASKS_VIEW:

create view public.tasks_view as
select
  t.id,
  t.code,
  t.name,
  t.custom_name,
  t.description,
  t.is_system,
  t.is_published,
  t.is_deleted,
  t.organization_id,
  t.unit_id,
  t.task_division_id,
  t.created_at,
  t.updated_at,
  t.created_by,
  t.updated_by,
  u.name as unit_name,
  d.name as division_name
from
  tasks t
  left join units u on u.id = t.unit_id
  left join task_divisions d on d.id = t.task_division_id;

# Tabla QUOTES:

create table public.quotes (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  project_id uuid null,
  organization_id uuid not null,
  status text not null default 'draft'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  version integer not null default 1,
  currency_id uuid not null,
  exchange_rate numeric(18, 6) null,
  tax_pct numeric(6, 2) not null default 0,
  tax_label text null default 'VAT'::text,
  discount_pct numeric(6, 2) not null default 0,
  client_id uuid null,
  quote_type text not null default 'quote'::text,
  valid_until date null,
  approved_at timestamp with time zone null,
  approved_by uuid null,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  quote_date date null default CURRENT_DATE,
  constraint quotes_pkey primary key (id),
  constraint ux_quotes_project_name_version unique (project_id, name, version),
  constraint quotes_approved_by_fkey foreign KEY (approved_by) references organization_members (id) on delete set null,
  constraint quotes_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint quotes_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint quotes_client_id_fkey foreign KEY (client_id) references contacts (id) on delete set null,
  constraint quotes_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint quotes_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint quotes_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint quotes_type_check check (
    (
      quote_type = any (
        array[
          'quote'::text,
          'contract'::text,
          'change_order'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quotes_org on public.quotes using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_project on public.quotes using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_status on public.quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quotes_created on public.quotes using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_quotes_client on public.quotes using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_type on public.quotes using btree (quote_type) TABLESPACE pg_default;

create index IF not exists idx_quotes_updated_by on public.quotes using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_quotes_not_deleted on public.quotes using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_quotes_org_active on public.quotes using btree (organization_id, is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_quote_audit
after INSERT
or DELETE
or
update on quotes for EACH row
execute FUNCTION log_quote_activity ();

create trigger quotes_set_updated_at BEFORE
update on quotes for EACH row
execute FUNCTION set_timestamp ();

create trigger set_updated_by_quotes BEFORE INSERT
or
update on quotes for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_quotes_org_immutable BEFORE
update on quotes for EACH row
execute FUNCTION prevent_column_change ('organization_id');

# Vista QUOTES_VIEW:

create view public.quotes_view as
select
  q.id,
  q.organization_id,
  q.project_id,
  q.client_id,
  q.name,
  q.description,
  q.status,
  q.quote_type,
  q.version,
  q.currency_id,
  q.exchange_rate,
  q.tax_pct,
  q.tax_label,
  q.discount_pct,
  q.quote_date,
  q.valid_until,
  q.approved_at,
  q.approved_by,
  q.created_at,
  q.updated_at,
  q.created_by,
  q.is_deleted,
  q.deleted_at,
  c.name as currency_name,
  c.symbol as currency_symbol,
  p.name as project_name,
  COALESCE(
    (ct.first_name || ' '::text) || ct.last_name,
    ct.first_name,
    ct.last_name
  ) as client_name,
  COALESCE(items.item_count, 0::bigint) as item_count,
  COALESCE(items.subtotal, 0::numeric) as subtotal,
  COALESCE(items.subtotal_with_markup, 0::numeric) as subtotal_with_markup,
  COALESCE(items.subtotal_with_markup, 0::numeric) * (1::numeric - q.discount_pct / 100::numeric) as total_after_discount,
  COALESCE(items.subtotal_with_markup, 0::numeric) * (1::numeric - q.discount_pct / 100::numeric) * (1::numeric + q.tax_pct / 100::numeric) as total_with_tax
from
  quotes q
  left join currencies c on c.id = q.currency_id
  left join projects p on p.id = q.project_id
  left join contacts ct on ct.id = q.client_id
  left join lateral (
    select
      count(*) as item_count,
      sum(qi.quantity * qi.unit_price) as subtotal,
      sum(
        qi.quantity * qi.unit_price * (1::numeric + qi.markup_pct / 100::numeric)
      ) as subtotal_with_markup
    from
      quote_items qi
    where
      qi.quote_id = q.id
  ) items on true
where
  q.is_deleted = false;