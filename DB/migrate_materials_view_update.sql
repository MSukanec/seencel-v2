-- Drop and recreate materials_view with soft delete filter
-- Date: 2026-02-05

DROP VIEW IF EXISTS public.materials_view;

CREATE VIEW public.materials_view AS
SELECT
  m.id,
  m.name,
  m.code,
  m.description,
  m.category_id,
  mc.name AS category_name,
  m.unit_id,
  u.name AS unit_of_computation,
  u.symbol AS unit_symbol,
  m.default_unit_presentation_id,
  up.name AS default_unit_presentation,
  up.equivalence AS unit_equivalence,
  m.default_provider_id,
  c.full_name AS default_provider_name,
  m.is_system,
  m.is_completed,
  m.material_type,
  m.organization_id,
  m.created_at,
  m.updated_at,
  map.min_price,
  map.max_price,
  map.avg_price,
  map.product_count,
  map.provider_product_count,
  map.price_count,
  mp.unit_price AS org_unit_price,
  mp.currency_id AS org_price_currency_id,
  mp.valid_from AS org_price_valid_from
FROM
  materials m
  LEFT JOIN material_categories mc ON mc.id = m.category_id
  LEFT JOIN units u ON u.id = m.unit_id
  LEFT JOIN unit_presentations up ON up.id = m.default_unit_presentation_id
  LEFT JOIN contacts c ON c.id = m.default_provider_id
  LEFT JOIN material_avg_prices map ON map.material_id = m.id
  LEFT JOIN LATERAL (
    SELECT
      material_prices.unit_price,
      material_prices.currency_id,
      material_prices.valid_from
    FROM
      material_prices
    WHERE
      material_prices.material_id = m.id
      AND material_prices.organization_id = m.organization_id
      AND (
        material_prices.valid_to IS NULL
        OR material_prices.valid_to >= CURRENT_DATE
      )
      AND material_prices.valid_from <= CURRENT_DATE
    ORDER BY
      material_prices.valid_from DESC
    LIMIT 1
  ) mp ON TRUE
WHERE
  m.is_deleted = false;
