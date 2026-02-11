# Feature: Archivos (Files)

## Estado Actual

La página de Archivos (`/organization/files` y `/project/[projectId]/files`) muestra **todos los archivos** subidos a la organización a través de cualquier feature (pagos, bitácora, contactos, etc.).

### Esquema de datos

- **`media_files`**: Archivo físico (bucket, path, nombre, tipo, tamaño)
- **`media_links`**: Relación entre un archivo y una entidad de negocio

Cada `media_link` tiene ~15 FK nullable que apuntan a distintas entidades (`site_log_id`, `material_payment_id`, `client_payment_id`, etc.). Cuando un archivo se sube desde un feature, se llena la FK correspondiente.

### Estructura de archivos

```
src/features/files/
├── README.md          # Este archivo
├── TABLES.md          # Esquema DB (solo lectura)
├── queries.ts         # Server queries
├── types.ts           # TypeScript types
└── views/
    └── files-gallery-view.tsx  # Vista principal (galería)
```

---

## Pendiente: Archivos Sueltos (Standalone Files)

### Problema

Actualmente todos los archivos llegan vinculados a una entidad de un feature. No existe forma de que el usuario suba un archivo **suelto** directamente desde la página de Archivos — por ejemplo un PDF de contrato, un archivo BIM, un plano, etc.

### Propuesta

El modelo actual (`media_files` + `media_links`) **ya soporta archivos sueltos** naturalmente. Un archivo suelto sería un `media_link` donde:

- `organization_id` ✅ (obligatorio)
- `project_id` opcional (si el usuario lo asocia a un proyecto)
- **Todas las demás FK** = `NULL` (no vinculado a ningún feature)

### Decisiones pendientes

1. **¿Carpetas del usuario?**
   - **Opción A**: Usar el campo `category` existente como carpeta (simple, limitado a valores del CHECK constraint)
   - **Opción B**: Crear tabla `file_folders` con `id`, `organization_id`, `name`, `parent_id` (subcarpetas), y agregar FK `folder_id` a `media_links` (más escalable)

2. **¿Qué muestra la página Files?**
   - **Opción A**: Todo (sueltos + de features) → como está ahora
   - **Opción B**: Solo sueltos, con link a "ver archivos de X feature"
   - **Opción C**: Todo pero con filtro para distinguir origen

3. **Storage path en Supabase**
   - Convención sugerida: `{organization_id}/standalone/{uuid}.ext`
   - Bucket: a definir (existente o nuevo)

4. **Upload UI**
   - Botón "Subir archivo" en el Toolbar (action principal)
   - Modal con: selector de archivo, campo de categoría/carpeta, proyecto opcional
   - Drag & drop sobre la galería (nice to have)

### Implementación estimada

- [ ] Decidir modelo de carpetas (Opción A o B)
- [ ] SQL: si Opción B, crear tabla `file_folders` + RLS + migración
- [ ] SQL: si se agregan categorías nuevas, ALTER CHECK constraint en `media_links`
- [ ] Server action: `uploadStandaloneFile` (subir a storage + crear media_file + media_link)
- [ ] Server action: `deleteStandaloneFile` (borrar media_link + media_file + storage)
- [ ] Form/Modal de upload
- [ ] Conectar botón "Eliminar" del dropdown (actualmente sin funcionalidad)
- [ ] Actualizar query si se decide filtrar sueltos vs vinculados
