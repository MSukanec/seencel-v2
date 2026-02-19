---
description: Crear un nuevo schema PostgreSQL en Supabase y migrar objetos desde public u otro schema existente (tablas, funciones, vistas). Incluye actualización del introspector y del frontend.
---

# Workflow: Crear Nuevo Schema PostgreSQL

Basado en los casos reales del schema `iam` (invitaciones) y `construction` (quotes + tareas de obra).

---

## FASE 1 — Análisis y Decisiones de Diseño

### 1.1 — Definir qué va al nuevo schema

Antes de escribir una sola línea de SQL, responder:

1. **¿Cuál es el dominio?** El schema debe tener un nombre que refleje un dominio de negocio real (ej: `iam`, `construction`, `billing`).
2. **¿Qué tablas pertenecen al dominio?** Revisar `DB/schema/public/tables_*.md` para identificar candidatos.
3. **¿Qué funciones son pura lógica de negocio de este dominio?** Leer `DB/schema/public/functions_*.md`. **NUNCA** mover funciones genéricas como:
   - Funciones `log_*` (activity logging)
   - Funciones `notify_*` (notifications)
   - Funciones de auditoría cross-domain
4. **¿Qué vistas son de solo lectura de este dominio?** Leer `DB/schema/public/views.md`.
5. **¿Hay tablas legacy a descartar?** Identificarlas antes de decidir.

### 1.2 — Elegir estrategia de compatibilidad frontend

**Opción A (Vistas de compatibilidad)**: Crear vistas en `public` que apunten al nuevo schema.
- ✅ Cero cambios en frontend
- ❌ Doble capa que oscurece la arquitectura
- ❌ Las vistas INSERT/UPDATE son complejas (INSTEAD OF triggers)

**Opción B (Schema client directo)** ← **ESTÁNDAR EN SEENCEL**:
- Frontend usa `.schema('nuevo_schema').from('tabla')`
- ✅ Arquitectura limpia y explícita
- ✅ Sin capas intermedias
- ❌ Requiere actualizar los archivos del frontend

**→ Usar siempre Opción B salvo razón técnica muy justificada.**

---

## FASE 2 — Crear el SQL de Migración

### 2.1 — Nombrar el archivo SQL

```
DB/XXX_create_[schema_name]_schema.sql
```

Donde `XXX` es el siguiente número correlativo (ver archivos existentes en `DB/`).

### 2.2 — Estructura del SQL (orden obligatorio)

```sql
-- ==========================================
-- 1. CREAR SCHEMA Y PERMISOS
-- ==========================================
CREATE SCHEMA IF NOT EXISTS [schema_name];

GRANT USAGE ON SCHEMA [schema_name] TO authenticated, service_role, anon;

-- ==========================================
-- 2. MOVER TABLAS (desde public u otro schema)
-- ==========================================
ALTER TABLE public.[tabla1] SET SCHEMA [schema_name];
ALTER TABLE public.[tabla2] SET SCHEMA [schema_name];
-- ... (una por una, en orden de dependencias — FKs primero)

-- Permisos sobre las tablas movidas
GRANT ALL ON ALL TABLES IN SCHEMA [schema_name] TO authenticated, service_role;

-- ==========================================
-- 3. RECREAR FUNCIONES EN EL NUEVO SCHEMA
-- ==========================================
-- ⚠️ NUNCA usar ALTER FUNCTION ... SET SCHEMA para funciones
-- que referencian tablas. SIEMPRE hacer DROP + CREATE con search_path correcto.

CREATE OR REPLACE FUNCTION [schema_name].[nombre_funcion](...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '[schema_name]', 'public'  -- ← CRÍTICO para cross-schema refs
AS $$
BEGIN
  -- Cuerpo de la función (puede referenciar tablas sin prefijo de schema
  -- gracias al search_path)
END;
$$;

-- Eliminar la versión legacy de public
DROP FUNCTION IF EXISTS public.[nombre_funcion](...);

-- ==========================================
-- 4. RECREAR VISTAS EN EL NUEVO SCHEMA
-- ==========================================
-- Las vistas NO se "mueven" — se DROP + CREATE

CREATE OR REPLACE VIEW [schema_name].[nombre_vista] AS
SELECT ...
FROM [schema_name].[tabla]  -- referenciar tablas del nuevo schema explícitamente
JOIN public.[otra_tabla] ON ...;  -- joins cross-schema son válidos

-- Eliminar la versión legacy de public
DROP VIEW IF EXISTS public.[nombre_vista];

-- ==========================================
-- 5. VERIFICACIÓN (ejecutar al final para confirmar)
-- ==========================================
SELECT table_name FROM information_schema.tables WHERE table_schema = '[schema_name]';
SELECT routine_name FROM information_schema.routines WHERE routine_schema = '[schema_name]';
SELECT table_name FROM information_schema.views WHERE table_schema = '[schema_name]';
```

### 2.3 — Reglas críticas del SQL

- **Orden de `ALTER TABLE SET SCHEMA`**: mover primero las tablas referenciadas por FKs de otras que se moverán después. Si hay FK circular, mover en una transacción.
- **Nunca** `ALTER FUNCTION ... SET SCHEMA` cuando la función hace `FROM tabla` — el `search_path` se perdería.
- **Siempre** incluir `SET search_path = '[nuevo_schema]', 'public'` en funciones movidas.
- **Vistas cross-schema** son válidas: `[schema_name].tabla_a JOIN public.tabla_b` funciona perfectamente en PostgreSQL.
- **RLS**: Las políticas siguen a las tablas automáticamente cuando se mueven con `SET SCHEMA`.

---

## FASE 3 — Actualizar el Frontend

### 3.1 — Encontrar todos los archivos afectados

Buscar en `src/` todas las referencias a las tablas/vistas movidas:

```powershell
# Buscar .from() de las tablas movidas
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | `
  Select-String -SimpleMatch ".from('tabla_movida')" | `
  Select-Object Filename, LineNumber, Line

# También buscar con comillas dobles
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | `
  Select-String -SimpleMatch '.from("tabla_movida")' | `
  Select-Object Filename, LineNumber, Line
```

O usar grep_search (más confiable en Windows):
```
grep_search(".from('tabla_movida')", src/*)
grep_search('.from("tabla_movida")', src/*)
```

### 3.2 — Aplicar el cambio de schema

**Antes:**
```typescript
supabase.from("tabla_movida")
supabase.from("vista_movida")
```

**Después:**
```typescript
supabase.schema("nuevo_schema").from("tabla_movida")
supabase.schema("nuevo_schema").from("vista_movida")
```

Para archivos con muchos `.from()`, usar reemplazo batch en PowerShell:
```powershell
(Get-Content src/features/[feature]/actions.ts -Raw) `
  -replace '\.from\("tabla_movida"\)', '.schema("nuevo_schema").from("tabla_movida")' `
  | Set-Content src/features/[feature]/actions.ts -NoNewline
```

### 3.3 — Archivos típicos a revisar por feature

| Archivo | Tipo de operación |
|---------|-----------------|
| `src/features/[feature]/queries.ts` | SELECT queries (server) |
| `src/features/[feature]/actions.ts` | INSERT/UPDATE/DELETE (server) |
| `src/features/[feature]/queries/get-*.ts` | Sub-queries especializadas |
| `src/features/[other-feature]/queries.ts` | Cross-feature usage (buscar en TODO src/) |

### 3.4 — Verificar que no queden referencias sin actualizar

```
# Verificar que no quedan .from(tabla) sin .schema() prefix
grep_search('.from("tabla_movida")', src/*)
# debe devolver solo líneas que contienen .schema("nuevo_schema")
```

---

## FASE 4 — Actualizar el Introspector de Schema

Cada vez que se crea un nuevo schema, hay que registrarlo en el introspector para que aparezca en `DB/schema/`.

### 4.1 — Modificar `scripts/introspect-db.mjs`

Buscar la línea:
```javascript
const SCHEMAS = ['public', 'iam', 'construction'];
```

Agregar el nuevo schema al array:
```javascript
const SCHEMAS = ['public', 'iam', 'construction', 'nuevo_schema'];
```

**Eso es todo.** El script tiene arquitectura genérica — genera automáticamente los archivos para cualquier schema en el array.

### 4.2 — Ejecutar el introspector

```bash
npm run db:schema
```

Esto generará `DB/schema/[nuevo_schema]/` con:
- `tables_1.md` (y `tables_2.md`, etc. si hay muchas)
- `views.md`
- `functions_1.md`
- `triggers.md`
- `rls.md`
- `enums.md` (si hay enums)
- `indexes.md`

También actualiza `DB/schema/_index.md` con el resumen del nuevo schema.

### 4.3 — Verificar la carpeta generada

```
list_dir DB/schema/[nuevo_schema]/
```

Confirmar que tiene los archivos esperados según los objetos que se movieron.

---

## FASE 5 — El usuario ejecuta el SQL en Supabase

> ⚠️ **El agente NUNCA ejecuta SQL en Supabase.** El usuario es responsable de esto.

1. El usuario copia el archivo `DB/XXX_create_[schema].sql`
2. Lo ejecuta en el SQL Editor de Supabase
3. Verifica las queries de confirmación al final del script
4. Ejecuta `npm run db:schema` si el agente no lo hizo después (para regenerar desde el estado real post-migración)

---

## FASE 6 — Documentación post-migración

### 6.1 — Actualizar `DB/SCHEMA.md` (protegido)

Solo el usuario lo actualiza después de `npm run db:schema`.

### 6.2 — Actualizar README.md del feature

Si existe `src/features/[feature]/README.md`, documentar el cambio:
```markdown
## Cambio de Schema (fecha)
Las tablas `quotes`, `quote_items` fueron movidas al schema `construction`.
El frontend usa `.schema('construction').from(...)` para acceder a ellas.
```

---

## Checklist Completo

```
ANÁLISIS
[ ] Identificar tablas del dominio
[ ] Identificar funciones de negocio pura (excluir log_*, notify_*)
[ ] Identificar vistas de solo lectura del dominio
[ ] Decidir estrategia de compatibilidad (Opción B en Seencel)

SQL
[ ] Crear archivo DB/XXX_create_[schema]_schema.sql
[ ] CREATE SCHEMA + GRANT USAGE
[ ] ALTER TABLE SET SCHEMA (en orden de dependencias)
[ ] GRANT ALL ON ALL TABLES
[ ] DROP + CREATE funciones con search_path correcto
[ ] DROP + CREATE vistas con refs explícitas al nuevo schema
[ ] Queries de verificación al final

FRONTEND
[ ] Buscar TODOS los .from() afectados en src/
[ ] Incluir features cruzados (no solo el feature principal)
[ ] Reemplazar con .schema("nuevo_schema").from(...)
[ ] Verificar que no quedan referencias sin .schema()

INTROSPECTOR
[ ] Agregar nuevo schema al array SCHEMAS en introspect-db.mjs
[ ] Ejecutar npm run db:schema
[ ] Verificar DB/schema/[nuevo_schema]/ generado correctamente

POST-MIGRACIÓN (usuario)
[ ] Ejecutar SQL en Supabase
[ ] Verificar queries de confirmación
[ ] Actualizar TABLES.md de los features afectados
```

---

## Casos de Referencia

| Schema | Archivo SQL | Frontend afectado |
|--------|-------------|-------------------|
| `iam` | `DB/move_invitations_to_iam.sql` | `src/features/organization/` |
| `construction` | `DB/025_create_construction_schema.sql` | `src/features/quotes/`, `src/features/tasks/`, `src/features/project-health/` |
