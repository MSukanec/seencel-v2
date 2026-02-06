# 📦 Sistema de Importación Masiva - Seencel V2

Este documento unifica la documentación del sistema de importación masiva de datos. El sistema permite importar Excel/CSV con mapeo inteligente, validación, resolución de conflictos y capacidad de deshacer.

---

## 🏗️ Arquitectura

```
src/components/shared/import/
├── import-modal.tsx          # Modal wizard principal
├── steps/
│   ├── step-upload.tsx       # Paso 1: Upload + selección de encabezado
│   ├── step-mapping.tsx      # Paso 2: Mapeo de columnas
│   └── step-validation.tsx   # Paso 3: Validación y vista previa
├── README.md                 # Este archivo
└── IMPORT_SYSTEM_AUDIT.md    # Roadmap histórico (legacy reference)

src/lib/import/
├── utils.ts                  # Tipos (ImportConfig, ImportColumn) + utilidades
├── history.ts                # Funciones para historial de importaciones
├── patterns.ts               # Smart mapping con ML
└── conflict-utils.ts         # Resolución de conflictos

src/actions/
└── import-actions.ts         # Server actions para batch import/revert
```

---

## 🎯 Flujo del Wizard (5 Pasos)

### Paso 1: Subir Archivo (`step-upload.tsx`)

El usuario sube un archivo Excel o CSV. El sistema:
1. Parsea el archivo con `xlsx` library
2. Detecta si hay filas extra antes del encabezado
3. Si detecta contenido "basura", muestra selector de encabezado
4. Permite preview de las primeras filas

**Selección de encabezado**: Si el archivo tiene títulos, logos o filas vacías antes de los datos, el modal muestra las primeras filas y permite al usuario hacer click en la fila que contiene los encabezados.

### Paso 2: Mapeo de Columnas (`step-mapping.tsx`)

Muestra cada columna del archivo a la izquierda y un selector a la derecha para asociarla con un campo del sistema.

**Características del selector**:
- Muestra `label` del campo
- Muestra `description` si existe (explica para qué sirve)
- Muestra `example` si existe (ej: "Cemento Portland")
- Campos obligatorios marcados con `(obligatorio)`
- Campos ya mapeados aparecen deshabilitados
- El trigger usa `textValue` para mostrar solo el label limpio

### Paso 3: Vista Previa y Validación (`step-validation.tsx`)

Muestra resumen de registros válidos vs errores, con preview de los primeros registros transformados.

### Paso 4: Resolución de Conflictos

Aparece solo si hay valores que no existen en el sistema (categorías, unidades, proveedores nuevos). Por cada valor conflictivo, el usuario puede:
- **Crear nuevo**: Sistema crea la entidad automáticamente
- **Usar existente**: Mapear a un valor existente
- **Ignorar**: Dejar el campo vacío

### Paso 5: Confirmación y Resultado

Ejecuta la importación y muestra resumen con cantidad de registros importados, errores omitidos y opción de deshacer.

---

## 📝 Configurar ImportConfig

### Interface `ImportConfig`

```typescript
export interface ImportConfig<T = any> {
    entityLabel: string;           // "Materiales", "Pagos", etc.
    entityId: string;              // ID único para ML patterns (ej: 'materials')
    columns: ImportColumn<T>[];    // Definición de campos mapeables
    onImport: (data: T[]) => Promise<ImportResult>;
    onRevert?: (batchId: string) => Promise<void>;
    sampleFileUrl?: string;        // URL a archivo de ejemplo
    description?: string;          // Explicación del importador (paso 1)
    docsPath?: string;             // Link a documentación (ej: '/docs/materiales/importar')
}
```

### Interface `ImportColumn`

```typescript
export interface ImportColumn<T = any> {
    id: keyof T | string;          // ID del campo (ej: 'name', 'price')
    label: string;                 // Label visible (ej: 'Nombre')
    required?: boolean;            // Si es obligatorio
    description?: string;          // Explicación del campo
    example?: string;              // Ejemplo (ej: 'Cemento Portland CPF40')
    type?: 'string' | 'number' | 'date' | 'boolean';
    foreignKey?: ForeignKeyConfig; // Si requiere resolución de conflictos
    transform?: (value: any) => any;
}
```

### Ejemplo Completo (Materiales)

```typescript
const materialsImportConfig: ImportConfig<MaterialImportData> = {
    entityLabel: "Materiales",
    entityId: "materials",
    description: "Importá tu catálogo de materiales e insumos desde un archivo Excel o CSV. El sistema detectará automáticamente las columnas y te permitirá mapearlas.",
    docsPath: "/docs/materiales/importar",
    columns: [
        {
            id: "name",
            label: "Nombre",
            required: true,
            description: "Nombre del material o insumo",
            example: "Cemento Portland"
        },
        {
            id: "code",
            label: "Código",
            description: "Código interno o SKU de tu sistema",
            example: "MAT-001"
        },
        {
            id: "unit_symbol",
            label: "Unidad",
            description: "Si no existe, se crea automáticamente",
            example: "kg"
        },
        {
            id: "price",
            label: "Precio Unitario",
            type: "number",
            description: "Precio por unidad",
            example: "150.00"
        },
        {
            id: "currency_code",
            label: "Moneda",
            description: "ARS, USD, etc. Por defecto: ARS",
            example: "ARS"
        },
        {
            id: "price_date",
            label: "Fecha del Precio",
            type: "date",
            description: "Fecha desde cuándo aplica el precio. Si no se indica, usa la fecha actual",
            example: "2024-01-15"
        },
        {
            id: "provider_name",
            label: "Proveedor",
            description: "Si no existe, se crea automáticamente",
            example: "Loma Negra"
        },
        {
            id: "category_name",
            label: "Categoría",
            description: "Para organizar materiales",
            example: "Materiales de Construcción"
        },
        {
            id: "description",
            label: "Descripción",
            description: "Detalle o especificación técnica",
            example: "Cemento tipo I para construcción general"
        },
    ],
    onImport: async (data) => { /* ... */ },
    onRevert: async (batchId) => { /* ... */ }
};
```

---

## 🔧 Requisitos de Base de Datos

### Columnas Obligatorias

Toda tabla que soporte importación **DEBE** tener:

```sql
import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL,
is_deleted BOOLEAN DEFAULT FALSE,
```

### Tabla `import_batches`

```sql
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    member_id UUID NOT NULL REFERENCES organization_members(id),  -- Quién importó
    entity_type TEXT NOT NULL,           -- 'materials', 'contacts', etc.
    total_records INT NOT NULL,
    status TEXT DEFAULT 'pending',       -- 'pending', 'completed', 'reverted'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> **Nota**: Usamos `member_id` (no `user_id`) para asociar correctamente la importación al miembro de la organización, respetando el modelo de datos multi-tenant.

---

## ⚡ Características del Sistema

| Feature | Descripción |
|---------|-------------|
| **Wizard 5 pasos** | Upload → Mapeo → Validación → Conflictos → Resultado |
| **Parseo Excel/CSV** | Soporte `.xlsx` y `.csv` hasta 5MB |
| **Selección de encabezado** | Si hay filas extra, permite elegir cuál contiene los headers |
| **Fechas flexibles** | Reconoce DD-MM-YY, MM/DD/YYYY, ISO, Excel serial |
| **Smart Mapping (ML)** | Sugiere columnas basado en uso histórico |
| **Fuzzy Matching** | Similitud de texto para sugerencias iniciales |
| **Descripciones en campos** | Cada campo muestra descripción y ejemplo en el selector |
| **Resolución de conflictos** | Crear valores nuevos, mapear a existentes, o ignorar |
| **Historial** | Ver últimas 20 importaciones con fecha, usuario y cantidad |
| **Undo/Revert** | Deshacer lote completo con soft-delete |
| **Documentación integrada** | Link a docs desde el modal si está configurado |

---

## 🚨 Checklist para Nueva Entidad

- [ ] Columna `import_batch_id UUID NULL` en tabla
- [ ] Columna `is_deleted BOOLEAN DEFAULT FALSE` en tabla
- [ ] Índice en `import_batch_id`
- [ ] Función `import{Entity}Batch()` en `import-actions.ts`
- [ ] Tabla agregada a `allowedTables` en `revertImportBatch()`
- [ ] `ImportConfig` definido con:
  - [ ] `entityLabel` y `entityId`
  - [ ] `description` explicando qué hace el importador
  - [ ] `docsPath` si existe documentación
  - [ ] Columnas con `label`, `description` y `example`
- [ ] Botón "Importar" en toolbar (SplitButton con historial)
- [ ] Documentación en `/content/docs/{locale}/{feature}/importar.mdx`

---

## 📋 Tablas con Soporte de Importación

| Tabla | `import_batch_id` | Documentación |
|-------|-------------------|---------------|
| `contacts` | ✅ | Pendiente |
| `materials` | ✅ | ✅ `/docs/materiales/importar` |
| `client_payments` | ✅ | Pendiente |
| `subcontract_payments` | ✅ | Pendiente |
| `material_payments` | 🔴 Falta | Pendiente |

---

## 🎨 UI/UX Guidelines

### Header del Modal

El header muestra:
- **Título**: "Importar {entityLabel}" o nombre del paso actual
- **Descripción**: Texto breve del paso actual (traducido)
- **Stepper visual**: Indicadores 1, 2, 3 + "Verificación" final

### Step Mapping

- Trigger del select: altura automática (`h-auto min-h-9 py-2`)
- Si no hay mapeo: borde punteado + texto muted
- SelectItem muestra descripción y ejemplo si existen
- `textValue` controla qué se muestra en el trigger (solo label limpio)

### Resolución de Conflictos

- Cada valor nuevo en sección separada por tipo (Categorías, Unidades, Proveedores)
- Opciones claras: "Crear nuevo" o "Usar existente" con selector

---

## 📚 Referencias

- [Documentación de usuario](/content/docs/es/materiales/importar.mdx) - Guía paso a paso
- [import-modal.tsx](./import-modal.tsx) - Componente principal
- [step-upload.tsx](./steps/step-upload.tsx) - Lógica de upload y header selection
- [step-mapping.tsx](./steps/step-mapping.tsx) - UI de mapeo con descripciones
- [utils.ts](../../lib/import/utils.ts) - Tipos y utilidades
- [history.ts](../../lib/import/history.ts) - Historial de importaciones
