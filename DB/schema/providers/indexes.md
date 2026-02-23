# Database Schema (Auto-generated)
> Generated: 2026-02-23T12:14:47.276Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROVIDERS] Indexes (3, excluding PKs)

| Table | Index | Definition |
|-------|-------|------------|
| brands | brands_name_lower_uniq | `CREATE UNIQUE INDEX brands_name_lower_uniq ON providers.brands USING btree (l...` |
| product_avg_prices | product_avg_prices_product_id_idx | `CREATE UNIQUE INDEX product_avg_prices_product_id_idx ON providers.product_av...` |
| provider_products | provider_products_organization_id_product_id_key | `CREATE UNIQUE INDEX provider_products_organization_id_product_id_key ON provi...` |
