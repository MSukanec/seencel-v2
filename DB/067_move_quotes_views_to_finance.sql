-- ============================================================
-- 067: Mover quotes_view y contract_summary_view a finance schema
-- ============================================================
-- Estas vistas estaban en construction pero pertenecen a finance
-- ya que operan sobre finance.quotes, finance.quote_items, finance.currencies
-- ============================================================

-- 1. Eliminar las vistas del schema construction (orden importa: contract_summary_view depende de quotes_view)
DROP VIEW IF EXISTS construction.contract_summary_view;
DROP VIEW IF EXISTS construction.quotes_view;

-- 2. Recrear quotes_view en finance schema
CREATE OR REPLACE VIEW finance.quotes_view
WITH (security_invoker = true)
AS
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
    COALESCE(stats.item_count, 0::bigint) AS item_count,
    COALESCE(stats.subtotal, 0::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, 0::numeric) AS subtotal_with_markup,
    round((COALESCE(stats.subtotal_with_markup, 0::numeric) * (1::numeric - (COALESCE(q.discount_pct, 0::numeric) / 100.0))), 2) AS total_after_discount,
    round(((COALESCE(stats.subtotal_with_markup, 0::numeric) * (1::numeric - (COALESCE(q.discount_pct, 0::numeric) / 100.0))) * (1::numeric + (COALESCE(q.tax_pct, 0::numeric) / 100.0))), 2) AS total_with_tax
   FROM (((((finance.quotes q
     LEFT JOIN finance.currencies c ON q.currency_id = c.id)
     LEFT JOIN projects.projects p ON q.project_id = p.id)
     LEFT JOIN contacts.contacts cl ON q.client_id = cl.id)
     LEFT JOIN finance.quotes parent ON q.parent_quote_id = parent.id)
     LEFT JOIN ( SELECT qi.quote_id,
            count(*) AS item_count,
            sum(qi.quantity * qi.unit_price) AS subtotal,
            sum((qi.quantity * qi.unit_price) * (1::numeric + (COALESCE(qi.markup_pct, 0::numeric) / 100.0))) AS subtotal_with_markup
           FROM finance.quote_items qi
          WHERE qi.is_deleted = false
          GROUP BY qi.quote_id) stats ON q.id = stats.quote_id)
  WHERE q.is_deleted = false;

-- 3. Recrear contract_summary_view en finance schema (referencia a finance.quotes_view ahora)
CREATE OR REPLACE VIEW finance.contract_summary_view
WITH (security_invoker = true)
AS
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
    COALESCE(co_stats.total_cos, 0::bigint) AS change_order_count,
    COALESCE(co_stats.approved_cos, 0::bigint) AS approved_change_order_count,
    COALESCE(co_stats.pending_cos, 0::bigint) AS pending_change_order_count,
    COALESCE(co_stats.approved_changes_value, 0::numeric) AS approved_changes_value,
    COALESCE(co_stats.pending_changes_value, 0::numeric) AS pending_changes_value,
    (COALESCE(c.original_contract_value, 0::numeric) + COALESCE(co_stats.approved_changes_value, 0::numeric)) AS revised_contract_value,
    ((COALESCE(c.original_contract_value, 0::numeric) + COALESCE(co_stats.approved_changes_value, 0::numeric)) + COALESCE(co_stats.pending_changes_value, 0::numeric)) AS potential_contract_value
   FROM (finance.quotes c
     LEFT JOIN ( SELECT co.parent_quote_id,
            count(*) AS total_cos,
            count(*) FILTER (WHERE co.status = 'approved') AS approved_cos,
            count(*) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])) AS pending_cos,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = 'approved'), 0::numeric) AS approved_changes_value,
            COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])), 0::numeric) AS pending_changes_value
           FROM (finance.quotes co
             JOIN finance.quotes_view qv ON qv.id = co.id)
          WHERE co.quote_type = 'change_order' AND co.is_deleted = false
          GROUP BY co.parent_quote_id) co_stats ON co_stats.parent_quote_id = c.id)
  WHERE c.quote_type = 'contract' AND c.is_deleted = false;

-- 4. También actualizar construction.construction_tasks_view que referencia finance.quotes_view
-- (Esta ya referencia finance.quotes y finance.quote_items directamente, no usa construction.quotes_view)
-- No requiere cambios.

-- NOTA: Después de ejecutar este script, ejecutar el introspector:
-- node scripts/introspect-db.mjs
