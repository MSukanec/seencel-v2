# Card System — `components/cards/`

Sistema unificado de cards para visualización de datos en **Seencel V2**.

> Todo dashboard usa estos componentes. No importa si es estático o dentro de un widget drag & drop —
> lo visual es siempre el mismo. Solo cambia el contenedor.

---

## Arquitectura

```
card-base.tsx       ← Compound component (Header / Body / Footer)
                       Controla: borde, bg, hover, padding, responsive
                       NUNCA se usa directo en features — solo los presets.

metric-card.tsx     ← Preset: KPI numérico con multi-moneda, trend, sparkline
chart-card.tsx      ← Preset: Wrapper para gráficos (de components/charts/)
list-card.tsx       ← Preset: Lista con avatars, valores, y "ver todos"
info-card.tsx       ← Preset: Dato contextual simple (tipo de cambio, estado)
insight-card.tsx    ← Card de insight / alerta / recomendación
sparkline.tsx       ← Mini gráfico SVG puro (sin Recharts)
index.ts            ← Re-exports centralizados
```

### Principio clave

```
CardBase   →  controla el LOOK (estilos visuales)
Presets    →  controlan el CONTENIDO (qué se muestra)
```

Si cambiás un estilo en `card-base.tsx`, **todas las cards cambian en toda la app**.

---

## Componentes

### `MetricCard` — Un número importante

```tsx
import { MetricCard } from "@/components/cards";

<MetricCard
    title="Balance Neto"
    amount={kpis.balance}           // Formato automático con useMoney
    icon={<Wallet className="h-5 w-5" />}
    trend={{ value: "12%", direction: "up", label: "vs mes anterior" }}
    sparkline={[100, 120, 90, 150, 180]}
    size="large"                    // default | large | hero
/>
```

**Features**: Multi-moneda (items prop), compact notation (31.4M), currency breakdown, sparkline integrado.

### `ChartCard` — Gráfico con contexto

```tsx
import { ChartCard } from "@/components/cards";
import { BaseDualAreaChart } from "@/components/charts";

<ChartCard
    title="Evolución Financiera"
    description="Ingresos vs Egresos"
    icon={<BarChart3 className="w-4 h-4" />}
    footer={<InsightCard insight={insight} />}
>
    <BaseDualAreaChart data={data} ... />
</ChartCard>
```

### `ListCard` — Lista con avatars

```tsx
import { ListCard } from "@/components/cards";

<ListCard
    title="Top Proveedores"
    icon={<Users className="w-4 h-4" />}
    items={providers.map(p => ({
        id: p.id,
        title: p.name,
        subtitle: p.category,
        value: money.format(p.total),
        valueIntent: "positive",
        avatar: p.image_url,
    }))}
    viewAllHref="/organization/contacts"
/>
```

### `InfoCard` — Dato contextual

```tsx
import { InfoCard } from "@/components/cards";

<InfoCard title="Tipo de Cambio" icon={<ArrowRightLeft />}>
    <p className="text-2xl font-bold">1 USD = $1.200 ARS</p>
    <p className="text-xs text-muted-foreground">Actualizado: hoy 15:00</p>
</InfoCard>
```

### `InsightCard` — Alertas y recomendaciones

```tsx
import { InsightCard } from "@/components/cards";

<InsightCard insight={{
    id: "1",
    title: "Concentración de gastos",
    description: "El 70% de los egresos van a un solo proveedor",
    severity: "warning",
    action: { label: "Ver detalle", onClick: () => {} }
}} />
```

---

## Relación con Widgets (Visión General)

Los **widgets** del dashboard de Visión General usan estos mismos componentes.
El sistema de widgets solo agrega la capa de **drag & drop** (`DashboardWidgetGrid`):

```
Widget Grid (drag & drop, resize)
├── BalanceKpiWidget   → usa MetricCard
├── EvolutionWidget    → usa ChartCard
├── TeamWidget         → usa ListCard
└── ExchangeWidget     → usa InfoCard
```

---

## Migraciones completadas

| Componente viejo | Reemplazado por | Estado |
|-----------------|-----------------|--------|
| `DashboardKpiCard` (`dashboard/`) | `MetricCard` | 🔄 En progreso |
| `DashboardCard` (`dashboard/`) | `ChartCard` | 🔄 En progreso |
| `InsightCard` (`dashboard/`) | `InsightCard` (`cards/`) | ✅ |
| `Sparkline` (`dashboard/`) | `Sparkline` (`cards/`) | ✅ |
| `BentoCard` (`widgets/grid/`) | `CardBase` | 📋 Pendiente |
| `BentoKpiCard` (`widgets/grid/presets/`) | `MetricCard` | 📋 Pendiente |
| `BentoListCard` (`widgets/grid/presets/`) | `ListCard` | 📋 Pendiente |

---

## Roadmap

- [ ] Migrar todas las features a `MetricCard` / `ChartCard`
- [ ] Migrar widgets de Visión General a usar presets de `cards/`
- [ ] Eliminar `components/dashboard/` completamente
- [ ] Eliminar `widgets/grid/presets/` y `widgets/grid/bento-card.tsx`
- [ ] Agregar `ProgressCard` para barras de progreso / metas
- [ ] Agregar soporte de `skeleton` loading integrado en CardBase
- [ ] Agregar `ComparisonCard` para comparar dos períodos
