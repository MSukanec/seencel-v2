# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONSTRUCTION] Views (5)

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

### `construction.contract_summary_view` (🔓 INVOKER)

```sql
SELECT c.id,
    c.name,
    c.project_id,
    c.organization_id,
    c.client_id,
    c.status,
    c.currency_id,
    c.original_contract_value,
    c.created_at,
    c.updated_at,
    COALESCE(co_stats.total_cos, (0)::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, (0)::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, (0)::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, (0)::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, (0)::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, (0)::numeric) + COALESCE(co_stats.approved_changes_value, (0)::numeric)) + COALESCE(co_stats.pending_changes_value, (0)::numeric)) AS potential_contract_value
   FROM (finance.quotes c
     LEFT JOIN ( SELECT co.parent_quote_id,
            count(*) AS total_cos,
            count(*) FILTER (WHERE (co.status = 'approved'::text)) AS approved_cos,
            count(*) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))) AS pending_cos,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = 'approved'::text)), (0)::numeric) AS approved_changes_value,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE (co.status = ANY (ARRAY['draft'::text, 'sent'::text]))), (0)::numeric) AS pending_changes_value
           FROM (finance.quotes co
             JOIN construction.quotes_view qv ON ((qv.id = co.id)))
          WHERE ((co.quote_type = 'change_order'::text) AND (co.is_deleted = false))
          GROUP BY co.parent_quote_id) co_stats ON ((co_stats.parent_quote_id = c.id)))
  WHERE ((c.quote_type = 'contract'::text) AND (c.is_deleted = false));
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
    ctms.organization_id,
    ctms.material_id,
    m.name AS material_name,
    u.name AS unit_name,
    m.category_id,
    mc.name AS category_name,
    (sum(ctms.quantity_planned))::numeric(20,4) AS total_required,
    count(DISTINCT ctms.construction_task_id) AS task_count,
    array_agg(DISTINCT ctms.construction_task_id) AS construction_task_ids
   FROM ((((construction.construction_task_material_snapshots ctms
     JOIN construction.construction_tasks ct ON ((ct.id = ctms.construction_task_id)))
     JOIN catalog.materials m ON ((m.id = ctms.material_id)))
     LEFT JOIN catalog.units u ON ((u.id = m.unit_id)))
     LEFT JOIN catalog.material_categories mc ON ((mc.id = m.category_id)))
  WHERE ((ct.is_deleted = false) AND (ct.status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'paused'::text])))
  GROUP BY ctms.project_id, ctms.organization_id, ctms.material_id, m.name, u.name, m.category_id, mc.name;
```

### `construction.quotes_view` (🔓 INVOKER)

```sql
SELECT q.id,
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
    q.updated_by,
    q.parent_quote_id,
    q.original_contract_value,
    q.change_order_number,
    c.name AS currency_name,
    c.symbol AS currency_symbol,
    p.name AS project_name,
    concat_ws(' '::text, cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, (0)::bigint) AS item_count,
    COALESCE(stats.subtotal, (0)::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, (0)::numeric) AS subtotal_with_markup,
    round((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))), 2) AS total_after_discount,
    round(((COALESCE(stats.subtotal_with_markup, (0)::numeric) * ((1)::numeric - (COALESCE(q.discount_pct, (0)::numeric) / 100.0))) * ((1)::numeric + (COALESCE(q.tax_pct, (0)::numeric) / 100.0))), 2) AS total_with_tax
   FROM (((((finance.quotes q
     LEFT JOIN finance.currencies c ON ((q.currency_id = c.id)))
     LEFT JOIN projects.projects p ON ((q.project_id = p.id)))
     LEFT JOIN contacts.contacts cl ON ((q.client_id = cl.id)))
     LEFT JOIN finance.quotes parent ON ((q.parent_quote_id = parent.id)))
     LEFT JOIN ( SELECT qi.quote_id,
            count(*) AS item_count,
            sum((qi.quantity * qi.unit_price)) AS subtotal,
            sum(((qi.quantity * qi.unit_price) * ((1)::numeric + (COALESCE(qi.markup_pct, (0)::numeric) / 100.0)))) AS subtotal_with_markup
           FROM finance.quote_items qi
          WHERE (qi.is_deleted = false)
          GROUP BY qi.quote_id) stats ON ((q.id = stats.quote_id)))
  WHERE (q.is_deleted = false);
```
