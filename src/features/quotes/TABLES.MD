# Tablas en DB para el feature QUOTES (NO TOCAR, SOLO YO MODIFICO):

# Tabla QUOTE_ITEMS:

create table public.quote_items (
  quote_id uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  id uuid not null default gen_random_uuid (),
  task_id uuid null,
  organization_id uuid not null,
  project_id uuid not null,
  description text null,
  quantity numeric(14, 3) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  currency_id uuid not null,
  markup_pct numeric(6, 2) not null default 0,
  tax_pct numeric(6, 2) not null default 0,
  created_by uuid null,
  cost_scope public.cost_scope_enum not null default 'materials_and_labor'::cost_scope_enum,
  sort_key numeric(18, 6) not null default 0,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint quote_items_pkey primary key (id),
  constraint quote_items_id_key unique (id),
  constraint quote_items_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint quote_items_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint quote_items_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_items_task_id_fkey foreign KEY (task_id) references tasks (id) on delete set null,
  constraint quote_items_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint quote_items_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint quote_items_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_quote_items_sort on public.quote_items using btree (quote_id, sort_key) TABLESPACE pg_default;

create index IF not exists idx_quote_items_updated_by on public.quote_items using btree (updated_by) TABLESPACE pg_default;

create index IF not exists idx_quote_items_not_deleted on public.quote_items using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_quote_item_audit
after INSERT
or DELETE
or
update on quote_items for EACH row
execute FUNCTION log_quote_item_activity ();

create trigger quote_items_set_updated_at BEFORE
update on quote_items for EACH row
execute FUNCTION set_timestamp ();

create trigger set_updated_by_quote_items BEFORE INSERT
or
update on quote_items for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_quote_item_default_sort BEFORE INSERT on quote_items for EACH row
execute FUNCTION quote_item_set_default_sort_key ();

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
  tax_label text null default '''IVA''::text'::text,
  discount_pct numeric(6, 2) not null default 0,
  client_id uuid null,
  quote_type text not null default 'quote'::text,
  valid_until date null,
  approved_at timestamp with time zone null,
  approved_by uuid null,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  quote_date date null,
  parent_quote_id uuid null,
  original_contract_value numeric(15, 2) null,
  change_order_number integer null,
  constraint quotes_pkey primary key (id),
  constraint ux_quotes_project_name_version unique (project_id, name, version),
  constraint quotes_client_id_fkey foreign KEY (client_id) references contacts (id) on delete set null,
  constraint quotes_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint quotes_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint quotes_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint quotes_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint quotes_parent_quote_id_fkey foreign KEY (parent_quote_id) references quotes (id) on delete CASCADE,
  constraint quotes_approved_by_fkey foreign KEY (approved_by) references organization_members (id) on delete set null,
  constraint quotes_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint chk_parent_only_for_change_order check (
    (
      (parent_quote_id is null)
      or (quote_type = 'change_order'::text)
    )
  ),
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

create index IF not exists idx_quotes_parent_quote on public.quotes using btree (parent_quote_id) TABLESPACE pg_default
where
  (parent_quote_id is not null);

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

create trigger trg_notify_quote_status_change
after
update on quotes for EACH row
execute FUNCTION trigger_notify_quote_status_change ();

create trigger trg_quotes_org_immutable BEFORE
update on quotes for EACH row
execute FUNCTION prevent_column_change ('organization_id');