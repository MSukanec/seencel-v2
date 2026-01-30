# Insights System

Sistema de reglas genéricas para generar insights analíticos en todo SEENCEL.

## Arquitectura

```
src/features/insights/
├── components/
│   └── insight-card.tsx       # UI para renderizar insights
├── hooks/
│   └── use-insight-persistence.ts  # Persistir insights descartados
├── logic/
│   ├── rules.ts               # Reglas genéricas del motor
│   ├── clients.ts             # ✅ Adapter: Clientes
│   ├── finance.ts             # ✅ Adapter: Finanzas
│   ├── general-costs.ts       # ✅ Adapter: Gastos Generales
│   ├── materials.ts           # ✅ Adapter: Materiales
│   └── real-estate-rules.ts   # Reglas específicas inmobiliarias
├── types.ts                   # Tipos e interfaces
└── README.md                  # Este archivo
```

## Patrón: Rules Engine

1. **`InsightContext`** - Interfaz genérica que abstrae datos (series de tiempo, categorías, totales)
2. **`InsightRule`** - Funciones puras que reciben contexto y retornan `Insight | null`
3. **Adapters** - Transforman datos específicos de cada feature al `InsightContext`

## Reglas Genéricas Disponibles

| Regla | Descripción | Archivo |
|-------|-------------|---------|
| `growthExplainedInsight` | Identifica qué categoría causó el aumento/disminución | `rules.ts` |
| `concentrationNarrativeInsight` | Detecta concentración de Pareto (80/20) | `rules.ts` |
| `sustainedTrendInsight` | Detecta tendencias sostenidas (+/-) | `rules.ts` |
| `yearEndProjectionInsight` | Proyección de cierre anual | `rules.ts` |

## Adapters por Feature

### Clients (`clients.ts`)
- Usado en: `clients-overview-view.tsx`
- Genera: Insights de cartera de clientes

### Finance (`finance.ts`)
- Usado en: `finances-overview-view.tsx`
- Genera: Insights financieros generales

### General Costs (`general-costs.ts`)
- Usado en: `general-costs-dashboard-view.tsx`
- Genera: Insights de gastos generales

### Materials (`materials.ts`)
- Usado en: `materials-overview-view.tsx`
- Genera: Insights de pagos de materiales
- Input: `{ monthlyData, typeDistribution, paymentCount, currentMonth }`

## Uso Típico

```tsx
import { generateMaterialsInsights } from "@/features/insights/logic/materials";

const insights = useMemo(() => {
    return generateMaterialsInsights({
        monthlyData: charts.monthlyEvolution.map(m => ({ month: m.month, value: m.amount })),
        typeDistribution: charts.typeDistribution,
        paymentCount: kpis.paymentCount,
        currentMonth: new Date().getMonth() + 1
    });
}, [charts, kpis.paymentCount]);
```

## Componente UI

```tsx
import { InsightCard } from "@/features/insights/components/insight-card";

{insights.map((insight) => (
    <InsightCard key={insight.id} insight={insight} />
))}
```

## Roadmap

- [ ] Eliminar `.replace()` de texto frágil → usar `termLabels` en contexto
- [ ] Agregar persistencia de insights descartados (localStorage/DB)
- [ ] Agregar `type: 'mutation'` para acciones correctivas
- [ ] Considerar AI synthesis para resumen ejecutivo
