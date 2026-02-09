# Tablas en DB para TAREAS DE CONSTRUCCION:

# Tabla CONSTRUCTION_DEPENDENCIES:

create table public.construction_dependencies (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  predecessor_task_id uuid not null,
  successor_task_id uuid not null,
  type text not null default 'FS'::text,
  lag_days integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  constraint construction_dependencies_pkey primary key (id),
  constraint construction_dependencies_unique unique (predecessor_task_id, successor_task_id, type),
  constraint construction_dependencies_predecessor_task_id_fkey foreign KEY (predecessor_task_id) references construction_tasks (id) on delete CASCADE,
  constraint construction_dependencies_successor_task_id_fkey foreign KEY (successor_task_id) references construction_tasks (id) on delete CASCADE,
  constraint construction_dependencies_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint construction_dependencies_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint construction_dependencies_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint construction_dependencies_no_self_reference check ((predecessor_task_id <> successor_task_id)),
  constraint construction_dependencies_type_check check (
    (
      type = any (
        array['FS'::text, 'FF'::text, 'SS'::text, 'SF'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_construction_dependencies_predecessor on public.construction_dependencies using btree (predecessor_task_id) TABLESPACE pg_default;

create index IF not exists idx_construction_dependencies_successor on public.construction_dependencies using btree (successor_task_id) TABLESPACE pg_default;

create index IF not exists idx_construction_dependencies_organization on public.construction_dependencies using btree (organization_id) TABLESPACE pg_default;

create trigger set_updated_by_construction_dependencies BEFORE INSERT
or
update on construction_dependencies for EACH row
execute FUNCTION handle_updated_by ();

# Tabla CONSTRUCTION_TASK_MATERIAL_SNAPSHOTS:

create table public.construction_task_material_snapshots (
  id uuid not null default gen_random_uuid (),
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
  constraint ctms_unique_material unique (construction_task_id, material_id),
  constraint ctms_material_fkey foreign KEY (material_id) references materials (id) on delete RESTRICT,
  constraint ctms_organization_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint ctms_project_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint ctms_source_task_fkey foreign KEY (source_task_id) references tasks (id) on delete set null,
  constraint ctms_unit_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint ctms_construction_task_fkey foreign KEY (construction_task_id) references construction_tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ctms_construction_task on public.construction_task_material_snapshots using btree (construction_task_id) TABLESPACE pg_default;

create index IF not exists idx_ctms_project on public.construction_task_material_snapshots using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_ctms_material on public.construction_task_material_snapshots using btree (material_id) TABLESPACE pg_default;

create index IF not exists idx_ctms_organization on public.construction_task_material_snapshots using btree (organization_id) TABLESPACE pg_default;

# Tabla CONSTRUCTION_TASKS:

create table public.construction_tasks (
  created_at timestamp with time zone not null default now(),
  organization_id uuid not null,
  updated_at timestamp with time zone null default now(),
  project_id uuid not null,
  task_id uuid null,
  quantity real null,
  created_by uuid null,
  planned_start_date date null,
  planned_end_date date null,
  duration_in_days integer null,
  id uuid not null default gen_random_uuid (),
  progress_percent integer null,
  description text null,
  cost_scope public.cost_scope_enum not null default 'materials_and_labor'::cost_scope_enum,
  updated_by uuid null,
  quote_item_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  status text not null default 'pending'::text,
  notes text null,
  original_quantity real null,
  custom_name text null,
  custom_unit text null,
  actual_start_date date null,
  actual_end_date date null,
  constraint construction_tasks_pkey primary key (id),
  constraint construction_tasks_id_key unique (id),
  constraint construction_tasks_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint construction_tasks_quote_item_id_fkey foreign KEY (quote_item_id) references quote_items (id) on delete set null,
  constraint construction_tasks_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint construction_tasks_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint construction_tasks_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint construction_tasks_task_id_fkey foreign KEY (task_id) references tasks (id) on delete set null,
  constraint construction_tasks_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in_progress'::text,
          'completed'::text,
          'paused'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_construction_tasks_project_id on public.construction_tasks using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_construction_tasks_organization_id on public.construction_tasks using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_construction_tasks_quote_item_id on public.construction_tasks using btree (quote_item_id) TABLESPACE pg_default;

create index IF not exists idx_construction_tasks_status on public.construction_tasks using btree (status) TABLESPACE pg_default;

create index IF not exists idx_construction_tasks_not_deleted on public.construction_tasks using btree (id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger on_construction_task_audit
after INSERT
or DELETE
or
update on construction_tasks for EACH row
execute FUNCTION log_construction_task_activity ();

create trigger set_updated_by_construction_tasks BEFORE INSERT
or
update on construction_tasks for EACH row
execute FUNCTION handle_updated_by ();

create trigger trg_construction_task_material_snapshot
after INSERT on construction_tasks for EACH row
execute FUNCTION create_construction_task_material_snapshot ();

# Vista CONSTRUCTION_TASKS_VIEW:

create view public.construction_tasks_view as
select
  ct.id,
  ct.organization_id,
  ct.project_id,
  ct.task_id,
  ct.quote_item_id,
  COALESCE(t.custom_name, t.name, ct.custom_name) as task_name,
  COALESCE(u.name, ct.custom_unit) as unit,
  td.name as division_name,
  ct.cost_scope,
  case ct.cost_scope
    when 'materials_and_labor'::cost_scope_enum then 'M.O. + MAT.'::text
    when 'labor_only'::cost_scope_enum then 'M.O.'::text
    when 'materials_only'::cost_scope_enum then 'MAT'::text
    else 'M.O. + MAT.'::text
  end as cost_scope_label,
  ct.quantity,
  ct.original_quantity,
  case
    when ct.original_quantity is not null
    and ct.original_quantity > 0::double precision then ct.quantity - ct.original_quantity
    else null::real
  end as quantity_variance,
  ct.planned_start_date,
  ct.planned_end_date,
  ct.actual_start_date,
  ct.actual_end_date,
  case
    when ct.actual_end_date is not null
    and ct.planned_end_date is not null then ct.actual_end_date - ct.planned_end_date
    else null::integer
  end as schedule_variance_days,
  ct.duration_in_days,
  ct.progress_percent,
  ct.status,
  ct.description,
  ct.notes,
  ct.custom_name,
  ct.custom_unit,
  ct.created_at,
  ct.updated_at,
  ct.created_by,
  ct.updated_by,
  ct.is_deleted,
  qi.quote_id,
  q.name as quote_name,
  qi.markup_pct as quote_markup_pct,
  ph.phase_name
from
  construction_tasks ct
  left join tasks t on t.id = ct.task_id
  left join units u on u.id = t.unit_id
  left join task_divisions td on td.id = t.task_division_id
  left join quote_items qi on qi.id = ct.quote_item_id
  left join quotes q on q.id = qi.quote_id
  left join lateral (
    select
      cp.name as phase_name
    from
      construction_phase_tasks cpt
      join construction_phases cp on cp.id = cpt.project_phase_id
    where
      cpt.construction_task_id = ct.id
    order by
      cpt.created_at desc
    limit
      1
  ) ph on true
where
  ct.is_deleted = false;