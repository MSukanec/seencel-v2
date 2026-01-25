-- Create a view to aggregate Subcontract details with Payment KPIs
-- It calculates Paid Amount and Remaining Amount in the Subcontract's Currency relying on Functional Amounts normalization.

CREATE OR REPLACE VIEW subcontracts_view AS
SELECT
    s.id,
    s.organization_id,
    s.project_id,
    s.title,
    s.amount_total,
    s.currency_id,
    c.code AS currency_code,
    c.symbol AS currency_symbol,
    s.date,
    s.status,
    s.notes,
    
    -- Provider Details
    ct.id AS provider_id,
    COALESCE(ct.full_name, ct.company_name) AS provider_name,
    ct.image_url AS provider_image,
    
    -- Financials (Functional)
    COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0) AS paid_amount_functional,
    
    -- Financials (Contract Currency)
    -- Formula: Paid (Contract) = Paid (Functional) / Exchange Rate (Contract)
    ROUND(
        (
            CASE 
                WHEN s.exchange_rate IS NOT NULL AND s.exchange_rate > 0 
                THEN COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0) / s.exchange_rate
                ELSE COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0)
            END
        ), 2
    ) AS paid_amount,

    ROUND(
        (
            s.amount_total - (
                CASE 
                    WHEN s.exchange_rate IS NOT NULL AND s.exchange_rate > 0 
                    THEN COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0) / s.exchange_rate
                    ELSE COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0)
                END
            )
        ), 2
    ) AS remaining_amount,

    -- Progress %
    ROUND(
        CASE
            WHEN s.amount_total > 0 THEN
                (
                    (
                        CASE 
                            WHEN s.exchange_rate IS NOT NULL AND s.exchange_rate > 0 
                            THEN COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0) / s.exchange_rate
                            ELSE COALESCE(SUM(sp.functional_amount) FILTER (WHERE sp.status = 'confirmed' AND sp.is_deleted = false), 0)
                        END
                    ) / s.amount_total
                ) * 100
            ELSE 0
        END, 2
    ) AS progress_percentage,

    s.created_at,
    s.updated_at,
    s.is_deleted

FROM subcontracts s
LEFT JOIN contacts ct ON s.contact_id = ct.id
LEFT JOIN currencies c ON s.currency_id = c.id
LEFT JOIN subcontract_payments sp ON s.id = sp.subcontract_id
WHERE s.is_deleted = false
GROUP BY s.id, c.id, ct.id;
