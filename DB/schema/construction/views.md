# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Views (3)

### `construction.construction_tasks_view` (🔓 INVOKER)

```sql
SELECT ct.id,
    ct.organization_id,
    ct.project_id,
    ct.task_id,
    ct.recipe_id,
    ct.quote_item_id,
    COALESCE(t.custom_name, t.name, ct.custom_name) AS task_name,
    COALESCE(u.name, ct.custom_unit) AS unit,
    td.name AS division_name,
    ct.cost_scope,
        CASE ct.cost_scope
            WHEN 'materials_and_labor'::cost_scope_enum THEN 'M.O. + MAT.'::text
            WHEN 'labor_only'::cost_scope_enum THEN 'M.O.'::text
            WHEN 'materials_only'::cost_scope_enum THEN 'MAT'::text
            ELSE 'M.O. + MAT.'::text
        END AS cost_scope_label,
    ct.quantity,
    ct.original_quantity,
        CASE
            WHEN ((ct.original_quantity IS NOT NULL) AND (ct.original_quantity > (0)::double precision)) THEN (ct.quantity - ct.original_quantity)
            ELSE NULL::real
        END AS quantity_variance,
    ct.planned_start_date,
    ct.planned_end_date,
    ct.actual_start_date,
    ct.actual_end_date,
        CASE
            WHEN ((ct.actual_end_date IS NOT NULL) AND (ct.planned_end_date IS NOT NULL)) THEN (ct.actual_end_date - ct.planned_end_date)
            ELSE NULL::integer
        END AS schedule_variance_days,
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
    q.name AS quote_name,
    qi.markup_pct AS quote_markup_pct,
    ph.phase_name,
    tr.name AS recipe_name
   FROM (((((((construction.construction_tasks ct
     LEFT JOIN catalog.tasks t ON ((t.id = ct.task_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN finance.quote_items qi ON ((qi.id = ct.quote_item_id)))
     LEFT JOIN finance.quotes q ON ((q.id = qi.quote_id)))
     LEFT JOIN catalog.task_recipes tr ON ((tr.id = ct.recipe_id)))
     LEFT JOIN LATERAL ( SELECT cp.name AS phase_name
           FROM (construction.construction_phase_tasks cpt
             JOIN construction.construction_phases cp ON ((cp.id = cpt.project_phase_id)))
          WHERE (cpt.construction_task_id = ct.id)
          ORDER BY cpt.created_at DESC
         LIMIT 1) ph ON (true))
  WHERE (ct.is_deleted = false);
```

### `construction.labor_insurance_view` (🔓 INVOKER)

```sql
SELECT li.id,
    li.organization_id,
    li.project_id,
    li.labor_id,
    pl.contact_id,
    li.insurance_type,
    li.policy_number,
    li.provider,
    li.coverage_start,
    li.coverage_end,
    li.reminder_days,
    li.certificate_attachment_id,
    li.notes,
    li.created_by,
    li.created_at,
    li.updated_at,
    (li.coverage_end - CURRENT_DATE) AS days_to_expiry,
        CASE
            WHEN (CURRENT_DATE > li.coverage_end) THEN 'vencido'::text
            WHEN ((li.coverage_end - CURRENT_DATE) <= 30) THEN 'por_vencer'::text
            ELSE 'vigente'::text
        END AS status,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    COALESCE(ct.display_name_override, ct.full_name, concat(ct.first_name, ' ', ct.last_name)) AS contact_display_name,
    lt.name AS labor_type_name,
    proj.name AS project_name
   FROM ((((construction.labor_insurances li
     LEFT JOIN projects.project_labor pl ON ((pl.id = li.labor_id)))
     LEFT JOIN contacts.contacts ct ON ((ct.id = pl.contact_id)))
     LEFT JOIN catalog.labor_categories lt ON ((lt.id = pl.labor_type_id)))
     LEFT JOIN projects.projects proj ON ((proj.id = li.project_id)));
```

### `construction.project_material_requirements_view` (🔓 INVOKER)

```sql
SELECT ctms.project_id,
    p.name AS project_name,
    ctms.organization_id,
    ctms.material_id,
    m.name AS material_name,
    u.name AS unit_name,
    m.category_id,
    mc.name AS category_name,
    (sum(ctms.quantity_planned))::numeric(20,4) AS total_required,
    count(DISTINCT ctms.construction_task_id) AS task_count,
    array_agg(DISTINCT ctms.construction_task_id) AS construction_task_ids,
    (COALESCE(ordered.total_ordered, (0)::numeric))::numeric(20,4) AS total_ordered,
    (GREATEST(((sum(ctms.quantity_planned))::numeric(20,4) - COALESCE(ordered.total_ordered, (0)::numeric)), (0)::numeric))::numeric(20,4) AS total_pending,
        CASE
            WHEN (COALESCE(ordered.total_ordered, (0)::numeric) = (0)::numeric) THEN 'none'::text
            WHEN (COALESCE(ordered.total_ordered, (0)::numeric) >= (sum(ctms.quantity_planned))::numeric(20,4)) THEN 'covered'::text
            ELSE 'partial'::text
        END AS coverage_status
   FROM ((((((construction.construction_task_material_snapshots ctms
     JOIN construction.construction_tasks ct ON ((ct.id = ctms.construction_task_id)))
     JOIN projects.projects p ON ((p.id = ctms.project_id)))
     JOIN catalog.materials m ON ((m.id = ctms.material_id)))
     LEFT JOIN catalog.units u ON ((u.id = m.unit_id)))
     LEFT JOIN catalog.material_categories mc ON ((mc.id = m.category_id)))
     LEFT JOIN LATERAL ( SELECT COALESCE(sum(poi.quantity), (0)::numeric) AS total_ordered
           FROM (finance.material_purchase_order_items poi
             JOIN finance.material_purchase_orders po ON ((po.id = poi.purchase_order_id)))
          WHERE ((poi.material_id = ctms.material_id) AND (poi.project_id = ctms.project_id) AND (po.is_deleted = false) AND (po.status <> 'rejected'::text))) ordered ON (true))
  WHERE ((ct.is_deleted = false) AND (ct.status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'paused'::text])))
  GROUP BY ctms.project_id, p.name, ctms.organization_id, ctms.material_id, m.name, u.name, m.category_id, mc.name, ordered.total_ordered;
```
