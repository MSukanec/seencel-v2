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
  functional_amount numeric(20, 2) null,
  constraint material_payments_pkey primary key (id),
  constraint material_payments_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint material_payments_currency_id_fkey foreign KEY (currency_id) references currencies (id) on delete RESTRICT,
  constraint material_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint material_payments_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint material_payments_purchase_fkey foreign KEY (purchase_id) references material_purchases (id) on delete set null,
  constraint material_payments_wallet_id_fkey foreign KEY (wallet_id) references organization_wallets (id) on delete RESTRICT,
  constraint material_payments_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
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

create trigger set_functional_amount_material_payments BEFORE INSERT
or
update on material_payments for EACH row
execute FUNCTION set_material_payment_functional_amount ();

create trigger set_material_payments_updated_at BEFORE
update on material_payments for EACH row
execute FUNCTION set_timestamp ();

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
  default_unit_presentation_id uuid null,
  is_completed boolean null default false,
  material_type text null default 'material'::text,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  constraint materials_pkey primary key (id),
  constraint materials_id_key unique (id),
  constraint materials_default_unit_presentation_id_fkey foreign KEY (default_unit_presentation_id) references unit_presentations (id) on delete set null,
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

# Tabla CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS:
# Snapshot de materiales congelado al crear construction_task.
# Cambios en task_materials NO afectan esta tabla.

create table public.construction_task_material_snapshots (
    id uuid not null default gen_random_uuid(),
    construction_task_id uuid not null,
    material_id uuid not null,
    quantity_planned numeric(20, 4) not null,
    amount_per_unit numeric(20, 4) not null,
    unit_id uuid null,
    source_task_id uuid null,
    snapshot_at timestamp with time zone not null default now(),
    organization_id uuid not null,
    project_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint construction_task_material_snapshots_pkey primary key (id),
    constraint ctms_construction_task_fkey foreign key (construction_task_id) 
        references construction_tasks(id) on delete cascade,
    constraint ctms_material_fkey foreign key (material_id) 
        references materials(id) on delete restrict,
    constraint ctms_unit_fkey foreign key (unit_id) 
        references units(id) on delete set null,
    constraint ctms_organization_fkey foreign key (organization_id) 
        references organizations(id) on delete cascade,
    constraint ctms_project_fkey foreign key (project_id) 
        references projects(id) on delete cascade,
    constraint ctms_unique_material unique (construction_task_id, material_id)
) tablespace pg_default;

create index idx_ctms_construction_task on construction_task_material_snapshots(construction_task_id);
create index idx_ctms_project on construction_task_material_snapshots(project_id);
create index idx_ctms_material on construction_task_material_snapshots(material_id);
create index idx_ctms_organization on construction_task_material_snapshots(organization_id);

# Triggers asociados:
# - trg_construction_task_material_snapshot: Auto-crea snapshot al INSERT en construction_tasks
# - trg_prevent_task_id_change: Bloquea cambios en task_id para preservar integridad

# Vista PROJECT_MATERIAL_REQUIREMENTS_VIEW:
# Lee desde snapshots, NO desde recetas vivas (task_materials)

create view public.project_material_requirements_view as
select
    ctms.project_id,
    ctms.organization_id,
    ctms.material_id,
    m.name as material_name,
    u.name as unit_name,
    m.category_id,
    mc.name as category_name,
    sum(ctms.quantity_planned)::numeric(20, 4) as total_required,
    count(distinct ctms.construction_task_id) as task_count,
    array_agg(distinct ctms.construction_task_id) as construction_task_ids
from construction_task_material_snapshots ctms
inner join construction_tasks ct on ct.id = ctms.construction_task_id
inner join materials m on m.id = ctms.material_id
left join units u on u.id = m.unit_id
left join material_categories mc on mc.id = m.category_id
where ct.is_deleted = false
  and ct.status in ('pending', 'in_progress', 'paused')
group by
    ctms.project_id,
    ctms.organization_id,
    ctms.material_id,
    m.name,
    u.name,
    m.category_id,
    mc.name;

# ============================================
# SISTEMA DE COMPRAS (POs + Invoices)
# ============================================

# Tabla MATERIAL_PURCHASE_ORDERS:
# Órdenes de compra (lo que PIDO al proveedor)

create table public.material_purchase_orders (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  order_number text null,
  order_date date not null default now(),
  expected_delivery_date date null,
  status text not null default 'draft'::text,
  notes text null,
  currency_id uuid null,
  subtotal numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  requested_by uuid null,
  approved_by uuid null,
  provider_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_purchase_orders_pkey primary key (id),
  constraint mpo_org_fkey foreign key (organization_id) references organizations(id) on delete cascade,
  constraint mpo_project_fkey foreign key (project_id) references projects(id) on delete cascade,
  constraint mpo_currency_fkey foreign key (currency_id) references currencies(id) on delete restrict,
  constraint mpo_provider_fkey foreign key (provider_id) references contacts(id) on delete set null,
  constraint mpo_requested_by_fkey foreign key (requested_by) references organization_members(id) on delete set null,
  constraint mpo_approved_by_fkey foreign key (approved_by) references organization_members(id) on delete set null,
  constraint mpo_status_check check (
    status = any (array[
      'draft'::text,
      'sent'::text,
      'quoted'::text,
      'approved'::text,
      'rejected'::text,
      'converted'::text
    ])
  )
) tablespace pg_default;

# Triggers:
# - trg_generate_po_number: Auto-genera número de orden (PO-2026-0001)
# - trg_recalculate_po_totals: Recalcula subtotal al modificar items

# Tabla MATERIAL_PURCHASE_ORDER_ITEMS:
# Items de la orden de compra

create table public.material_purchase_order_items (
  id uuid not null default gen_random_uuid(),
  purchase_order_id uuid not null,
  material_id uuid null,
  description text not null,
  quantity numeric(12, 4) not null default 1,
  unit_id uuid null,
  unit_price numeric(12, 2) null,
  notes text null,
  organization_id uuid null,
  project_id uuid null,
  created_at timestamptz not null default now(),
  created_by uuid null,
  constraint mpo_items_pkey primary key (id),
  constraint mpo_items_order_fkey foreign key (purchase_order_id) references material_purchase_orders(id) on delete cascade,
  constraint mpo_items_material_fkey foreign key (material_id) references materials(id) on delete set null,
  constraint mpo_items_unit_fkey foreign key (unit_id) references units(id) on delete set null,
  constraint mpo_items_org_fkey foreign key (organization_id) references organizations(id) on delete cascade,
  constraint mpo_items_project_fkey foreign key (project_id) references projects(id) on delete cascade,
  constraint mpo_items_created_by_fkey foreign key (created_by) references organization_members(id) on delete set null
) tablespace pg_default;

create index idx_mpo_items_material on material_purchase_order_items(material_id);

# Tabla MATERIAL_INVOICES:
# Facturas/recibos (lo que RECIBO del proveedor)
# Antes se llamaba material_purchases

create table public.material_invoices (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null,
  purchase_order_id uuid null,
  provider_id uuid null,
  invoice_number text null,
  document_type text not null default 'invoice'::text,
  purchase_date date not null default now(),
  subtotal numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) generated always as (subtotal + tax_amount) stored,
  currency_id uuid not null,
  exchange_rate numeric(18, 6) null,
  status text not null default 'pending'::text,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  constraint material_invoices_pkey primary key (id),
  constraint material_invoices_org_fkey foreign key (organization_id) references organizations(id) on delete cascade,
  constraint material_invoices_project_fkey foreign key (project_id) references projects(id) on delete cascade,
  constraint material_invoices_po_fkey foreign key (purchase_order_id) references material_purchase_orders(id) on delete set null,
  constraint material_invoices_provider_fkey foreign key (provider_id) references contacts(id) on delete set null,
  constraint material_invoices_currency_fkey foreign key (currency_id) references currencies(id) on delete restrict,
  constraint material_invoices_created_by_fkey foreign key (created_by) references organization_members(id) on delete set null,
  constraint material_invoices_status_check check (
    status = any (array[
      'pending'::text,
      'partially_paid'::text,
      'paid'::text,
      'cancelled'::text
    ])
  )
) tablespace pg_default;

create index idx_material_invoices_po on material_invoices(purchase_order_id);

# Tabla MATERIAL_INVOICE_ITEMS:
# Items de la factura
# Antes se llamaba material_purchase_items

create table public.material_invoice_items (
  id uuid not null default gen_random_uuid(),
  invoice_id uuid not null,
  material_id uuid null,
  product_id uuid null,
  description text not null,
  quantity numeric(12, 4) not null default 1,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) generated always as (quantity * unit_price) stored,
  unit_id uuid null,
  organization_id uuid not null,
  project_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid null,
  constraint material_invoice_items_pkey primary key (id),
  constraint material_invoice_items_invoice_fkey foreign key (invoice_id) references material_invoices(id) on delete cascade,
  constraint material_invoice_items_material_fkey foreign key (material_id) references materials(id) on delete set null,
  constraint material_invoice_items_product_fkey foreign key (product_id) references products(id) on delete set null,
  constraint material_invoice_items_unit_fkey foreign key (unit_id) references units(id) on delete set null,
  constraint material_invoice_items_org_fkey foreign key (organization_id) references organizations(id) on delete cascade,
  constraint material_invoice_items_project_fkey foreign key (project_id) references projects(id) on delete cascade
) tablespace pg_default;

create index idx_material_invoice_items_material on material_invoice_items(material_id);

# ============================================
# VISTAS DE COMPRAS
# ============================================

# Vista MATERIAL_PURCHASE_ORDERS_VIEW:

create view public.material_purchase_orders_view as
select 
    po.id,
    po.organization_id,
    po.project_id,
    po.order_number,
    po.order_date,
    po.expected_delivery_date,
    po.status,
    po.notes,
    po.subtotal,
    po.tax_amount,
    (po.subtotal + po.tax_amount) as total,
    po.currency_id,
    c.symbol as currency_symbol,
    c.code as currency_code,
    po.provider_id,
    coalesce(prov.company_name, prov.first_name || ' ' || prov.last_name) as provider_name,
    p.name as project_name,
    po.created_at,
    po.updated_at,
    po.is_deleted,
    coalesce(items.item_count, 0) as item_count
from material_purchase_orders po
left join currencies c on c.id = po.currency_id
left join contacts prov on prov.id = po.provider_id
left join projects p on p.id = po.project_id
left join lateral (
    select count(*) as item_count
    from material_purchase_order_items poi
    where poi.purchase_order_id = po.id
) items on true
where po.is_deleted = false;

# Vista MATERIAL_INVOICES_VIEW:

create view public.material_invoices_view as
select 
    inv.id,
    inv.organization_id,
    inv.project_id,
    inv.purchase_order_id,
    inv.invoice_number,
    inv.document_type,
    inv.purchase_date,
    inv.subtotal,
    inv.tax_amount,
    inv.total_amount,
    inv.currency_id,
    c.symbol as currency_symbol,
    c.code as currency_code,
    inv.exchange_rate,
    inv.status,
    inv.notes,
    inv.provider_id,
    coalesce(prov.company_name, prov.first_name || ' ' || prov.last_name) as provider_name,
    p.name as project_name,
    po.order_number as po_number,
    inv.created_at,
    inv.updated_at,
    inv.created_by,
    coalesce(items.item_count, 0) as item_count
from material_invoices inv
left join currencies c on c.id = inv.currency_id
left join contacts prov on prov.id = inv.provider_id
left join projects p on p.id = inv.project_id
left join material_purchase_orders po on po.id = inv.purchase_order_id
left join lateral (
    select count(*) as item_count
    from material_invoice_items ii
    where ii.invoice_id = inv.id
) items on true;