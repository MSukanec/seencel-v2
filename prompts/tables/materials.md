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