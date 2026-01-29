# 📦 Sistema de Importación Masiva - Seencel V2

Este documento unifica la documentación del sistema de importación masiva de datos. El sistema permite importar Excel/CSV con mapeo inteligente, validación y capacidad de deshacer.

---

## 🏗️ Arquitectura

```
src/components/shared/import/
├── import-modal.tsx          # Modal wizard (Upload -> Map -> Validate -> Conflicts -> Import)
├── README.md                 # Este archivo
└── IMPORT_SYSTEM_AUDIT.md    # Roadmap histórico (legacy reference)

src/lib/
└── import-utils.ts           # Tipos (ImportConfig, ImportColumn) + utilidades de parseo

src/actions/
└── import-actions.ts         # Server actions para batch import/revert
```

---

## 🔧 Configuración para Nuevas Entidades

### 1. Requisitos de Base de Datos

Toda tabla que soporte importación **DEBE** tener estas columnas:

```sql
-- Columnas OBLIGATORIAS para importación
import_batch_id UUID NULL,    -- Referencia al batch de importación (para undo)
is_deleted BOOLEAN DEFAULT FALSE,  -- Soft delete (requerido para revert)
```

### 2. SQL para Agregar Soporte de Importación

#### Material Payments (Ejemplo):

```sql
-- Paso 1: Agregar columna import_batch_id
ALTER TABLE material_payments 
ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL 
REFERENCES import_batches(id) ON DELETE SET NULL;

-- Paso 2: Agregar material_type_id si no existe
ALTER TABLE material_payments 
ADD COLUMN IF NOT EXISTS material_type_id UUID NULL 
REFERENCES material_types(id) ON DELETE SET NULL;

-- Paso 3: Crear índice para búsquedas por batch
CREATE INDEX IF NOT EXISTS idx_material_payments_import_batch 
ON material_payments(import_batch_id) 
WHERE import_batch_id IS NOT NULL;
```

#### Tablas que YA tienen soporte:
- ✅ `contacts` (import_batch_id)
- ✅ `client_payments` (import_batch_id)
- ✅ `subcontract_payments` (import_batch_id)
- 🔴 `material_payments` - **FALTA agregar import_batch_id**

---

## 📝 Cómo Implementar Importación

### Paso 1: Agregar columna SQL (si no existe)
Ejecutar el SQL de la sección anterior.

### Paso 2: Crear función de batch import en `import-actions.ts`

```typescript
export async function importEntityBatch(
    organizationId: string,
    projectId: string,
    records: any[],
    batchId: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Fetch lookup tables (currencies, wallets, etc.)
    // 2. Transform & validate records
    // 3. Insert with import_batch_id
    
    const preparedRecords = records.map(record => ({
        // ... mapped fields ...
        import_batch_id: batchId,  // <-- CRÍTICO
        created_by: user?.id,
        is_deleted: false,
    }));
    
    await supabase.from('your_table').insert(preparedRecords);
    
    revalidatePath('/your-path');
    return { success: preparedRecords.length, errors: [] };
}
```

### Paso 3: Agregar tabla a `revertImportBatch`

En `import-actions.ts`, asegurarse que la tabla está en el array permitido:

```typescript
const allowedTables = ['contacts', 'client_payments', 'subcontract_payments', 'material_payments'];
```

### Paso 4: Definir `ImportConfig` en la vista

```typescript
const paymentImportConfig: ImportConfig<any> = {
    entityLabel: "Pagos de X",
    entityId: "pagos_x",  // ID único para patrones ML
    columns: [
        { id: "date", label: "Fecha", required: true, example: "2024-01-20" },
        { 
            id: "category_name", 
            label: "Categoría", 
            foreignKey: {
                table: 'categories',
                labelField: 'name',
                valueField: 'id',
                fetchOptions: async () => categories.map(c => ({ id: c.id, label: c.name }))
            }
        },
        { id: "amount", label: "Monto", required: true, type: "number" },
        // ... más columnas
    ],
    onImport: async (data) => {
        const batch = await createImportBatch(orgId, "entity_name", data.length);
        const result = await importEntityBatch(orgId, projectId, data, batch.id);
        return { success: result.success, errors: result.errors, batchId: batch.id };
    },
    onRevert: async (batchId) => {
        await revertImportBatch(batchId, 'entity_table_name');
    }
};
```

### Paso 5: Conectar botón al modal

```typescript
const handleImport = () => {
    openModal(
        <BulkImportModal config={paymentImportConfig} organizationId={orgId} />,
        {
            size: "2xl",
            title: "Importar Registros",
            description: "Importa desde Excel o CSV."
        }
    );
};
```

---

## ⚡ Características del Sistema

### ✅ Ya Implementado

| Feature | Descripción |
|---------|-------------|
| **Wizard Multi-paso** | Upload → Mapeo → Validación → Conflictos → Resultado |
| **Parseo Excel/CSV** | Soporte nativo `.xlsx` y `.csv` |
| **Fechas Flexibles** | Reconoce DD-MM-YY, MM/DD/YYYY, ISO, Excel serial |
| **Smart Mapping** | Sugiere columnas basado en uso histórico (ML) |
| **Fuzzy Matching** | Similitud de texto para sugerencias iniciales |
| **Resolución Conflictos** | Crear valores nuevos, mapear a existentes, ignorar |
| **Auditoría** | Log de quién importó qué, cuándo, cuántos |
| **Undo/Revert** | Deshacer lote completo con soft-delete |

### 📊 Tabla `import_batches`

Registra cada importación para auditoría y undo:

```sql
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entity_type TEXT NOT NULL,           -- 'contacts', 'material_payments', etc.
    total_records INT NOT NULL,
    status TEXT DEFAULT 'pending',        -- 'pending', 'completed', 'reverted'
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📊 Tabla `ia_import_mapping_patterns`

Almacena patrones de mapeo aprendidos por organización:

```sql
-- Usado para Smart Mapping automático
-- Guarda: "Para entity X, la columna 'Monto Total' mapeó a 'amount'"
```

---

## 🚨 Checklist para Nueva Entidad

- [ ] Columna `import_batch_id UUID NULL` en tabla
- [ ] Columna `is_deleted BOOLEAN DEFAULT FALSE` en tabla
- [ ] Índice en `import_batch_id`
- [ ] Función `import{Entity}Batch()` en `import-actions.ts`
- [ ] Tabla agregada a `allowedTables` en `revertImportBatch()`
- [ ] `ImportConfig` definido en la vista
- [ ] Botón "Importar" conectado a `BulkImportModal`

---

## 📋 SQL Pendiente: Material Payments

```sql
-- =============================================
-- EJECUTAR EN SUPABASE SQL EDITOR
-- =============================================

-- 1. Agregar columna import_batch_id para soporte de importación masiva
ALTER TABLE material_payments 
ADD COLUMN IF NOT EXISTS import_batch_id UUID NULL 
REFERENCES import_batches(id) ON DELETE SET NULL;

-- 2. Agregar material_type_id para clasificación de pagos
ALTER TABLE material_payments 
ADD COLUMN IF NOT EXISTS material_type_id UUID NULL 
REFERENCES material_types(id) ON DELETE SET NULL;

-- 3. Índice para optimizar consultas por batch (útil para undo)
CREATE INDEX IF NOT EXISTS idx_material_payments_import_batch 
ON material_payments(import_batch_id) 
WHERE import_batch_id IS NOT NULL;

-- 4. Índice para consultas por tipo de material
CREATE INDEX IF NOT EXISTS idx_material_payments_material_type 
ON material_payments(material_type_id) 
WHERE material_type_id IS NOT NULL;

-- 5. Actualizar la vista para incluir material_type_name
DROP VIEW IF EXISTS material_payments_view;
CREATE VIEW public.material_payments_view AS
SELECT
    mp.id,
    mp.organization_id,
    mp.project_id,
    mp.payment_date,
    date_trunc('month', mp.payment_date::timestamp with time zone) AS payment_month,
    mp.amount,
    mp.currency_id,
    cur.code AS currency_code,
    cur.symbol AS currency_symbol,
    COALESCE(mp.exchange_rate, 1::numeric) AS exchange_rate,
    mp.status,
    mp.wallet_id,
    w.name AS wallet_name,
    mp.notes,
    mp.reference,
    mp.purchase_id,
    mi.invoice_number,
    mi.provider_id,
    COALESCE(prov.company_name, prov.first_name || ' ' || prov.last_name) AS provider_name,
    mp.material_type_id,
    mt.name AS material_type_name,
    p.name AS project_name,
    mp.created_by,
    u.full_name AS creator_full_name,
    u.avatar_url AS creator_avatar_url,
    mp.created_at,
    mp.updated_at,
    mp.import_batch_id,
    EXISTS (
        SELECT 1 FROM media_links ml WHERE ml.material_payment_id = mp.id
    ) AS has_attachments
FROM material_payments mp
LEFT JOIN material_invoices mi ON mi.id = mp.purchase_id
LEFT JOIN contacts prov ON prov.id = mi.provider_id
LEFT JOIN projects p ON p.id = mp.project_id
LEFT JOIN organization_members om ON om.id = mp.created_by
LEFT JOIN users u ON u.id = om.user_id
LEFT JOIN wallets w ON w.id = mp.wallet_id
LEFT JOIN currencies cur ON cur.id = mp.currency_id
LEFT JOIN material_types mt ON mt.id = mp.material_type_id
WHERE mp.is_deleted = false OR mp.is_deleted IS NULL;
```

---

## 📚 Referencias

- [IMPORT_SYSTEM_AUDIT.md](./IMPORT_SYSTEM_AUDIT.md) - Roadmap histórico y features legacy
- [import-modal.tsx](./import-modal.tsx) - Componente principal del wizard
- [import-utils.ts](../../lib/import-utils.ts) - Tipos y utilidades
- [import-actions.ts](../../actions/import-actions.ts) - Server actions
