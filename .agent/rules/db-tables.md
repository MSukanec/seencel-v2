---
name: Seencel DB Table Standard
description: Checklist OBLIGATORIO de columnas, RLS, auditoría y soft delete que TODA tabla nueva debe cumplir.
---

# Estándar de Tablas de Base de Datos

Esta regla define los elementos **OBLIGATORIOS** que toda tabla nueva debe incluir antes de considerarse completa.

> 📖 **ANTES de crear o modificar tablas**, consultar `DB/SCHEMA.md` para verificar el estado real de la base de datos (columnas, FKs, triggers, RLS, índices). Se genera con `npm run db:schema`.

---

## 1. Columnas Obligatorias (🚨 TODA TABLA)

Toda tabla con `organization_id` **DEBE** incluir estas columnas:

```sql
-- Timestamps
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now(),

-- Soft Delete (NUNCA usar DELETE real)
is_deleted boolean NOT NULL DEFAULT false,
deleted_at timestamptz NULL,

-- Auditoría (quién creó/modificó)
created_by uuid NULL REFERENCES organization_members(id) ON DELETE SET NULL,
updated_by uuid NULL REFERENCES organization_members(id) ON DELETE SET NULL,

-- Import (para importación masiva)
import_batch_id uuid NULL REFERENCES import_batches(id) ON DELETE SET NULL,
```

> [!CAUTION]
> `created_by` y `updated_by` SIEMPRE referencian a `organization_members(id)`, NUNCA a `users(id)`.
> SIEMPRE con `ON DELETE SET NULL`.

---

## 2. Soft Delete (🚨 OBLIGATORIO)

**NUNCA usar `DELETE` real.** Siempre marcar como eliminado:

```sql
-- En el código (actions.ts):
UPDATE tabla SET is_deleted = true, deleted_at = now() WHERE id = $1;

-- NUNCA hacer:
DELETE FROM tabla WHERE id = $1;
```

### Consecuencias del Soft Delete

| Elemento | Impacto |
|----------|---------|
| **Queries SELECT** | Agregar `.eq("is_deleted", false)` |
| **Índices** | Usar parciales: `WHERE (is_deleted = false)` |
| **Vistas** | Filtrar `WHERE is_deleted = false` |
| **RLS** | NO crear policy DELETE (se usa UPDATE) |
| **Actions delete** | Usar `.update({ is_deleted: true, deleted_at: new Date().toISOString() })` |

---

## 3. RLS (🚨 OBLIGATORIO)

> Referencia completa: Skill **"Políticas RLS y Auditoría Supabase"**

Toda tabla con `organization_id` necesita **exactamente 3 políticas** (NO DELETE):

```sql
ALTER TABLE public.{tabla} ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "MIEMBROS VEN {TABLA}"
    ON public.{tabla} FOR SELECT TO public
    USING (can_view_org(organization_id, '{permiso}.view'::text));

-- INSERT
CREATE POLICY "MIEMBROS CREAN {TABLA}"
    ON public.{tabla} FOR INSERT TO public
    WITH CHECK (can_mutate_org(organization_id, '{permiso}.manage'::text));

-- UPDATE (incluye soft delete)
CREATE POLICY "MIEMBROS EDITAN {TABLA}"
    ON public.{tabla} FOR UPDATE TO public
    USING (can_mutate_org(organization_id, '{permiso}.manage'::text));
```

### Permisos para tablas hijas

Las tablas hijas heredan el permiso del padre. Ejemplo:

| Tabla Hija | Permiso Heredado |
|------------|------------------|
| `task_recipe_materials` | `projects.view/manage` |
| `task_recipe_labor` | `projects.view/manage` |
| `project_clients` | `projects.view/manage` |

---

## 4. Triggers Obligatorios (🚨 TODA TABLA)

### 4.1 Trigger `set_timestamp` (updated_at)

```sql
CREATE TRIGGER {tabla}_set_updated_at
    BEFORE UPDATE ON public.{tabla}
    FOR EACH ROW EXECUTE FUNCTION set_timestamp();
```

### 4.2 Trigger `handle_updated_by` (created_by / updated_by)

```sql
CREATE TRIGGER set_updated_by_{tabla}
    BEFORE INSERT OR UPDATE ON public.{tabla}
    FOR EACH ROW EXECUTE FUNCTION handle_updated_by();
```

---

## 5. Audit Log (🚨 OBLIGATORIO)

> Referencia completa: Skill **"Políticas RLS y Auditoría Supabase"** → PARTE 2

Toda tabla necesita:
1. Una **función** de audit log con `SECURITY DEFINER` y `EXCEPTION WHEN OTHERS`
2. Un **trigger** `AFTER INSERT OR UPDATE OR DELETE`

```sql
CREATE OR REPLACE FUNCTION public.log_{entidad}_activity()
RETURNS TRIGGER AS $$
DECLARE
    resolved_member_id uuid;
    audit_action text;
    audit_metadata jsonb;
    target_record RECORD;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_record := OLD;
        audit_action := 'delete_{entidad}';
        resolved_member_id := OLD.updated_by;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_record := NEW;
        IF (OLD.is_deleted = false AND NEW.is_deleted = true) THEN
            audit_action := 'delete_{entidad}';
        ELSE
            audit_action := 'update_{entidad}';
        END IF;
        resolved_member_id := NEW.updated_by;
    ELSIF (TG_OP = 'INSERT') THEN
        target_record := NEW;
        audit_action := 'create_{entidad}';
        resolved_member_id := NEW.created_by;
    END IF;

    audit_metadata := jsonb_build_object('key_field', target_record.some_field);

    BEGIN
        INSERT INTO public.organization_activity_logs (
            organization_id, member_id, action, target_id, target_table, metadata
        ) VALUES (
            target_record.organization_id, resolved_member_id,
            audit_action, target_record.id, '{tabla}', audit_metadata
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_{entidad}_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.{tabla}
    FOR EACH ROW EXECUTE FUNCTION public.log_{entidad}_activity();
```

---

## 6. Índices (🚨 OBLIGATORIO)

Todos los índices deben ser **parciales** con `WHERE (is_deleted = false)`:

```sql
CREATE INDEX idx_{tabla}_{columna}
    ON public.{tabla} USING btree ({columna})
    WHERE (is_deleted = false);
```

Excepción: `import_batch_id` usa `WHERE (import_batch_id IS NOT NULL)`:

```sql
CREATE INDEX idx_{tabla}_import_batch_id
    ON public.{tabla} USING btree (import_batch_id)
    WHERE (import_batch_id IS NOT NULL);
```

---

## 7. Impacto en Frontend (actions.ts)

### SELECT — filtrar soft-deleted

```ts
const { data } = await supabase
    .from("mi_tabla")
    .select("*")
    .eq("is_deleted", false)  // 🚨 SIEMPRE
    .order("created_at", { ascending: false });
```

### DELETE — usar soft delete

```ts
// ✅ CORRECTO: soft delete
const { error } = await supabase
    .from("mi_tabla")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", itemId);

// ❌ INCORRECTO: delete real
const { error } = await supabase
    .from("mi_tabla")
    .delete()
    .eq("id", itemId);
```

---

## Checklist de Nueva Tabla

Antes de considerar una tabla completa:

- [ ] ¿Tiene `is_deleted` + `deleted_at`?
- [ ] ¿Tiene `created_by` + `updated_by` con `ON DELETE SET NULL`?
- [ ] ¿Tiene `import_batch_id` con `ON DELETE SET NULL`?
- [ ] ¿Tiene `created_at` + `updated_at`?
- [ ] ¿RLS habilitada con 3 políticas (VEN, CREAN, EDITAN)?
- [ ] ¿Trigger `set_timestamp` para `updated_at`?
- [ ] ¿Trigger `handle_updated_by` para `created_by`/`updated_by`?
- [ ] ¿Función + trigger de audit log con `SECURITY DEFINER`?
- [ ] ¿Índices parciales con `WHERE (is_deleted = false)`?
- [ ] ¿Actions usan `.eq("is_deleted", false)` en SELECT?
- [ ] ¿Actions usan soft delete en vez de `.delete()`?

---

## Violaciones Comunes

| ❌ Violación | ✅ Solución |
|-------------|------------|
| Tabla sin `is_deleted` | Agregar columna + `deleted_at` |
| `.delete()` en actions | `.update({ is_deleted: true, deleted_at: ... })` |
| Índices sin `WHERE` | Recrear como parciales |
| Sin `created_by`/`updated_by` | Agregar con FK a `organization_members` |
| Sin trigger de audit | Crear función + trigger `SECURITY DEFINER` |
| Sin `import_batch_id` | Agregar columna con FK a `import_batches` |
| SELECT sin `is_deleted = false` | Agregar filtro a todos los queries |
