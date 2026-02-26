-- ============================================================================
-- Script 5: Actualizar quotes_view para usar effective_unit_price
-- Los subtotales ahora usan precios vivos en draft o snapshot en sent/approved
-- ============================================================================

DROP VIEW IF EXISTS finance.quotes_view CASCADE;

CREATE OR REPLACE VIEW finance.quotes_view AS
SELECT
    q.id,
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
    concat_ws(' ', cl.first_name, cl.last_name) AS client_name,
    parent.name AS parent_contract_name,
    COALESCE(stats.item_count, 0::bigint) AS item_count,
    COALESCE(stats.subtotal, 0::numeric) AS subtotal,
    COALESCE(stats.subtotal_with_markup, 0::numeric) AS subtotal_with_markup,
    round(
        COALESCE(stats.subtotal_with_markup, 0::numeric)
        * (1::numeric - COALESCE(q.discount_pct, 0::numeric) / 100.0),
        2
    ) AS total_after_discount,
    round(
        COALESCE(stats.subtotal_with_markup, 0::numeric)
        * (1::numeric - COALESCE(q.discount_pct, 0::numeric) / 100.0)
        * (1::numeric + COALESCE(q.tax_pct, 0::numeric) / 100.0),
        2
    ) AS total_with_tax
FROM finance.quotes q
LEFT JOIN finance.currencies c ON q.currency_id = c.id
LEFT JOIN projects.projects p ON q.project_id = p.id
LEFT JOIN contacts.contacts cl ON q.client_id = cl.id
LEFT JOIN finance.quotes parent ON q.parent_quote_id = parent.id
LEFT JOIN (
    SELECT
        qiv.budget_id AS quote_id,
        count(*) AS item_count,
        sum(qiv.quantity * qiv.effective_unit_price) AS subtotal,
        sum(
            (qiv.quantity * qiv.effective_unit_price)
            * (1::numeric + COALESCE(qiv.markup_pct, 0::numeric) / 100.0)
        ) AS subtotal_with_markup
    FROM finance.quotes_items_view qiv
    GROUP BY qiv.budget_id
) stats ON q.id = stats.quote_id
WHERE q.is_deleted = false;
