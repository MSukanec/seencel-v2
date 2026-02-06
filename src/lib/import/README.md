# Sistema de Importación Masiva

Sistema centralizado para importar datos desde Excel/CSV a Supabase.

## Estructura

```
src/lib/import/
├── index.ts              # Re-exports públicos
├── core.ts               # createImportBatch, revertImportBatch
├── date-utils.ts         # parseFlexibleDate (Excel serial, DD/MM/YY, etc)
├── utils.ts              # ImportConfig, parseFile, ParseResult
├── conflict-utils.ts     # Detección y resolución de conflictos FK
├── normalizers.ts        # normalizeEmail, normalizePhone
│
├── contacts-import.ts    # Importador de Contactos
├── clients-import.ts     # Importador de Pagos de Clientes
├── subcontracts-import.ts# Importador de Pagos de Subcontratos
└── materials-import.ts   # Importador de Materiales (catálogo y pagos)
```

---

## Uso

```tsx
import {
    createImportBatch,
    revertImportBatch,
    importMaterialsCatalogBatch,
    ImportConfig
} from "@/lib/import";
```

---

## Flujo de Importación

```mermaid
graph LR
    A[Upload] --> B[Mapping]
    B --> C[Validation]
    C --> D[Conflicts]
    D --> E[Import]
    E -->|Error| F[Revert]
```

### 1. **Upload** (`step-upload.tsx`)
- Usuario sube archivo Excel/CSV
- `parseFile()` extrae los datos

### 2. **Mapping** (`step-mapping.tsx`)
- Auto-mapeo inteligente con `findBestMatch()`
- Usuario ajusta mapeo de columnas

### 3. **Validation** (`step-validation.tsx`)
- Valida campos requeridos
- Detecta duplicados con `checkDuplicates()`

### 4. **Conflicts** (`step-conflicts.tsx`)
- `detectConflicts()` encuentra FKs sin match
- Usuario resuelve: crear nuevo, mapear existente, o ignorar

### 5. **Import** (dominio-specific)
- Crea batch con `createImportBatch()`
- Ejecuta importador (ej: `importMaterialsCatalogBatch`)
- Auto-crea entidades relacionadas (categorías, proveedores, unidades)

### Revert
- `revertImportBatch(batchId, tableName)` hace soft-delete de todo el batch

---

## ImportConfig

Cada importador se configura con esta interfaz:

```ts
interface ImportConfig<T> {
    // Identificador único
    id: string;
    
    // Nombre para UI
    name: string;
    
    // Columnas esperadas
    columns: {
        key: keyof T;
        label: string;
        required?: boolean;
        type?: 'text' | 'number' | 'date' | 'email' | 'phone';
    }[];
    
    // Claves foráneas con opciones
    foreignKeys?: {
        key: string;
        label: string;
        fetchOptions: (orgId: string) => Promise<ForeignKeyOption[]>;
        createNew?: (orgId: string, name: string) => Promise<string>;
    }[];
    
    // Función de importación
    importFn: (data: T[], batchId: string) => Promise<ImportResult>;
    
    // Tabla para revert
    entityTable: string;
}
```

---

## Agregar Nuevo Importador

1. **Crear archivo** en `src/lib/import/[dominio]-import.ts`
2. **Implementar función** con firma:
   ```ts
   export async function importXxxBatch(
       organizationId: string,
       items: any[],
       batchId: string
   ): Promise<ImportResult>
   ```
3. **Agregar export** en `index.ts`
4. **Crear ImportConfig** en la vista que lo consume

---

## Funciones de Utilidad

| Función | Descripción |
|---------|-------------|
| `parseFlexibleDate(value)` | Parsea Excel serial, DD/MM/YY, ISO, etc |
| `normalizeEmail(email)` | Normaliza emails |
| `normalizePhone(phone)` | Normaliza teléfonos |
| `findBestMatch(header, columns)` | Auto-mapeo inteligente |
| `detectConflicts(data, config)` | Detecta FKs sin match |
| `applyResolutions(data, resolutions)` | Aplica resoluciones de conflictos |

---

## Auto-Creación de Entidades

El importador de materiales auto-crea:
- **Categorías** (si no existen)
- **Unidades** (si no existen)
- **Proveedores** (como contactos, si no existen)
- **Precios** (si se provee `unit_price`)

---

## Batch Tracking

Cada registro importado tiene `import_batch_id` que permite:
- Tracking de origen
- Revert atómico de todo el batch
- Auditoría de importaciones

```sql
-- Ver batches recientes
SELECT * FROM import_batches
WHERE organization_id = 'xxx'
ORDER BY created_at DESC;
```
