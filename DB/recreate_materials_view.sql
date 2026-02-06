-- ============================================================================
-- Vista MATERIALS_VIEW
-- Combina materiales con sus relaciones: unidades, categorías y precios
-- ============================================================================

CREATE OR REPLACE VIEW public.materials_view AS
SELECT 
    -- Material base fields
    m.id,
    m.name,
    m.code,
    m.description,
    m.material_type,
    m.is_system,
    m.organization_id,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    
    -- Unit fields (for base measurement unit)
    m.unit_id,
    u.name AS unit_of_computation,
    u.symbol AS unit_symbol,
    
    -- Category fields
    m.category_id,
    mc.name AS category_name,
    
    -- Provider fields
    m.default_provider_id,
    
    -- Sale unit fields (for packaging/presentation)
    m.default_sale_unit_id,
    m.default_sale_unit_quantity,
    su.name AS sale_unit_name,
    su.symbol AS sale_unit_symbol,
    
    -- Current price (most recent for this org)
    mp.unit_price AS org_unit_price,
    mp.currency_id AS org_price_currency_id,
    mp.valid_from AS org_price_valid_from

FROM public.materials m

-- Join base unit
LEFT JOIN public.units u 
    ON m.unit_id = u.id

-- Join category
LEFT JOIN public.material_categories mc 
    ON m.category_id = mc.id

-- Join sale unit
LEFT JOIN public.units su 
    ON m.default_sale_unit_id = su.id

-- Join current price (get the most recent valid price)
LEFT JOIN LATERAL (
    SELECT 
        mp_inner.unit_price,
        mp_inner.currency_id,
        mp_inner.valid_from
    FROM public.material_prices mp_inner
    WHERE mp_inner.material_id = m.id
      AND mp_inner.organization_id = m.organization_id
      AND mp_inner.valid_from <= CURRENT_DATE
      AND (mp_inner.valid_to IS NULL OR mp_inner.valid_to >= CURRENT_DATE)
    ORDER BY mp_inner.valid_from DESC
    LIMIT 1
) mp ON true

WHERE m.is_deleted = false;

-- Grant access
GRANT SELECT ON public.materials_view TO authenticated;
GRANT SELECT ON public.materials_view TO anon;

COMMENT ON VIEW public.materials_view IS 'Vista de materiales con joins a unidades, categorías y precio actual';
