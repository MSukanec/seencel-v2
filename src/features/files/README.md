# Feature: Documentación (Files)

## Descripción General

La página de **Documentación** (`/organization/files`) centraliza **todos los documentos y archivos** subidos a la organización a través de cualquier módulo (pagos, bitácora, contactos, materiales, etc.).

Los archivos se pueden organizar en **carpetas jerárquicas** con soporte para subcarpetas, y se navegan mediante un explorador visual tipo Finder.

---

## Conceptos Clave

### Relación Archivo ↔ Carpeta

- Un archivo puede pertenecer a un **módulo** (bitácora, pagos, etc.) **Y** a una **carpeta** al mismo tiempo.
- Las carpetas son una capa de **organización adicional**, no reemplazan la asociación original del archivo con su entidad de negocio.
- Los archivos sin `folder_id` aparecen como **"Sin organizar"** en la raíz de carpetas.

### Scope: Organización vs Proyecto

Las carpetas pertenecen a una **organización** y opcionalmente se pueden asociar a un **proyecto**.

| Contexto | Qué ve el usuario |
|---|---|
| **Página de Organización** (`/organization/files`) | Solo carpetas **sin proyecto** (`project_id = NULL`). Ve archivos de toda la org. |
| **Página de Proyecto** (`/project/[id]/files`) | Solo carpetas **del proyecto** (`project_id = X`). Ve archivos del proyecto. |

> **Importante:** Si un usuario crea una carpeta "Contratos" en la organización, esa carpeta **no aparece** en la vista de archivos de un proyecto específico (y viceversa). Cada contexto tiene sus propias carpetas.

---

## Esquema de Datos

| Tabla | Descripción |
|---|---|
| `media_files` | Archivo físico (bucket, path, nombre, tipo, tamaño) |
| `media_links` | Relación entre un archivo y una entidad de negocio. Incluye `folder_id`. |
| `media_file_folders` | Carpetas jerárquicas (`parent_id`), con scope por organización y proyecto. |

### Columnas de `media_file_folders`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK a organizations (obligatorio) |
| `project_id` | uuid | FK a projects (null = carpeta de org) |
| `name` | text | Nombre de la carpeta |
| `parent_id` | uuid | FK a sí misma (subcarpetas) |
| `is_deleted` | boolean | Soft delete |
| `deleted_at` | timestamptz | Timestamp de borrado |
| `created_by` | uuid | FK a organization_members |
| `updated_by` | uuid | FK a organization_members |
| `created_at` | timestamptz | Timestamp de creación |
| `updated_at` | timestamptz | Timestamp de última modificación |

---

## Estructura de Archivos

```
src/features/files/
├── README.md                           # Este archivo
├── TABLES.md                           # Esquema DB (solo lectura, actualizado por el usuario)
├── queries.ts                          # Server queries (getFiles, getFolders)
├── actions.ts                          # Server actions (CRUD carpetas, mover archivos, upload)
├── types.ts                            # TypeScript types (MediaFile, FileItem, Folder)
├── forms/
│   ├── files-upload-form.tsx           # Modal de subida (con selector de carpeta)
│   ├── files-folder-form.tsx           # Modal crear/renombrar carpeta (semi-autónomo + optimista)
│   └── move-to-folder-dialog.tsx       # Diálogo para mover archivo a una carpeta
└── views/
    ├── files-gallery-view.tsx          # Vista principal (galería con 3 tabs + multi-select)
    └── files-folders-view.tsx          # Vista de carpetas tipo explorador (optimistic updates)
```

---

## Vistas (Tabs)

| Tab | Descripción |
|---|---|
| **Explorar** | Grid de todos los archivos con thumbnails |
| **Carpetas** | Explorador con breadcrumbs, subcarpetas, archivos, y botón "Nueva Carpeta" siempre visible |
| **Recientes** | Archivos agrupados por fecha (Hoy, Ayer, Esta semana, etc.) |

---

## Acciones Disponibles

| Acción | Alcance | UI | Patrón |
|---|---|---|---|
| Crear carpeta | Org/Subcarpeta | Botón "Nueva Carpeta" + modal | Optimistic (`addItem`) |
| Renombrar carpeta | Individual | Menú ⋯ → Renombrar + modal | Optimistic (`updateItem`) |
| Eliminar carpeta | Individual | Menú ⋯ → Eliminar + AlertDialog | Optimistic (`removeItem`) + Soft delete |
| Mover archivo a carpeta | Individual | Menú ⋯ → Mover a carpeta + dialog | Server action |
| Mover archivos masivo | Multi-select | `moveFilesToFolder` | Server action |
| Subir archivo | Individual | Modal con selector de carpeta | Server action |
| Selección masiva | Multi-select | Checkboxes en FileListItem (todas las vistas) | `useMultiSelect` |

---

## Performance

Todas las operaciones de carpetas usan **optimistic updates** via `useOptimisticList`:

- **Crear**: El modal cierra inmediatamente, la carpeta aparece en la lista, y el servidor procesa en background.
- **Renombrar**: El nombre cambia al instante en la UI, el servidor confirma en background.
- **Eliminar**: La carpeta desaparece de la lista al confirmar, el soft delete corre en background.

> ⛔ No se usa `router.refresh()` como mecanismo de actualización.

---

## RLS

| Política | Función |
|---|---|
| SELECT | `can_view_org(organization_id, 'media.view')` |
| INSERT | `can_mutate_org(organization_id, 'media.manage')` |
| UPDATE (incl. soft delete) | `can_mutate_org(organization_id, 'media.manage')` |

No hay política DELETE real porque se usa **soft delete**.

---

## Auditoría

La tabla tiene trigger `log_media_file_folder_activity()` que registra:
- `create_media_file_folder`
- `update_media_file_folder`
- `delete_media_file_folder` (cuando `is_deleted` pasa de `false` a `true`)
