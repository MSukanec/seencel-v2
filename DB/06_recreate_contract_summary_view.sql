-- ============================================================================
-- Script 6: Recrear contract_summary_view (borrada por CASCADE del script 05)
-- ============================================================================

CREATE OR REPLACE VIEW finance.contract_summary_view AS
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
FROM finance.quotes c
LEFT JOIN (
    SELECT co.parent_quote_id,
        count(*) AS total_cos,
        count(*) FILTER (WHERE co.status = 'approved') AS approved_cos,
        count(*) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])) AS pending_cos,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = 'approved'), 0::numeric) AS approved_changes_value,
        COALESCE(sum(qv.total_with_tax) FILTER (WHERE co.status = ANY (ARRAY['draft', 'sent'])), 0::numeric) AS pending_changes_value
    FROM finance.quotes co
    JOIN finance.quotes_view qv ON qv.id = co.id
    WHERE co.quote_type = 'change_order' AND co.is_deleted = false
    GROUP BY co.parent_quote_id
) co_stats ON co_stats.parent_quote_id = c.id
WHERE c.quote_type = 'contract' AND c.is_deleted = false;
