# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [PROVIDERS] Functions (chunk 1: refresh_product_avg_prices — refresh_product_avg_prices)

### `providers.refresh_product_avg_prices()` 🔐

- **Returns**: void
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION providers.refresh_product_avg_prices()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'providers', 'public'
AS $function$refresh materialized view concurrently public.product_avg_prices;$function$
```
</details>
