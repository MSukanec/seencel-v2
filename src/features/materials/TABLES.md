# Tablas y vistas en DB para MATERIALES:

# Tabla MATERIAL_PAYMENTS:

create table public.material_payments (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  organization_id uuid not null,
  amount numeric(12, 2) not null,
  currency_id uuid not null,
  exchange_rate numeric(18, 6) null,
  payment_date date not null default now(),
  notes text null,
  reference text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  wallet_id uuid not null,
  status text not null default 'confirmed'::text,
  created_by uuid null,
  purchase_id uuid null,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  updated_by uuid null,
  material_type_id uuid null,
  import_batch_id uuid null,
  constraint material_payments_pkey primary key (id),
  constraint material_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint material_payments_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint material_payments_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint material_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint material_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint material_payments_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint fk_material_payments_type foreign KEY (material_type_id) references material_types (id) on delete set null,
  constraint material_payments_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint material_payments_purchase_fkey foreign KEY (purchase_id) references material_invoices (id) on delete set null,
  constraint material_payments_amount_positive check ((amount > (0)::numeric)),
  constraint material_payments_status_check check (
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
  )
) TABLESPACE pg_default;

create index IF not exists idx_material_payments_not_deleted on public.material_payments using btree (organization_id, project_id) TABLESPACE pg_default
where
  (
    (is_deleted is null)
    or (is_deleted = false)
  );

create index IF not exists material_payments_organization_id_project_id_idx on public.material_payments using btree (organization_id, project_id) TABLESPACE pg_default;

create index IF not exists material_payments_payment_date_idx on public.material_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists material_payments_project_id_payment_date_idx on public.material_payments using btree (project_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists material_payments_organization_id_payment_date_idx on public.material_payments using btree (organization_id, payment_date desc) TABLESPACE pg_default;

create index IF not exists idx_material_payments_type on public.material_payments using btree (material_type_id) TABLESPACE pg_default;

create index IF not exists idx_material_payments_import_batch on public.material_payments using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

create index IF not exists idx_material_payments_material_type on public.material_payments using btree (material_type_id) TABLESPACE pg_default
where
  (material_type_id is not null);

create trigger on_material_payment_audit
after INSERT
or DELETE
or
update on material_payments for EACH row
execute FUNCTION log_material_payment_activity ();

create trigger set_audit_material_payments BEFORE INSERT
or
update on material_payments for EACH row
execute FUNCTION handle_updated_by ();

create trigger set_material_payments_updated_at BEFORE
update on material_payments for EACH row
execute FUNCTION set_timestamp ();

# Vista MATERIAL_PAYMENTS_VIEW:

create view public.material_payments_view as
select
  mp.id,
  mp.organization_id,
  mp.project_id,
  mp.payment_date,
  date_trunc(
    'month'::text,
    mp.payment_date::timestamp with time zone
  ) as payment_month,
  mp.amount,
  mp.currency_id,
  cur.code as currency_code,
  cur.symbol as currency_symbol,
  COALESCE(mp.exchange_rate, 1::numeric) as exchange_rate,
  mp.status,
  mp.wallet_id,
  w.name as wallet_name,
  mp.notes,
  mp.reference,
  mp.purchase_id,
  mi.invoice_number,
  mi.provider_id,
  COALESCE(
    prov.company_name,
    (prov.first_name || ' '::text) || prov.last_name
  ) as provider_name,
  p.name as project_name,
  mp.created_by,
  u.full_name as creator_full_name,
  u.avatar_url as creator_avatar_url,
  mp.created_at,
  mp.updated_at,
  (
    exists (
      select
        1
      from
        media_links ml
      where
        ml.material_payment_id = mp.id
    )
  ) as has_attachments
from
  material_payments mp
  left join material_invoices mi on mi.id = mp.purchase_id
  left join contacts prov on prov.id = mi.provider_id
  left join projects p on p.id = mp.project_id
  left join organization_members om on om.id = mp.created_by
  left join users u on u.id = om.user_id
  left join wallets w on w.id = mp.wallet_id
  left join currencies cur on cur.id = mp.currency_id
where
  mp.is_deleted = false
  or mp.is_deleted is null;

# Tabla MATERIAL_PRICES:

create table public.material_prices (
  id uuid not null default gen_random_uuid (),
  material_id uuid not null,
  organization_id uuid not null,
  currency_id uuid not null,
  unit_price numeric(12, 2) not null,
  valid_from date not null default CURRENT_DATE,
  valid_to date null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_by uuid null,
  constraint material_prices_pkey primary key (id),
  constraint material_prices_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint material_prices_material_id_fkey foreign KEY (material_id) references materials (id) on delete CASCADE,
  constraint material_prices_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint material_prices_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint material_prices_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint material_prices_unit_price_check check ((unit_price >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists material_prices_material_org_idx on public.material_prices using btree (material_id, organization_id) TABLESPACE pg_default;

# Tabla MATERIAL_TYPES:

create table public.material_types (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  is_system boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  constraint material_types_pkey primary key (id),
  constraint fk_material_types_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint material_types_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint material_types_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint material_types_system_org_check check (
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

create unique INDEX IF not exists uq_material_types_system_name on public.material_types using btree (lower(name)) TABLESPACE pg_default
where
  (
    (is_system = true)
    and (is_deleted = false)
  );

create unique INDEX IF not exists uq_material_types_org_name on public.material_types using btree (organization_id, lower(name)) TABLESPACE pg_default
where
  (
    (is_system = false)
    and (is_deleted = false)
  );

create index IF not exists idx_material_types_list on public.material_types using btree (is_system, organization_id, is_deleted, name) TABLESPACE pg_default;

create trigger set_updated_by_material_types BEFORE
update on material_types for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_set_updated_at_material_types BEFORE
update on material_types for EACH row
execute FUNCTION set_updated_at ();

# Tabla MATERIALS:

create table public.materials (
  name text null,
  created_at timestamp with time zone null default now(),
  id uuid not null default gen_random_uuid (),
  unit_id uuid null,
  category_id uuid null,
  updated_at timestamp with time zone null default now(),
  is_system boolean null default false,
  organization_id uuid null,
  default_sale_unit_id uuid null,
  is_completed boolean null default false,
  material_type text null default 'material'::text,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  code text null,
  description text null,
  default_provider_id uuid null,
  import_batch_id uuid null,
  default_sale_unit_quantity numeric(12, 4) null,
  constraint materials_pkey primary key (id),
  constraint materials_id_key unique (id),
  constraint materials_default_provider_id_fkey foreign KEY (default_provider_id) references contacts (id) on delete set null,
  constraint materials_default_sale_unit_id_fkey foreign KEY (default_sale_unit_id) references units (id) on delete set null,
  constraint materials_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint materials_category_id_fkey foreign KEY (category_id) references material_categories (id) on delete set null,
  constraint materials_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint materials_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint materials_unit_id_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint materials_material_type_check check (
    (
      material_type = any (array['material'::text, 'consumable'::text])
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists materials_name_org_unique on public.materials using btree (name, organization_id) TABLESPACE pg_default
where
  (
    (organization_id is not null)
    and (is_deleted = false)
  );

create unique INDEX IF not exists materials_name_system_unique on public.materials using btree (name) TABLESPACE pg_default
where
  (
    (organization_id is null)
    and (is_system = true)
    and (is_deleted = false)
  );

create index IF not exists idx_materials_is_deleted on public.materials using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_materials_org_deleted on public.materials using btree (organization_id, is_deleted) TABLESPACE pg_default;

create index IF not exists idx_materials_code_org on public.materials using btree (code, organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_materials_default_provider on public.materials using btree (default_provider_id) TABLESPACE pg_default
where
  (default_provider_id is not null);

create index IF not exists idx_materials_import_batch on public.materials using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

create trigger on_material_audit
after INSERT
or DELETE
or
update on materials for EACH row
execute FUNCTION log_material_activity ();

create trigger set_updated_at_materials BEFORE
update on materials for EACH row
execute FUNCTION update_updated_at_column ();

create trigger set_updated_by_materials BEFORE INSERT
or
update on materials for EACH row
execute FUNCTION handle_updated_by ();








# Tabla UNIT_CATEGORIES:

create table public.unit_categories (
  id uuid not null default gen_random_uuid (),
  code text not null,
  name text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unit_categories_pkey primary key (id),
  constraint unit_categories_code_unique unique (code),
  constraint unit_categories_code_not_blank check ((btrim(code) <> ''::text))
) TABLESPACE pg_default;

create index IF not exists idx_unit_categories_name on public.unit_categories using btree (name) TABLESPACE pg_default;

create trigger trg_set_updated_at_unit_categories BEFORE
update on unit_categories for EACH row
execute FUNCTION set_updated_at ();

# Tabla UNITS:

create table public.units (
  name text not null,
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  symbol text null,
  applicable_to text[] not null default array['task'::text, 'material'::text, 'labor'::text],
  organization_id uuid null,
  unit_category_id uuid null,
  is_system boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint units_pkey primary key (id),
  constraint units_id_key1 unique (id),
  constraint units_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint units_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint units_unit_category_id_fkey foreign KEY (unit_category_id) references unit_categories (id) on delete set null,
  constraint units_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint units_name_not_blank_chk check ((btrim(name) <> ''::text)),
  constraint units_system_org_check check (
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

create index IF not exists idx_units_organization on public.units using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_units_category on public.units using btree (unit_category_id) TABLESPACE pg_default;

create unique INDEX IF not exists uq_units_system_name on public.units using btree (lower(name)) TABLESPACE pg_default
where
  (
    (is_system = true)
    and (is_deleted = false)
  );

create unique INDEX IF not exists uq_units_org_name on public.units using btree (organization_id, lower(name)) TABLESPACE pg_default
where
  (
    (is_system = false)
    and (is_deleted = false)
  );

create index IF not exists idx_units_list on public.units using btree (is_system, organization_id, is_deleted, name) TABLESPACE pg_default;

create trigger on_unit_audit
after INSERT
or DELETE
or
update on units for EACH row
execute FUNCTION log_unit_activity ();

create trigger set_updated_by_units BEFORE INSERT
or
update on units for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_set_updated_at_units BEFORE
update on units for EACH row
execute FUNCTION set_updated_at ();

# Vista MATERIALS_VIEW:

create view public.materials_view as
select
  m.id,
  m.name,
  m.code,
  m.description,
  m.material_type,
  m.is_system,
  m.organization_id,
  m.is_deleted,
  m.created_at,
  m.updated_at,
  m.unit_id,
  u.name as unit_of_computation,
  u.symbol as unit_symbol,
  m.category_id,
  mc.name as category_name,
  m.default_provider_id,
  m.default_sale_unit_id,
  m.default_sale_unit_quantity,
  su.name as sale_unit_name,
  su.symbol as sale_unit_symbol,
  mp.unit_price as org_unit_price,
  mp.currency_id as org_price_currency_id,
  mp.valid_from as org_price_valid_from
from
  materials m
  left join units u on m.unit_id = u.id
  left join material_categories mc on m.category_id = mc.id
  left join units su on m.default_sale_unit_id = su.id
  left join lateral (
    select
      mp_inner.unit_price,
      mp_inner.currency_id,
      mp_inner.valid_from
    from
      material_prices mp_inner
    where
      mp_inner.material_id = m.id
      and mp_inner.organization_id = m.organization_id
      and mp_inner.valid_from <= CURRENT_DATE
      and (
        mp_inner.valid_to is null
        or mp_inner.valid_to >= CURRENT_DATE
      )
    order by
      mp_inner.valid_from desc
    limit
      1
  ) mp on true
where
  m.is_deleted = false;