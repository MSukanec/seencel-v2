# Database Schema (Auto-generated)
> Generated: 2026-02-21T16:30:21.519Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PUBLIC] Views (2)

### `budget_items_view`

```sql
SELECT bi.id,
    bi.quote_id AS budget_id,
    bi.organization_id,
    bi.project_id,
    bi.task_id,
    bi.created_at,
    bi.updated_at,
    bi.created_by,
    t.custom_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    bi.description,
    bi.quantity,
    bi.unit_price,
    bi.currency_id,
    bi.markup_pct,
    bi.tax_pct,
    bi.cost_scope,
        CASE bi.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN 'Materiales + Mano de obra'::text
            WHEN 'materials_only'::cost_scope_enum THEN 'Sólo materiales'::text
            WHEN 'labor_only'::cost_scope_enum THEN 'Sólo mano de obra'::text
            ELSE initcap(replace((bi.cost_scope)::text, '_'::text, ' '::text))
        END AS cost_scope_label,
    bi.sort_key AS "position"
   FROM (((finance.quote_items bi
     LEFT JOIN catalog.tasks t ON ((t.id = bi.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)));
```

### `organization_task_prices_view`

```sql
SELECT p.id,
    p.organization_id,
    p.task_id,
    t.custom_name AS task_name,
    td.name AS division_name,
    td."order" AS division_order,
    u.name AS unit,
    p.labor_unit_cost,
    p.material_unit_cost,
    p.supply_unit_cost,
    COALESCE(p.total_unit_cost, ((COALESCE(p.labor_unit_cost, (0)::numeric) + COALESCE(p.material_unit_cost, (0)::numeric)) + COALESCE(p.supply_unit_cost, (0)::numeric))) AS total_unit_cost,
    p.currency_code,
    p.note,
    p.created_at,
    p.updated_at
   FROM (((organization_task_prices p
     LEFT JOIN catalog.tasks t ON ((t.id = p.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)));
```
