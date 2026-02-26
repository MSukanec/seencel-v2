# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CATALOG] Views (6)

### `catalog.labor_view` (🔓 INVOKER)

```sql
SELECT lt.id AS labor_id,
    lt.name AS labor_name,
    lt.description AS labor_description,
    lt.unit_id,
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    lpc.organization_id,
    lpc.unit_price AS current_price,
    lpc.currency_id AS current_currency_id,
    c.code AS current_currency_code,
    c.symbol AS current_currency_symbol,
    lpc.valid_from,
    lpc.valid_to,
    lpc.updated_at,
    lap.avg_price,
    lap.price_count,
    lap.min_price,
    lap.max_price
   FROM ((((catalog.labor_types lt
     LEFT JOIN catalog.units u ON ((u.id = lt.unit_id)))
     LEFT JOIN ( SELECT DISTINCT ON (lp.labor_type_id, lp.organization_id) lp.labor_type_id AS labor_id,
            lp.organization_id,
            lp.currency_id,
            lp.unit_price,
            lp.valid_from,
            lp.valid_to,
            lp.updated_at
           FROM catalog.labor_prices lp
          WHERE ((lp.valid_to IS NULL) OR (lp.valid_to >= CURRENT_DATE))
          ORDER BY lp.labor_type_id, lp.organization_id, lp.valid_from DESC) lpc ON ((lpc.labor_id = lt.id)))
     LEFT JOIN finance.currencies c ON ((c.id = lpc.currency_id)))
     LEFT JOIN catalog.labor_avg_prices lap ON ((lap.labor_id = lt.id)));
```

### `catalog.materials_view` (🔓 INVOKER)

```sql
SELECT m.id,
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
    u.name AS unit_of_computation,
    u.symbol AS unit_symbol,
    m.category_id,
    mc.name AS category_name,
    m.default_provider_id,
    m.default_sale_unit_id,
    m.default_sale_unit_quantity,
    su.name AS sale_unit_name,
    su.symbol AS sale_unit_symbol,
    mp.unit_price AS org_unit_price,
    mp.currency_id AS org_price_currency_id,
    mp.valid_from AS org_price_valid_from
   FROM ((((catalog.materials m
     LEFT JOIN catalog.units u ON ((m.unit_id = u.id)))
     LEFT JOIN catalog.material_categories mc ON ((m.category_id = mc.id)))
     LEFT JOIN catalog.units su ON ((m.default_sale_unit_id = su.id)))
     LEFT JOIN LATERAL ( SELECT mp_inner.unit_price,
            mp_inner.currency_id,
            mp_inner.valid_from
           FROM catalog.material_prices mp_inner
          WHERE ((mp_inner.material_id = m.id) AND (mp_inner.organization_id = m.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
          ORDER BY mp_inner.valid_from DESC
         LIMIT 1) mp ON (true))
  WHERE (m.is_deleted = false);
```

### `catalog.organization_task_prices_view` (🔓 INVOKER)

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
   FROM (((catalog.organization_task_prices p
     LEFT JOIN catalog.tasks t ON ((t.id = p.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)));
```

### `catalog.task_costs_view` (🔓 INVOKER)

```sql
WITH recipe_material_costs AS (
         SELECT trm.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost,
            min(mp.valid_from) AS oldest_mat_price_date
           FROM (((catalog.task_recipe_materials trm
             JOIN catalog.task_recipes tr ON (((tr.id = trm.recipe_id) AND (tr.is_deleted = false))))
             LEFT JOIN catalog.materials mat ON ((mat.id = trm.material_id)))
             LEFT JOIN LATERAL ( SELECT mp_inner.unit_price,
                    mp_inner.valid_from
                   FROM catalog.material_prices mp_inner
                  WHERE ((mp_inner.material_id = trm.material_id) AND (mp_inner.organization_id = tr.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY mp_inner.valid_from DESC
                 LIMIT 1) mp ON (true))
          WHERE (trm.is_deleted = false)
          GROUP BY trm.recipe_id, tr.task_id, tr.organization_id
        ), recipe_labor_costs AS (
         SELECT trl.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost,
            min(lp.valid_from) AS oldest_lab_price_date
           FROM ((catalog.task_recipe_labor trl
             JOIN catalog.task_recipes tr ON (((tr.id = trl.recipe_id) AND (tr.is_deleted = false))))
             LEFT JOIN LATERAL ( SELECT lp_inner.unit_price,
                    lp_inner.valid_from
                   FROM catalog.labor_prices lp_inner
                  WHERE ((lp_inner.labor_type_id = trl.labor_type_id) AND (lp_inner.organization_id = tr.organization_id) AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY lp_inner.valid_from DESC
                 LIMIT 1) lp ON (true))
          WHERE (trl.is_deleted = false)
          GROUP BY trl.recipe_id, tr.task_id, tr.organization_id
        ), recipe_ext_service_costs AS (
         SELECT tres.recipe_id,
            tr.task_id,
            tr.organization_id,
            sum(tres.unit_price) AS ext_cost
           FROM (catalog.task_recipe_external_services tres
             JOIN catalog.task_recipes tr ON (((tr.id = tres.recipe_id) AND (tr.is_deleted = false))))
          WHERE (tres.is_deleted = false)
          GROUP BY tres.recipe_id, tr.task_id, tr.organization_id
        ), recipe_totals AS (
         SELECT tr.id AS recipe_id,
            tr.task_id,
            tr.organization_id,
            COALESCE(rmc.mat_cost, (0)::numeric) AS mat_cost,
            COALESCE(rlc.lab_cost, (0)::numeric) AS lab_cost,
            COALESCE(rec.ext_cost, (0)::numeric) AS ext_cost,
            ((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)) AS total_cost,
            LEAST(rmc.oldest_mat_price_date, rlc.oldest_lab_price_date) AS oldest_price_date
           FROM (((catalog.task_recipes tr
             LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
             LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
             LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
          WHERE (tr.is_deleted = false)
        )
 SELECT rt.task_id,
    rt.organization_id,
    (round(avg(rt.total_cost), 2))::numeric(14,4) AS unit_cost,
    (round(avg(rt.mat_cost), 2))::numeric(14,4) AS mat_unit_cost,
    (round(avg(rt.lab_cost), 2))::numeric(14,4) AS lab_unit_cost,
    (round(avg(rt.ext_cost), 2))::numeric(14,4) AS ext_unit_cost,
    (count(rt.recipe_id))::integer AS recipe_count,
    (round(min(rt.total_cost), 2))::numeric(14,4) AS min_cost,
    (round(max(rt.total_cost), 2))::numeric(14,4) AS max_cost,
    min(rt.oldest_price_date) AS oldest_price_date
   FROM recipe_totals rt
  GROUP BY rt.task_id, rt.organization_id;
```

### `catalog.task_recipes_view` (🔐 DEFINER)

```sql
WITH recipe_material_costs AS (
         SELECT trm.recipe_id,
            sum(((trm.total_quantity * COALESCE(mp.unit_price, (0)::numeric)) / GREATEST(COALESCE(mat.default_sale_unit_quantity, (1)::numeric), (1)::numeric))) AS mat_cost
           FROM (((catalog.task_recipe_materials trm
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = trm.recipe_id) AND (tr_1.is_deleted = false))))
             LEFT JOIN catalog.materials mat ON ((mat.id = trm.material_id)))
             LEFT JOIN LATERAL ( SELECT mp_inner.unit_price
                   FROM catalog.material_prices mp_inner
                  WHERE ((mp_inner.material_id = trm.material_id) AND (mp_inner.organization_id = tr_1.organization_id) AND (mp_inner.valid_from <= CURRENT_DATE) AND ((mp_inner.valid_to IS NULL) OR (mp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY mp_inner.valid_from DESC
                 LIMIT 1) mp ON (true))
          WHERE (trm.is_deleted = false)
          GROUP BY trm.recipe_id
        ), recipe_labor_costs AS (
         SELECT trl.recipe_id,
            sum((trl.quantity * COALESCE(lp.unit_price, (0)::numeric))) AS lab_cost
           FROM ((catalog.task_recipe_labor trl
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = trl.recipe_id) AND (tr_1.is_deleted = false))))
             LEFT JOIN LATERAL ( SELECT lp_inner.unit_price
                   FROM catalog.labor_prices lp_inner
                  WHERE ((lp_inner.labor_type_id = trl.labor_type_id) AND (lp_inner.organization_id = tr_1.organization_id) AND ((lp_inner.valid_to IS NULL) OR (lp_inner.valid_to >= CURRENT_DATE)))
                  ORDER BY lp_inner.valid_from DESC
                 LIMIT 1) lp ON (true))
          WHERE (trl.is_deleted = false)
          GROUP BY trl.recipe_id
        ), recipe_ext_service_costs AS (
         SELECT tres.recipe_id,
            sum(tres.unit_price) AS ext_cost
           FROM (catalog.task_recipe_external_services tres
             JOIN catalog.task_recipes tr_1 ON (((tr_1.id = tres.recipe_id) AND (tr_1.is_deleted = false))))
          WHERE (tres.is_deleted = false)
          GROUP BY tres.recipe_id
        )
 SELECT tr.id,
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
    tr.status,
    t.name AS task_name,
    t.custom_name AS task_custom_name,
    COALESCE(t.custom_name, t.name) AS task_display_name,
    td.name AS division_name,
    u.name AS unit_name,
    o.name AS org_name,
    (( SELECT count(*) AS count
           FROM catalog.task_recipe_materials trm
          WHERE ((trm.recipe_id = tr.id) AND (trm.is_deleted = false))) + ( SELECT count(*) AS count
           FROM catalog.task_recipe_labor trl
          WHERE ((trl.recipe_id = tr.id) AND (trl.is_deleted = false)))) AS item_count,
    (COALESCE(rmc.mat_cost, (0)::numeric))::numeric(14,2) AS mat_cost,
    (COALESCE(rlc.lab_cost, (0)::numeric))::numeric(14,2) AS lab_cost,
    (COALESCE(rec.ext_cost, (0)::numeric))::numeric(14,2) AS ext_cost,
    (((COALESCE(rmc.mat_cost, (0)::numeric) + COALESCE(rlc.lab_cost, (0)::numeric)) + COALESCE(rec.ext_cost, (0)::numeric)))::numeric(14,2) AS total_cost
   FROM (((((((catalog.task_recipes tr
     LEFT JOIN catalog.tasks t ON ((t.id = tr.task_id)))
     LEFT JOIN catalog.task_divisions td ON ((td.id = t.task_division_id)))
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN iam.organizations o ON ((o.id = tr.organization_id)))
     LEFT JOIN recipe_material_costs rmc ON ((rmc.recipe_id = tr.id)))
     LEFT JOIN recipe_labor_costs rlc ON ((rlc.recipe_id = tr.id)))
     LEFT JOIN recipe_ext_service_costs rec ON ((rec.recipe_id = tr.id)))
  WHERE (tr.is_deleted = false);
```

### `catalog.tasks_view` (🔓 INVOKER)

```sql
SELECT t.id,
    t.code,
    t.name,
    t.custom_name,
    t.description,
    t.is_system,
    t.is_published,
    t.status,
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
    u.name AS unit_name,
    u.symbol AS unit_symbol,
    d.name AS division_name,
    ta.name AS action_name,
    ta.short_code AS action_short_code,
    te.name AS element_name
   FROM ((((catalog.tasks t
     LEFT JOIN catalog.units u ON ((u.id = t.unit_id)))
     LEFT JOIN catalog.task_divisions d ON ((d.id = t.task_division_id)))
     LEFT JOIN catalog.task_actions ta ON ((ta.id = t.task_action_id)))
     LEFT JOIN catalog.task_elements te ON ((te.id = t.task_element_id)));
```
