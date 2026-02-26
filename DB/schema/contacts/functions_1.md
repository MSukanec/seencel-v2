# Database Schema (Auto-generated)
> Generated: 2026-02-26T15:52:15.290Z
> Source: Supabase PostgreSQL (read-only introspection)
> ⚠️ This file is auto-generated. Do NOT edit manually.

## [CONTACTS] Functions (chunk 1: protect_linked_contact_delete — protect_linked_contact_delete)

### `contacts.protect_linked_contact_delete()` 🔐

- **Returns**: trigger
- **Kind**: function | VOLATILE | SECURITY DEFINER

<details><summary>Source</summary>

```sql
CREATE OR REPLACE FUNCTION contacts.protect_linked_contact_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'contacts', 'projects', 'finance', 'catalog'
AS $function$
begin
  if exists (select 1 from projects.project_clients where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene proyectos asociados como cliente.';
  end if;
  if exists (select 1 from projects.project_labor where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene asignaciones de personal.';
  end if;
  if exists (select 1 from finance.subcontracts where contact_id = old.id and coalesce(is_deleted, false) = false) then
    raise exception 'No se puede eliminar este contacto porque tiene subcontratos asociados.';
  end if;
  if exists (select 1 from finance.subcontract_bids where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene ofertas de subcontratos.';
  end if;
  if exists (select 1 from finance.movements where contact_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene movimientos financieros.';
  end if;
  if exists (select 1 from finance.material_invoices where provider_id = old.id) then
    raise exception 'No se puede eliminar este contacto porque tiene facturas de materiales.';
  end if;
  if exists (select 1 from finance.material_purchase_orders where provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene órdenes de compra.';
  end if;
  if exists (select 1 from catalog.materials where default_provider_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque es proveedor predeterminado de materiales.';
  end if;
  if exists (select 1 from catalog.task_recipe_external_services where contact_id = old.id and is_deleted = false) then
    raise exception 'No se puede eliminar este contacto porque tiene servicios externos asociados.';
  end if;
  return old;
end;
$function$
```
</details>
