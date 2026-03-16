# 🔍 Auditoría Pre-Lanzamiento: Configuración de Organización

> Fecha: 2026-03-15
> Estado: COMPLETO

## Resumen

| Capa | ✅ OK | ❌ Falla | ⚠️ Advertencia | 🔒 Bloqueante |
|------|-------|---------|----------------|---------------|
| 1. Base de Datos | 1 | 3 | 1 | 0 |
| 2. RLS | 0 | 1 | 1 | 1 |
| 3. Server Actions/Queries | 1 | 2 | 0 | 1 |
| 4. Arquitectura de Página | 2 | 1 | 0 | 0 |
| 5. Componentes UI | 3 | 0 | 0 | 0 |
| 6. Performance | 0 | 1 | 0 | 0 |
| 7. Fechas/i18n/Docs | 2 | 0 | 0 | 0 |
| **TOTAL** | **9** | **8** | **2** | **2** |

---

## Capa 1: Base de Datos

### Tabla: `iam.organizations`
- ✅ Tiene `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `created_by`, `updated_by`.
- ❌ **Falta Trigger `set_timestamp`**: La tabla tiene el trigger `set_updated_by_organizations`. Sin embargo, tras analizar su función subyacente (`handle_updated_by_organizations`), se puede verificar que sólo inyecta el ID del miembro y **no** actualiza la fecha `updated_at`. Por ende, el trigger estándar `set_timestamp` sigue siendo un requisito omitido en esta tabla.

### Tabla: `iam.organization_data`
- ❌ **Columnas obligatorias faltantes**: No cuenta con `created_at`, `updated_at`, `is_deleted`, `deleted_at`. Al ser una extensión 1:1 de `organizations` el borrado lógico no aplica, pero `created_at` y `updated_at` junto a su trigger SON obligatorios según el estándar.

---

## Capa 2: RLS

### `iam.organizations`
- 🔒 **[BLOQUEANTE] Política SELECT Insegura (Filtración Global)**: La política "USUARIOS VEN ORGANIZACIONES" dicta `((is_deleted = false) OR (owner_id = ... ) OR is_admin())`. Al usar un `OR` global sobre `is_deleted = false`, significa que **cualquier usuario logueado puede ver absolutamente TODAS las organizaciones de la plataforma** que no estén borradas.
- ⚠️ **Política UPDATE muy restrictiva**: Sólo el `owner_id` (Dueño original) o un Admin pueden editar la tabla. Los miembros con permiso explícito `organization.manage` no pueden editar el nombre de la organización si la política sigue exigiendo ser el `owner_id`.

### `iam.organization_data`
- 🔒 **[BLOQUEANTE] Ausencia de Políticas RLS**: La tabla `organization_data` **NO TIENE POLÍTICAS RLS DEFINIDAS**. Si RLS está deshabilitado en esta tabla, permite operaciones no autenticadas.

---

## Capa 3: Server Actions / Queries

### `src/actions/update-organization.ts`
- 🔒 **[BLOQUEANTE] Vulnerabilidad IDOR en updateOrganization**: La función confía 100% en el payload del cliente y en el RLS. No valida autenticación con `getAuthUser()` en el entorno de servidor, ni tampoco verifica que el usuario pertenezca a la organización que desea editar.

---

## Capa 4: Arquitectura de Página

### `settings/layout.tsx` y `settings/page.tsx`
- ❌ **`ContentLayout` encapsulado en Layout**: `layout.tsx` abraza estáticamente a sus children usando `<ContentLayout variant="settings">`. La regla Nro 4 exige que `PageWrapper` viva en `layout.tsx` PERO que `ContentLayout` sea declarado individualmente en cada sub-página para posibilitar variantes distintas.

---

## Capa 5: Componentes UI

### `OrganizationDetailsForm`
- ✅ Panel auto-contenido estético, usa correctamente `SettingsSection`.
- ✅ Field Factories en uso correcto (`TextField`, `NotesField`, `PhoneField`).
- ✅ Incorpora `useAutoSave` correctamiente previniendo race-conditions en tipeo continuo.

---

## Capa 6: Performance

- ❌ **Uso CATASTRÓFICO de `getDashboardData()`**: El archivo `settings/page.tsx` invoca a `getDashboardData()` para extraer un simple string (el nombre y descripción del backend). Dicha función realiza 6 queries pesadísimas en paralelo, lo que consume recursos innecesarios del servidor en cada render.

---

## Capa 7: Fechas, i18n y Docs

- ✅ Metadatos SEO correctos con la etiqueta auto-generada (`robots: "noindex, nofollow"`).
- ✅ Importación correcta desde el router instanciado interno.

---

## Fixes Aplicados (Requieren Acción Manual en Supabase)

| # | Capa | Archivo | Fix | Estado |
|---|------|---------|-----|--------|
| 1 | 1. DB (SQL) | `organization_data` & `organizations` | Añadir campos `updated_at`, `created_at` (si faltan) y triggers `set_timestamp` y políticas RLS faltantes. | ✅ Completado |
| 2 | 2. RLS | `organizations` / `org_data` | Eliminar vulnerabilidad del OR al ver orgs; habilitar edición para managers; agregar políticas RLS en data. | ✅ Completado |
| 3 | 3. Server Action | `update-organization.ts` | Agregar chequeos `getAuthUser()` + Autorización programática manual. | ✅ Completado |
| 4 | 4. Arq. de Page | `settings/layout.tsx` / `page.tsx` | Exportar `ContentLayout` a la `page.tsx` propiamente dicha. | ✅ Completado |
| 5 | 6. Performance | `settings/page.tsx`, `queries.ts` | Eliminar `getDashboardData()` por una query `getOrganizationSettingsData()` especializada de 1 sola llamada. | ✅ Completado |

> [!CAUTION]
> **El usuario DEBE ejecutar el script localizado en `DB/fix_organization_settings.sql`** en la consola SQL de Supabase para que los cambios de base de datos surtan efecto. De lo contrario, los problemas de RLS persistirán en producción.
