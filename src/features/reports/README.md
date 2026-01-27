# Reports Feature - Data-Connected Blocks

## Idea General

El sistema de **Data-Connected Blocks** permite crear bloques de reportes que se conectan a datos reales de la aplicación. En lugar de tener datos estáticos o mock, los bloques de tabla pueden consultar información directamente desde Supabase y mostrarla de forma dinámica.

### Arquitectura

El sistema utiliza un **patrón de Registry** que define:
- **Data Sources**: Fuentes de datos (ej: Subcontratistas, Finanzas, Tareas)
- **Tables**: Tablas dentro de cada fuente (ej: Pagos de subcontratistas)
- **Columns**: Columnas a mostrar con tipado (date, currency, text, number)
- **Filters**: Filtros disponibles (ej: projectId, subcontractId)

```
┌─────────────────────────────────────────────────────────────┐
│                    Report Builder UI                         │
├─────────────────────────────────────────────────────────────┤
│  BlockConfigPanel                                            │
│  ├── Source Selector (Registry)                             │
│  ├── Table Selector (Registry)                              │
│  ├── Project Selector (props.projects)                      │
│  └── Entity Selector (loaded async based on project)        │
├─────────────────────────────────────────────────────────────┤
│  TableBlock                                                  │
│  └── fetchReportData (Server Action)                        │
│      └── fetchSubcontractPayments (Supabase Query)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Estado Actual y Roadmap

### ✅ Completado (v1.0)

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Data Source Registry | `lib/data-source-registry.ts` | Define fuentes de datos, tablas, columnas y filtros |
| Data Fetchers | `lib/data-fetchers.ts` | Server actions para obtener datos desde Supabase |
| Block Config Types | `views/reports-builder-view.tsx` | Tipos `BlockConfig` con `dataSourceId`, `dataTableId`, `dataFilters` |
| Config Panel UI | `components/block-config-panel.tsx` | Selectores en cascada (Fuente → Tabla → Proyecto → Entidad) |
| Table Block | `components/blocks/table-block.tsx` | Renderiza datos reales con estados de loading/error/empty |
| **PDF Export** | `views/reports-builder-view.tsx` | Exportación a PDF usando `html2canvas` + `jsPDF` |

#### Data Source: Subcontratistas → Pagos
- **Columnas**: Fecha, Proveedor (condicional), Billetera, Monto
- **Filtros**: Proyecto (requerido), Subcontrato (opcional, permite "Todos")
- **Lógica**: Proveedor solo se muestra cuando hay múltiples subcontratos seleccionados

> **Nota técnica**: PDF Export usa CSS variable overrides para evitar incompatibilidad de `html2canvas` con colores `lab()`/`oklch()` de Tailwind.

---

### 🔄 En Progreso

*Nada en progreso actualmente*

---

### 📋 Pendiente (Backlog)

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| Alta | Más Data Sources | Agregar Finance, Tasks, Clients, Quotes |
| Media | Guardar Reportes | Persistir configuraciones de bloques en DB |
| Baja | Columnas Personalizables | Permitir al usuario elegir qué columnas mostrar |
| Baja | Ordenamiento | Permitir ordenar datos por columna |
| Baja | Paginación | Agregar paginación para datasets grandes |

---

## Cómo Agregar un Nuevo Data Source

1. **Agregar definición en `data-source-registry.ts`**:
```typescript
{
    id: "finance",
    name: "Finanzas",
    icon: DollarSign,
    tables: [
        {
            id: "payments",
            name: "Pagos Generales",
            description: "Pagos de costos generales",
            columns: [
                { key: "date", label: "Fecha", type: "date" },
                { key: "amount", label: "Monto", type: "currency" },
            ],
            filters: [
                { key: "projectId", label: "Proyecto", type: "select", required: true, allowAll: false },
            ],
        },
    ],
},
```

2. **Agregar fetcher en `data-fetchers.ts`**:
```typescript
if (sourceId === "finance" && tableId === "payments") {
    data = await fetchFinancePayments(projectId, filters);
}
```

3. **Crear función de fetch específica**:
```typescript
async function fetchFinancePayments(projectId: string, filters: Record<string, any>) {
    const supabase = await createClient();
    // Query implementation...
}
```

---

## ⚠️ Importante: Mantener Actualizado

> **REGLA**: Cada vez que se modifique este feature, actualizar este README con:
> - Nuevos data sources agregados
> - Cambios en la arquitectura
> - Features completados (mover de Pendiente a Completado)
> - Bugs conocidos o limitaciones

---

## Archivos Clave

```
src/features/reports/
├── lib/
│   ├── data-source-registry.ts   # Definiciones de fuentes de datos
│   └── data-fetchers.ts          # Server actions para fetch
├── components/
│   ├── block-config-panel.tsx    # UI de configuración de bloques
│   ├── block-renderer.tsx        # Renderizado de bloques
│   └── blocks/
│       └── table-block.tsx       # Bloque de tabla con datos reales
└── views/
    └── reports-builder-view.tsx  # Vista principal del constructor
```

---

*Última actualización: 2026-01-27*
