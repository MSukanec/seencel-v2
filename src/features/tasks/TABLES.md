# Tablas y Vistas en DB para TASKS (Tareas Paramétricas)

> Última actualización: 2026-01-24

Este documento contiene los esquemas SQL actuales y propuestos para el sistema de Tareas Paramétricas.

---

## 📊 TABLAS ACTUALES

### Tabla TASKS (Principal)

```sql
create table public.tasks (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  
  -- Identificación
  code text null,                        -- Código único (ej: "CP-001")
  name text null,                        -- Nombre sistema
  custom_name text null,                 -- Nombre personalizado org
  description text null,
  
  -- Clasificación
  unit_id uuid not null,                 -- Unidad de medida
  task_division_id uuid null,            -- Rubro/División
  
  -- Propiedad
  organization_id uuid null,             -- null = sistema
  is_system boolean null default true,
  
  -- Estado
  is_published boolean null default false,
  is_deleted boolean null default false,
  deleted_at timestamp with time zone null,
  
  -- Auditoría
  created_by uuid null,
  updated_by uuid null,
  
  -- Constraints
  constraint task_parametric_pkey primary key (id),
  constraint tasks_unit_id_fkey foreign key (unit_id) references units (id),
  constraint tasks_task_division_id_fkey foreign key (task_division_id) references task_divisions (id),
  constraint task_parametric_organization_id_fkey foreign key (organization_id) references organizations (id),
  constraint tasks_system_org_consistency_chk check (
    ((is_system = true and organization_id is null) or 
     (is_system = false and organization_id is not null))
  )
) tablespace pg_default;

-- Índices
create unique index tasks_code_lower_uniq on tasks (lower(code)) where (code is not null);
create unique index tasks_custom_name_system_uniq on tasks (lower(custom_name)) 
  where (organization_id is null and custom_name is not null);
create unique index tasks_custom_name_org_uniq on tasks (organization_id, lower(custom_name)) 
  where (organization_id is not null and custom_name is not null);
create index tasks_active_idx on tasks (organization_id, is_deleted, is_published) 
  where (is_deleted = false);
```

---

### Tabla TASK_DIVISIONS (Rubros) - ✅ SIMPLIFICADA

```sql
-- Tabla de SISTEMA: solo admins pueden crear/editar
-- Simplificada el 2026-01-24 (ver migración 20260124_simplify_task_divisions.sql)

create table public.task_divisions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  name text not null,
  description text null,
  code text null,
  "order" integer null,                  -- Orden de visualización
  
  -- Jerarquía
  parent_id uuid null,                   -- División padre (anidable)
  
  -- Soft delete
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  
  constraint task_rubros_pkey primary key (id),
  constraint task_divisions_parent_id_fkey foreign key (parent_id) references task_divisions (id)
) tablespace pg_default;

-- Índices
create index idx_task_divisions_not_deleted on task_divisions (is_deleted) where (is_deleted = false);

-- RLS: Todos ven, solo is_admin() muta
-- Policy: "TODOS VEN TASK_DIVISIONS" (SELECT true)
-- Policy: "ADMINS GESTIONAN TASK_DIVISIONS" (ALL is_admin())
```

---

### ~~Tabla TASK_CATEGORIES~~ (⛔ ELIMINADA)

```sql
-- ELIMINADA el 2026-01-24
-- Era redundante con task_divisions
-- Datos migrados a task_divisions
-- Ver migración: 20260124_cleanup_task_categories.sql
```

---

### Tabla TASK_KIND (Tipos de Acción)

```sql
-- Tipos de acción para tareas: Ejecución, Provisión, Colocación, etc.
-- Tabla de SISTEMA: solo admins pueden crear/editar
-- Limpiada el 2026-01-24 (ver migración 20260124_cleanup_task_kind.sql)

create table public.task_kind (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  name text not null,                    -- Nombre único (ej: "Ejecución")
  code text null,                        -- Código corto único (ej: "EJEC")
  description text null,
  "order" integer null,                  -- Orden de visualización
  
  is_active boolean not null default true,  -- Si está disponible para selección
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  
  constraint task_kind_pkey primary key (id),
  constraint task_kind_name_key unique (name),
  constraint task_kind_code_key unique (code)
) tablespace pg_default;

-- Índices
create index idx_task_kind_not_deleted on task_kind (is_deleted) where (is_deleted = false);

-- Trigger
create trigger task_kind_set_updated_at before update on task_kind
  for each row execute function set_timestamp();

-- RLS: Todos ven, solo admins mutan
alter table task_kind enable row level security;
create policy "TODOS VEN TASK_KIND" on task_kind for select using (true);
create policy "ADMINS GESTIONAN TASK_KIND" on task_kind for all using (is_admin());
```

---

### Tabla TASK_PARAMETERS (Parámetros Reutilizables) - ✅ LIMPIADA

```sql
-- Parámetros globales reutilizables para tareas
-- Tabla de SISTEMA: solo admins pueden crear/editar
-- Limpiada el 2026-01-24 (ver migración 20260124_cleanup_task_parameters.sql)

create table public.task_parameters (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  -- Identificación
  slug text not null,                    -- Identificador único para fórmulas (ej: "espesor")
  label text not null,                   -- Nombre visible (ej: "Espesor")
  description text null,                 -- Descripción del parámetro
  
  -- Tipo y validación
  type text not null,                    -- text, number, select, material, boolean
  default_value text null,               -- Valor por defecto
  validation_rules jsonb null,           -- Reglas: {min, max, pattern, options, etc}
  expression_template text null,         -- Fórmula si es calculado
  is_required boolean null default true,
  
  -- Visualización
  "order" integer null,                  -- Orden en formularios
  
  -- Soft delete
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  
  constraint task_parameters_pkey primary key (id),
  constraint task_parameters_type_check check (
    type in ('text', 'number', 'select', 'material', 'boolean')
  )
) tablespace pg_default;

-- Índices
create unique index idx_task_parameters_slug_unique on task_parameters (lower(slug)) where (is_deleted = false);
create index idx_task_parameters_not_deleted on task_parameters (is_deleted) where (is_deleted = false);

-- Trigger
create trigger task_parameters_set_updated_at before update on task_parameters
  for each row execute function set_timestamp();

-- RLS: Todos ven, solo admins mutan
alter table task_parameters enable row level security;
create policy "TODOS VEN TASK_PARAMETERS" on task_parameters for select using (true);
create policy "ADMINS GESTIONAN TASK_PARAMETERS" on task_parameters for all using (is_admin());
```

---

### Tabla TASK_PARAMETER_OPTIONS - ✅ LIMPIADA

```sql
-- Opciones para parámetros tipo "select"
-- Tabla de SISTEMA: solo admins pueden crear/editar
-- Limpiada el 2026-01-24

create table public.task_parameter_options (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  parameter_id uuid not null,            -- Parámetro padre
  name text null,                        -- Valor interno para fórmulas (ej: "8cm")
  label text not null,                   -- Texto visible (ej: "8 centímetros")
  value text null,                       -- Valor para cálculos (ej: "0.08")
  description text null,
  unit_id uuid null,                     -- Unidad asociada
  "order" integer null,                  -- Orden de visualización
  
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  
  constraint task_parameter_options_pkey primary key (id),
  constraint task_parameter_options_parameter_id_fkey 
    foreign key (parameter_id) references task_parameters(id) on delete cascade,
  constraint task_parameter_options_unit_id_fkey 
    foreign key (unit_id) references units(id)
) tablespace pg_default;

-- Índices
create index idx_task_parameter_options_parameter_id on task_parameter_options (parameter_id) where (is_deleted = false);
create index idx_task_parameter_options_not_deleted on task_parameter_options (is_deleted) where (is_deleted = false);

-- Trigger
create trigger task_parameter_options_set_updated_at before update on task_parameter_options
  for each row execute function set_timestamp();

-- RLS: Todos ven, solo admins mutan
alter table task_parameter_options enable row level security;
create policy "TODOS VEN TASK_PARAMETER_OPTIONS" on task_parameter_options for select using (true);
create policy "ADMINS GESTIONAN TASK_PARAMETER_OPTIONS" on task_parameter_options for all using (is_admin());
```

---

### Tabla TASK_TASK_PARAMETERS (Unión) - ✅ NUEVA

```sql
-- Tabla de unión: vincula parámetros reutilizables a tareas específicas
-- Permite override de valores por tarea
-- Creada el 2026-01-24

create table public.task_task_parameters (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  
  task_id uuid not null,                 -- Tarea que usa este parámetro
  parameter_id uuid not null,            -- Parámetro reutilizable
  
  default_value text null,               -- Valor por defecto específico para ESTA tarea
  is_required boolean not null default true,
  "order" integer null,                  -- Orden en ESTA tarea
  
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  
  constraint task_task_parameters_pkey primary key (id),
  constraint task_task_parameters_task_id_fkey foreign key (task_id) references tasks(id) on delete cascade,
  constraint task_task_parameters_parameter_id_fkey foreign key (parameter_id) references task_parameters(id) on delete cascade,
  constraint task_task_parameters_unique unique (task_id, parameter_id)
) tablespace pg_default;

-- Índices
create index idx_task_task_parameters_task_id on task_task_parameters (task_id) where (is_deleted = false);
create index idx_task_task_parameters_parameter_id on task_task_parameters (parameter_id) where (is_deleted = false);

-- Trigger
create trigger task_task_parameters_set_updated_at before update on task_task_parameters
  for each row execute function set_timestamp();

-- RLS: Todos ven, solo admins mutan
alter table task_task_parameters enable row level security;
create policy "TODOS VEN TASK_TASK_PARAMETERS" on task_task_parameters for select using (true);
create policy "ADMINS GESTIONAN TASK_TASK_PARAMETERS" on task_task_parameters for all using (is_admin());
```

---

### Tabla TASK_MATERIALS (Receta Fija Actual)

```sql
-- Receta de materiales por tarea (actualmente cantidad fija, sin fórmulas)

create table public.task_materials (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  material_id uuid not null,
  amount numeric(12, 4) null,            -- Cantidad por unidad de tarea
  is_system boolean null default false,
  created_at timestamp with time zone null default now(),
  
  constraint task_materials_pkey primary key (id),
  constraint task_materials_task_id_fkey foreign key (task_id) references tasks (id) on delete cascade,
  constraint task_materials_material_id_fkey foreign key (material_id) references materials (id),
  constraint task_materials_unique unique (task_id, material_id)
) tablespace pg_default;
```

---

### Vista TASKS_VIEW

```sql
create view public.tasks_view as
select 
  t.id,
  t.created_at,
  t.updated_at,
  t.code,
  t.name,
  t.custom_name,
  t.description,
  t.unit_id,
  t.task_division_id,
  t.organization_id,
  t.is_system,
  t.is_published,
  t.is_deleted,
  u.name as unit_name,
  d.name as division_name,
  d."order" as division_order
from tasks t
left join units u on u.id = t.unit_id
left join task_divisions d on d.id = t.task_division_id;
```

---

## 🆕 TABLAS PROPUESTAS (Sistema Paramétrico)

### Tabla TASK_TEMPLATES (Plantillas Padre)

```sql
-- Plantillas de tareas parametrizables

create table public.task_templates (
  id uuid not null default gen_random_uuid (),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Identificación
  code text null,                        -- Código único (ej: "TPL-CP")
  name text not null,                    -- Nombre (ej: "Ejecución de Contrapiso")
  description text null,
  
  -- Clasificación
  task_division_id uuid null,            -- Rubro
  base_unit_id uuid not null,            -- Unidad base (m², ml, etc.)
  
  -- Propiedad
  organization_id uuid null,             -- null = sistema
  is_system boolean not null default true,
  
  -- Comportamiento
  auto_generate_variants boolean not null default false,
  
  -- Estado
  is_published boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz null,
  
  -- Auditoría
  created_by uuid null,
  updated_by uuid null,
  
  constraint task_templates_pkey primary key (id),
  constraint task_templates_division_fkey foreign key (task_division_id) references task_divisions (id),
  constraint task_templates_unit_fkey foreign key (base_unit_id) references units (id)
) tablespace pg_default;

create unique index task_templates_code_uniq on task_templates (lower(code)) where (code is not null);
create index task_templates_division_idx on task_templates (task_division_id);
```

---

### Tabla TASK_TEMPLATE_PARAMETERS

```sql
-- Parámetros específicos de cada plantilla

create table public.task_template_parameters (
  id uuid not null default gen_random_uuid (),
  template_id uuid not null,
  
  -- Definición
  slug text not null,                    -- ID para fórmulas (ej: "espesor")
  label text not null,                   -- Nombre visible (ej: "Espesor")
  type text not null,                    -- number, select, boolean, material
  
  -- Configuración
  default_value text null,               -- Valor por defecto
  is_required boolean not null default true,
  display_order integer not null default 0,
  
  -- Validación (JSONB para flexibilidad)
  validation jsonb null,                 -- {"min": 5, "max": 20, "step": 1}
  
  -- Para tipo "select"
  options jsonb null,                    -- [{"value": "8", "label": "8 cm"}, ...]
  
  created_at timestamptz not null default now(),
  
  constraint task_template_params_pkey primary key (id),
  constraint task_template_params_template_fkey 
    foreign key (template_id) references task_templates (id) on delete cascade,
  constraint task_template_params_type_check check (
    type in ('number', 'select', 'boolean', 'text', 'material')
  ),
  constraint task_template_params_slug_uniq unique (template_id, slug)
) tablespace pg_default;

create index task_template_params_template_idx on task_template_parameters (template_id);
```

---

### Tabla TASK_TEMPLATE_RECIPE_ITEMS

```sql
-- Receta dinámica con fórmulas

create table public.task_template_recipe_items (
  id uuid not null default gen_random_uuid (),
  template_id uuid not null,
  material_id uuid not null,
  
  -- Fórmula de cantidad (usa slugs de parámetros)
  quantity_formula text not null,        -- Ej: "superficie * espesor * 0.35"
  
  -- Condición opcional (si aplica)
  condition_formula text null,           -- Ej: "usar_malla == true"
  
  -- Unidad del resultado
  result_unit_id uuid null,
  
  -- Metadata
  notes text null,
  display_order integer not null default 0,
  
  created_at timestamptz not null default now(),
  
  constraint task_template_recipe_pkey primary key (id),
  constraint task_template_recipe_template_fkey 
    foreign key (template_id) references task_templates (id) on delete cascade,
  constraint task_template_recipe_material_fkey 
    foreign key (material_id) references materials (id),
  constraint task_template_recipe_unit_fkey 
    foreign key (result_unit_id) references units (id),
  constraint task_template_recipe_unique unique (template_id, material_id)
) tablespace pg_default;
```

---

### Tabla TASK_VARIANTS

```sql
-- Variantes generadas desde plantillas

create table public.task_variants (
  id uuid not null default gen_random_uuid (),
  created_at timestamptz not null default now(),
  
  -- Origen
  template_id uuid not null,
  
  -- Parámetros usados
  parameter_values jsonb not null,       -- {"espesor": 10, "usar_malla": true}
  
  -- Nombre generado
  generated_name text not null,          -- "Contrapiso 10cm con malla"
  generated_code text null,              -- "CP-10-M"
  
  -- Materiales calculados (cache)
  calculated_recipe jsonb null,          -- Result de evaluate_recipe()
  
  -- Estado
  is_auto_generated boolean not null default true,
  is_active boolean not null default true,
  
  constraint task_variants_pkey primary key (id),
  constraint task_variants_template_fkey 
    foreign key (template_id) references task_templates (id) on delete cascade
) tablespace pg_default;

create index task_variants_template_idx on task_variants (template_id);
create index task_variants_params_idx on task_variants using gin (parameter_values);
```

---

## 🔧 FUNCIONES PROPUESTAS

### Función evaluate_recipe()

```sql
-- Evalúa una fórmula con parámetros dados
-- Retorna el valor numérico calculado

create or replace function evaluate_recipe(
  p_formula text,
  p_parameters jsonb
) returns numeric as $$
declare
  v_result numeric;
  v_expression text;
  v_key text;
  v_value text;
begin
  v_expression := p_formula;
  
  -- Reemplazar cada parámetro en la fórmula
  for v_key, v_value in select * from jsonb_each_text(p_parameters)
  loop
    v_expression := replace(v_expression, v_key, v_value);
  end loop;
  
  -- Evaluar expresión matemática
  execute 'select ' || v_expression into v_result;
  
  return coalesce(v_result, 0);
exception when others then
  return null; -- Fórmula inválida
end;
$$ language plpgsql immutable;
```

---

### Función calculate_task_materials()

```sql
-- Calcula todos los materiales de una plantilla con parámetros dados

create or replace function calculate_task_materials(
  p_template_id uuid,
  p_parameters jsonb
) returns table (
  material_id uuid,
  material_name text,
  quantity numeric,
  unit_name text
) as $$
begin
  return query
  select 
    r.material_id,
    m.name as material_name,
    evaluate_recipe(r.quantity_formula, p_parameters) as quantity,
    u.name as unit_name
  from task_template_recipe_items r
  join materials m on m.id = r.material_id
  left join units u on u.id = r.result_unit_id
  where r.template_id = p_template_id
    and (r.condition_formula is null 
         or evaluate_recipe(r.condition_formula, p_parameters) > 0);
end;
$$ language plpgsql stable;
```

---

## 📋 MIGRACIÓN SUGERIDA

### Paso 1: Crear tablas nuevas

```sql
-- 1. task_templates
-- 2. task_template_parameters  
-- 3. task_template_recipe_items
-- 4. task_variants
```

### Paso 2: Migrar tareas existentes (opcional)

```sql
-- Convertir tasks simples a templates (para las que tienen recetas)
insert into task_templates (...)
select ... from tasks where exists (
  select 1 from task_materials where task_id = tasks.id
);
```

### Paso 3: Consolidar categorías

```sql
-- Verificar uso de task_categories
-- Si no se usa, eliminar tabla
-- Si se usa, migrar datos a task_divisions
```
