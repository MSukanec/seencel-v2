# Widget System — Seencel V2

Sistema modular de widgets para dashboards con grilla dinámica, drag-and-drop, resize libre, y persistencia en `localStorage`.

---

## Arquitectura

```
components/
├── bento/                          ← Infraestructura del Grid
│   ├── dashboard-widget-grid.tsx   ← Componente principal (react-grid-layout v2.x)
│   ├── types.ts                    ← Tipos: WidgetDefinition, WidgetLayoutItem, WidgetSpan
│   ├── bento-card.tsx              ← Card base visual (header + body)
│   ├── bento-grid.tsx              ← Grid CSS estático (legacy, no usado por RGL)
│   ├── dashboard-customize-button.tsx ← Botón "Personalizar" del header
│   ├── widget-empty-state.tsx      ← Empty state cuando no hay widgets
│   ├── index.ts                    ← Barrel exports
│   └── presets/                    ← Componentes preset reutilizables
│       ├── bento-kpi-card.tsx      ← Card KPI con valor, tendencia y sparkline
│       └── bento-list-card.tsx     ← Card lista con items scrollables
│
├── widgets/                        ← Widgets por dominio + Registry
│   ├── registry.tsx                ← Registro central + layouts por defecto
│   ├── organization/               ← Widgets de organización
│   │   ├── org-pulse-widget.tsx    ← Hero card: logo, mapa, badges, miembros
│   │   └── recent-projects-widget.tsx ← Proyectos activos recientes
│   ├── finance/                    ← Widgets financieros
│   │   ├── income-kpi-widget.tsx
│   │   ├── expense-kpi-widget.tsx
│   │   ├── balance-kpi-widget.tsx
│   │   ├── balance-summary-widget.tsx
│   │   ├── financial-summary-widget.tsx
│   │   ├── financial-evolution-widget.tsx
│   │   ├── wallet-distribution-widget.tsx
│   │   ├── recent-transactions-widget.tsx
│   │   ├── currency-exchange-widget.tsx
│   │   └── quick-actions-widget.tsx
│   └── general/                    ← Widgets parametrizables (multi-dashboard)
│       └── activity-widget.tsx     ← Actividad reciente (scope configurable)
```

---

## Conceptos Clave

### WidgetDefinition

Cada widget se registra en `registry.tsx` con esta forma:

```ts
{
    id: 'finance_income_total',       // ID único
    name: 'Ingresos Totales',        // Nombre visible
    description: 'Total de ingresos', // Tooltip/descripción
    component: IncomeKpiWidget,       // Componente React
    defaultSpan: { w: 2, h: 1 },     // Tamaño default (cols x rows)
    minSpan: { w: 1, h: 1 },         // Mínimo al resize
    maxSpan: { w: 4, h: 2 },         // Máximo al resize
    category: 'financial',            // Categoría (para agrupar en selector)
    group: 'finance',                 // Carpeta/dominio
    configurable: false,              // ¿Tiene panel de config?
    href: '/organization/finance',    // Link opcional (click en título)
}
```

### WidgetLayoutItem

Define la posición de un widget en el grid:

```ts
{
    id: 'finance_income_total',  // Referencia al WidgetDefinition
    x: 0,                       // Columna (0-3)
    y: 0,                       // Fila (auto-compact)
    w: 2,                       // Ancho en columnas (1-4)
    h: 1,                       // Alto en filas (1-N)
    config: { scope: 'org' },   // Config opcional por instancia
    instanceId: 'custom_123',   // ID único si hay duplicados
}
```

### Grid (react-grid-layout v2.x)

| Parámetro | Valor |
|-----------|-------|
| Columnas | 4 (lg), 2 (md), 1 (sm/xs) |
| Row Height | 180px |
| Margin | 16px horizontal, 16px vertical |
| Drag | Handle `.drag-handle` (≡ en el header del widget) |
| Resize | Handles en norte, sur, este, oeste y esquina SE |
| Compactación | Vertical automática |
| Persistencia | `localStorage` con key configurable |

---

## Widgets Existentes

### Organization (2)

| Widget | ID | Default Span | Descripción |
|--------|-----|-------------|-------------|
| Org Pulse | `org_pulse` | 4×2 | Hero: logo, mapa, badges, miembros |
| Proyectos Recientes | `org_recent_projects` | 2×1 | Cards de proyectos activos |

### Finance (10)

| Widget | ID | Default Span | Descripción |
|--------|-----|-------------|-------------|
| Ingresos Totales | `finance_income_total` | 2×1 | KPI con sparkline |
| Gastos Totales | `finance_expense_total` | 2×1 | KPI con sparkline |
| Balance Summary | `finance_balance_summary` | 4×1 | Resumen multi-wallet |
| Financial Summary | `finance_summary` | 4×1 | Tabla resumen |
| Evolución Financiera | `finance_evolution` | 4×1 | Gráfico de línea mensual |
| Distribución Wallets | `finance_wallet_distribution` | 2×1 | Donut chart por wallet |
| Últimas Transacciones | `finance_recent_transactions` | 2×1 | Lista de movimientos |
| Intercambio Moneda | `finance_currency_exchange` | 1×1 | Tipo de cambio actual |
| Acciones Rápidas | `finance_quick_actions` | 2×1 | Botones de acción rápida |
| Balance KPI | `finance_balance_kpi` | 1×1 | KPI de balance general |

### General (1 — parametrizable)

| Widget | ID | Default Span | Descripción |
|--------|-----|-------------|-------------|
| Actividad | `activity_kpi` | 2×1 | Actividad reciente, `config.scope` determina el contexto |

---

## Cómo Crear un Widget Nuevo

### 1. Crear el componente

```tsx
// src/components/widgets/{domain}/my-widget.tsx
"use client";

import { BentoCard, BentoCardHeader, BentoCardBody } from "@/components/bento";
import { WidgetProps } from "@/components/bento/types";
import { MyIcon } from "lucide-react";

export function MyWidget({ config, initialData }: WidgetProps) {
    return (
        <BentoCard>
            <BentoCardHeader
                icon={<MyIcon className="h-4 w-4" />}
                title="Mi Widget"
                description="Descripción corta"
            />
            <BentoCardBody>
                {/* Contenido del widget — DEBE usar h-full w-full */}
                <div className="h-full w-full">
                    ...
                </div>
            </BentoCardBody>
        </BentoCard>
    );
}
```

### 2. Registrar en `registry.tsx`

```tsx
import { MyWidget } from "./domain/my-widget";

// Agregar al WIDGET_REGISTRY:
'my_widget_id': {
    id: 'my_widget_id',
    name: 'Mi Widget',
    description: 'Hace algo útil',
    component: MyWidget,
    defaultSpan: { w: 2, h: 1 },
    minSpan: { w: 1, h: 1 },
    category: 'operational',
    group: 'domain',
},
```

### 3. Agregar al layout por defecto

```tsx
// En DEFAULT_ORG_LAYOUT o DEFAULT_FINANCE_LAYOUT:
{ id: 'my_widget_id', x: 0, y: 3, w: 2, h: 1 },
```

### 4. (Opcional) Prefetch data

Si el widget necesita datos del server, agregar el fetch en la página:

```tsx
// En page.tsx
const myData = await fetchMyData(orgId);

<DashboardWidgetGrid
    prefetchedData={{ my_widget_id: myData }}
    ...
/>
```

---

## Widgets Parametrizables

Un widget parametrizable usa `configurable: true` y un `configPanel` para que el usuario cambie su comportamiento en modo edición:

```tsx
'activity_kpi': {
    configurable: true,
    defaultConfig: { scope: 'organization' },
    configPanel: ({ config, onConfigChange }) => (
        <Select value={config.scope} onValueChange={(v) => onConfigChange({ scope: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="organization">Organización</SelectItem>
                <SelectItem value="user">Mi actividad</SelectItem>
            </SelectContent>
        </Select>
    ),
}
```

El mismo componente puede aparecer múltiples veces con distintos configs usando `instanceId`.

---

## Presets (Componentes Reutilizables)

### BentoKpiCard

Card KPI con valor principal, tendencia (↑↓), badge de período, y sparkline opcional.

```tsx
<BentoKpiCard
    icon={<DollarSign />}
    title="Ingresos"
    value="$125,000"
    trend={{ value: 12.5, direction: 'up' }}
    period="Últimos 30 días"
    sparklineData={[100, 120, 90, 150, 130]}
/>
```

### BentoListCard

Card con lista scrollable de items.

```tsx
<BentoListCard
    icon={<List />}
    title="Últimos Movimientos"
    items={movements}
    renderItem={(item) => <MovementRow {...item} />}
    emptyMessage="Sin movimientos"
/>
```

---

## Modo Edición

El modo edición se controla desde `useDashboardEditStore`:

```tsx
import { useDashboardEditStore } from "@/stores/dashboard-edit-store";

// Leer estado
const isEditing = useDashboardEditStore((s) => s.isEditing);

// Toggle
const toggle = useDashboardEditStore((s) => s.toggleEditing);
```

En modo edición:
- Los widgets son **arrastrables** (handle ≡ en el header)
- Los widgets son **redimensionables** (handles en los 4 bordes + esquina SE)
- Aparece el **botón "+" para agregar widgets**
- Los widgets muestran **⚙ configuración** (si son configurables)
- Los widgets muestran **⋮ menú** para eliminar

---

## Persistencia

Los layouts se guardan en `localStorage` con claves:
- `seencel_org_layout_v4` — Dashboard de organización
- `seencel_finance_layout_v2` — Dashboard de finanzas

Al cargar, el sistema:
1. Intenta leer de localStorage
2. Si no hay datos, usa el layout por defecto del registry
3. Migra automáticamente layouts legacy (sin `x,y,w,h`) usando `SIZE_TO_SPAN`
4. Filtra widgets que ya no existen en el registry

---

## Reglas Técnicas

1. **Widgets SIEMPRE usan `h-full w-full`** — el grid controla el tamaño
2. **No hardcodear dimensiones** — el widget debe adaptarse al span que el usuario elija
3. **`defaultSpan` es obligatorio** — todo widget necesita un tamaño por defecto
4. **BentoCard es el wrapper visual estándar** — header con iconos + body
5. **Datos del server van por `prefetchedData`** — no hacer fetch en el widget client
6. **El registry es la fuente de verdad** — no crear widgets sin registrar
