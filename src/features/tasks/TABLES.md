# Tablas y Vistas en DB para TASKS (Tareas Paramétricas)

# Tabla TASK_ACTIONS:

create table public.task_actions (
  name text null,
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  description text null,
  short_code character varying(10) null,
  constraint task_kind_pkey primary key (id),
  constraint task_kind_name_key unique (name)
) TABLESPACE pg_default;

create trigger task_kind_set_updated_at BEFORE
update on task_actions for EACH row
execute FUNCTION set_timestamp ();

# Vista TASK_COSTS_VIEW:

create view public.task_costs_view as
select
  t.id as task_id,
  0::numeric(14, 4) as unit_cost,
  null::numeric(14, 4) as mat_unit_cost,
  null::numeric(14, 4) as lab_unit_cost
from
  tasks t;

# Tabla TASK_DIVISION_ELEMENTS:

create table public.task_division_elements (
  division_id uuid not null,
  element_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint task_division_elements_pkey primary key (division_id, element_id),
  constraint task_division_elements_division_id_fkey foreign KEY (division_id) references task_divisions (id) on delete CASCADE,
  constraint task_division_elements_element_id_fkey foreign KEY (element_id) references task_elements (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla TASK_DIVISION_ACTIONS:

create table public.task_division_actions (
  division_id uuid not null,
  action_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint task_division_kinds_pkey primary key (division_id, action_id),
  constraint task_division_actions_action_id_fkey foreign KEY (action_id) references task_actions (id) on delete CASCADE,
  constraint task_division_kinds_division_id_fkey foreign KEY (division_id) references task_divisions (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla TASK_DIVISIONS:

create table public.task_divisions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  description text null,
  "order" integer null,
  code text null,
  parent_id uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint task_rubros_pkey primary key (id),
  constraint task_divisions_parent_id_fkey foreign KEY (parent_id) references task_divisions (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_task_divisions_not_deleted on public.task_divisions using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger task_divisions_set_updated_at BEFORE
update on task_divisions for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_ELEMENT_ACTIONS:

create table public.task_element_actions (
  action_id uuid not null,
  element_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint task_kind_elements_pkey primary key (action_id, element_id),
  constraint task_element_actions_action_id_fkey foreign KEY (action_id) references task_actions (id) on delete CASCADE,
  constraint task_kind_elements_element_id_fkey foreign KEY (element_id) references task_elements (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla TASK_ELEMENT_PARAMETERS:

create table public.task_element_parameters (
  element_id uuid not null,
  parameter_id uuid not null,
  "order" integer null default 0,
  is_required boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint task_element_parameters_pkey primary key (element_id, parameter_id),
  constraint task_element_parameters_element_id_fkey foreign KEY (element_id) references task_elements (id) on delete CASCADE,
  constraint task_element_parameters_parameter_id_fkey foreign KEY (parameter_id) references task_parameters (id) on delete CASCADE
) TABLESPACE pg_default;

# Tabla TASK_ELEMENTS:

create table public.task_elements (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  slug text not null,
  description text null,
  icon text null,
  "order" integer null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  code character varying(4) null,
  default_unit_id uuid null,
  constraint task_elements_pkey primary key (id),
  constraint task_elements_default_unit_id_fkey foreign KEY (default_unit_id) references units (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists task_elements_slug_uniq on public.task_elements using btree (lower(slug)) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_elements_not_deleted on public.task_elements using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger task_elements_set_updated_at BEFORE
update on task_elements for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_PARAMETER_OPTIONS:

create table public.task_parameter_options (
  id uuid not null default gen_random_uuid (),
  parameter_id uuid null,
  label text not null,
  created_at timestamp with time zone null default now(),
  name text null,
  updated_at timestamp with time zone null default now(),
  description text null,
  unit_id uuid null,
  value text null,
  "order" integer null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  short_code character varying(10) null,
  material_id uuid null,
  constraint task_parameter_options_pkey primary key (id),
  constraint task_parameter_options_material_id_fkey foreign KEY (material_id) references materials (id),
  constraint task_parameter_options_parameter_id_fkey foreign KEY (parameter_id) references task_parameters (id) on delete CASCADE,
  constraint task_parameter_options_unit_id_fkey foreign KEY (unit_id) references units (id)
) TABLESPACE pg_default;

create index IF not exists idx_task_parameter_options_not_deleted on public.task_parameter_options using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_parameter_options_parameter_id on public.task_parameter_options using btree (parameter_id) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger task_parameter_options_set_updated_at BEFORE
update on task_parameter_options for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_PARAMETERS:

create table public.task_parameters (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  label text not null,
  type text not null,
  created_at timestamp with time zone null default now(),
  expression_template text null,
  updated_at timestamp with time zone null default now(),
  is_required boolean null default true,
  "order" integer null,
  description text null,
  default_value text null,
  validation_rules jsonb null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint task_parameters_pkey primary key (id),
  constraint task_parameters_type_check check (
    (
      type = any (
        array[
          'text'::text,
          'number'::text,
          'select'::text,
          'material'::text,
          'boolean'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_task_parameters_not_deleted on public.task_parameters using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create unique INDEX IF not exists idx_task_parameters_slug_unique on public.task_parameters using btree (lower(slug)) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger task_parameters_set_updated_at BEFORE
update on task_parameters for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_RECIPE_LABOR:

create table public.task_recipe_labor (
  id uuid not null default gen_random_uuid (),
  recipe_id uuid not null,
  labor_type_id uuid not null,
  quantity numeric(20, 4) not null,
  unit_id uuid null,
  notes text null,
  is_optional boolean not null default false,
  organization_id uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  import_batch_id uuid null,
  constraint task_recipe_labor_pkey primary key (id),
  constraint task_recipe_labor_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint task_recipe_labor_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint task_recipe_labor_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint task_recipe_labor_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint task_recipe_labor_recipe_fkey foreign KEY (recipe_id) references task_recipes (id) on delete CASCADE,
  constraint task_recipe_labor_type_fkey foreign KEY (labor_type_id) references labor_types (id) on delete CASCADE,
  constraint task_recipe_labor_unit_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint task_recipe_labor_qty_positive check ((quantity > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_trl_recipe on public.task_recipe_labor using btree (recipe_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trl_labor_type on public.task_recipe_labor using btree (labor_type_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trl_org on public.task_recipe_labor using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trl_import_batch_id on public.task_recipe_labor using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

create trigger on_recipe_labor_audit
after INSERT
or DELETE
or
update on task_recipe_labor for EACH row
execute FUNCTION log_recipe_labor_activity ();

create trigger set_updated_by_task_recipe_labor BEFORE INSERT
or
update on task_recipe_labor for EACH row
execute FUNCTION handle_updated_by ();

create trigger task_recipe_labor_set_updated_at BEFORE
update on task_recipe_labor for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_RECIPE_MATERIALS:

create table public.task_recipe_materials (
  id uuid not null default gen_random_uuid (),
  recipe_id uuid not null,
  material_id uuid not null,
  quantity numeric(20, 4) not null,
  unit_id uuid null,
  notes text null,
  is_optional boolean not null default false,
  organization_id uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_by uuid null,
  updated_by uuid null,
  import_batch_id uuid null,
  waste_percentage numeric(5, 2) not null default 0,
  total_quantity numeric GENERATED ALWAYS as (
    (
      quantity * (
        (1)::numeric + (waste_percentage / (100)::numeric)
      )
    )
  ) STORED (20, 4) null,
  constraint task_recipe_materials_pkey primary key (id),
  constraint task_recipe_materials_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint task_recipe_materials_material_fkey foreign KEY (material_id) references materials (id) on delete CASCADE,
  constraint task_recipe_materials_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint task_recipe_materials_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint task_recipe_materials_recipe_fkey foreign KEY (recipe_id) references task_recipes (id) on delete CASCADE,
  constraint task_recipe_materials_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint task_recipe_materials_unit_fkey foreign KEY (unit_id) references units (id) on delete set null,
  constraint task_recipe_materials_waste_pct_positive check ((waste_percentage >= (0)::numeric)),
  constraint task_recipe_materials_qty_positive check ((quantity > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_trm_recipe on public.task_recipe_materials using btree (recipe_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trm_material on public.task_recipe_materials using btree (material_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trm_org on public.task_recipe_materials using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_trm_import_batch_id on public.task_recipe_materials using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

create trigger on_recipe_material_audit
after INSERT
or DELETE
or
update on task_recipe_materials for EACH row
execute FUNCTION log_recipe_material_activity ();

create trigger set_updated_by_task_recipe_materials BEFORE INSERT
or
update on task_recipe_materials for EACH row
execute FUNCTION handle_updated_by ();

create trigger task_recipe_materials_set_updated_at BEFORE
update on task_recipe_materials for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASK_RECIPE_RATINGS:

create table public.task_recipe_ratings (
  id uuid not null default gen_random_uuid (),
  recipe_id uuid not null,
  organization_id uuid not null,
  user_id uuid not null,
  rating integer not null,
  comment text null,
  is_verified_usage boolean not null default false,
  construction_task_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint task_recipe_ratings_pkey primary key (id),
  constraint task_recipe_ratings_unique unique (recipe_id, organization_id),
  constraint task_recipe_ratings_task_fkey foreign KEY (construction_task_id) references construction_tasks (id) on delete set null,
  constraint task_recipe_ratings_recipe_fkey foreign KEY (recipe_id) references task_recipes (id) on delete CASCADE,
  constraint task_recipe_ratings_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint task_recipe_ratings_user_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint task_recipe_ratings_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_task_recipe_ratings_recipe on public.task_recipe_ratings using btree (recipe_id) TABLESPACE pg_default;

create index IF not exists idx_task_recipe_ratings_org on public.task_recipe_ratings using btree (organization_id) TABLESPACE pg_default;

create trigger trg_recalculate_recipe_rating
after INSERT
or DELETE
or
update on task_recipe_ratings for EACH row
execute FUNCTION recalculate_recipe_rating ();

# Tabla TASK_RECIPES:

create table public.task_recipes (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  organization_id uuid not null,
  is_public boolean not null default false,
  region text null,
  rating_avg numeric(3, 2) null,
  rating_count integer not null default 0,
  usage_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  import_batch_id uuid null,
  name text null,
  constraint task_recipes_pkey primary key (id),
  constraint task_recipes_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint task_recipes_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint task_recipes_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint task_recipes_task_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint task_recipes_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_task_recipes_task on public.task_recipes using btree (task_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_recipes_org on public.task_recipes using btree (organization_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_recipes_public on public.task_recipes using btree (is_public, rating_avg desc nulls last) TABLESPACE pg_default
where
  (
    (is_public = true)
    and (is_deleted = false)
  );

create index IF not exists idx_task_recipes_import_batch_id on public.task_recipes using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

create trigger on_task_recipe_audit
after INSERT
or DELETE
or
update on task_recipes for EACH row
execute FUNCTION log_task_recipe_activity ();

create trigger set_updated_by_task_recipes BEFORE INSERT
or
update on task_recipes for EACH row
execute FUNCTION handle_updated_by ();

create trigger task_recipes_set_updated_at BEFORE
update on task_recipes for EACH row
execute FUNCTION set_timestamp ();

# Vista TASK_RECIPES_VIEW:

create view public.task_recipes_view as
select
  tr.id,
  tr.task_id,
  tr.organization_id,
  tr.name,
  tr.is_public,
  tr.region,
  tr.rating_avg,
  tr.rating_count,
  tr.usage_count,
  tr.created_at,
  tr.updated_at,
  tr.is_deleted,
  tr.import_batch_id,
  t.name as task_name,
  t.custom_name as task_custom_name,
  COALESCE(t.custom_name, t.name) as task_display_name,
  td.name as division_name,
  u.name as unit_name,
  o.name as org_name,
  (
    select
      count(*) as count
    from
      task_recipe_items tri
    where
      tri.recipe_id = tr.id
  ) as item_count
from
  task_recipes tr
  left join tasks t on t.id = tr.task_id
  left join task_divisions td on td.id = t.task_division_id
  left join units u on u.id = t.unit_id
  left join organizations o on o.id = tr.organization_id
where
  tr.is_deleted = false;

# Tabla TASK_TASK_PARAMETERS:

create table public.task_task_parameters (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  task_id uuid not null,
  parameter_id uuid not null,
  default_value text null,
  is_required boolean not null default true,
  "order" integer null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint task_task_parameters_pkey primary key (id),
  constraint task_task_parameters_unique unique (task_id, parameter_id),
  constraint task_task_parameters_parameter_id_fkey foreign KEY (parameter_id) references task_parameters (id) on delete CASCADE,
  constraint task_task_parameters_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_task_task_parameters_task_id on public.task_task_parameters using btree (task_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_task_parameters_parameter_id on public.task_task_parameters using btree (parameter_id) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_task_task_parameters_not_deleted on public.task_task_parameters using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger task_task_parameters_set_updated_at BEFORE
update on task_task_parameters for EACH row
execute FUNCTION set_timestamp ();

# Tabla TASKS:

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
  task_action_id uuid null,
  task_element_id uuid null,
  is_parametric boolean not null default false,
  parameter_values jsonb null default '{}'::jsonb,
  import_batch_id uuid null,
  constraint task_parametric_pkey primary key (id),
  constraint tasks_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint tasks_import_batch_id_fkey foreign KEY (import_batch_id) references import_batches (id) on delete set null,
  constraint tasks_updated_by_fkey foreign KEY (updated_by) references organization_members (id) on delete set null,
  constraint task_parametric_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint tasks_task_action_id_fkey foreign KEY (task_action_id) references task_actions (id),
  constraint tasks_task_division_id_fkey foreign KEY (task_division_id) references task_divisions (id) on delete set null,
  constraint tasks_task_element_id_fkey foreign KEY (task_element_id) references task_elements (id),
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

create unique INDEX IF not exists tasks_parametric_signature_uniq on public.tasks using btree (
  task_action_id,
  task_element_id,
  task_division_id,
  parameter_values
) TABLESPACE pg_default
where
  (
    (is_parametric = true)
    and (is_deleted = false)
  );

create index IF not exists idx_tasks_import_batch_id on public.tasks using btree (import_batch_id) TABLESPACE pg_default
where
  (import_batch_id is not null);

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
  t.task_action_id,
  t.task_element_id,
  t.is_parametric,
  t.parameter_values,
  t.import_batch_id,
  t.created_at,
  t.updated_at,
  t.created_by,
  t.updated_by,
  u.name as unit_name,
  d.name as division_name,
  ta.name as action_name,
  ta.short_code as action_short_code,
  te.name as element_name
from
  tasks t
  left join units u on u.id = t.unit_id
  left join task_divisions d on d.id = t.task_division_id
  left join task_actions ta on ta.id = t.task_action_id
  left join task_elements te on te.id = t.task_element_id;

# Tabla UNITS:

create table public.units (
  name text not null,
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  symbol text null,
  applicable_to text[] not null default array['task'::text, 'material'::text, 'labor'::text],
  constraint units_pkey primary key (id),
  constraint units_id_key1 unique (id),
  constraint units_name_not_blank_chk check ((btrim(name) <> ''::text))
) TABLESPACE pg_default;

create unique INDEX IF not exists units_name_lower_uniq on public.units using btree (lower(name)) TABLESPACE pg_default;