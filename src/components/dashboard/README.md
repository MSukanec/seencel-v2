# 📊 Dashboard Components

> **IMPORTANTE**: Los componentes de dashboard ahora tienen integración con `useMoney()`.
> Usá el prop `amount` en lugar de `value` para formateo automático.

## Componentes

| Componente | Descripción |
|------------|-------------|
| `DashboardKpiCard` | Tarjeta KPI con valor, icono, trend y breakdown |
| `DashboardInsightCard` | Tarjetas de insights/alertas |
| `DashboardCard` | Card base para contenido custom |
| `Sparkline` | Mini gráfico de línea inline |

## DashboardKpiCard - Dual Mode

### ✅ Modo Nuevo (Recomendado)

```tsx
// Pasar número crudo - el componente formatea internamente
<DashboardKpiCard
  title="Balance"
  amount={kpis.balance}      // ← número crudo
  icon={<Wallet />}
/>
```

### ⚠️ Modo Legacy (Deprecado)

```tsx
// Pasar string pre-formateado (evitar en código nuevo)
<DashboardKpiCard
  title="Balance"
  value={money.format(kpis.balance)}  // ← string formateado
  icon={<Wallet />}
/>
```

## Props de DashboardKpiCard

| Prop | Tipo | Descripción |
|------|------|-------------|
| `amount` | `number` | **Nuevo** - Monto crudo, se formatea automáticamente |
| `items` | `MoneyInput[]` | **Nuevo** - Items para breakdown automático |
| `value` | `string \| number` | **Deprecado** - Valor pre-formateado |
| `title` | `string` | Título de la tarjeta |
| `icon` | `ReactNode` | Icono a mostrar |
| `trend` | `{ value, direction, label? }` | Indicador de tendencia |
| `currencyBreakdown` | `CurrencyBreakdownItem[]` | Breakdown manual (si no usás `items`) |
| `size` | `'default' \| 'large' \| 'hero'` | Tamaño del valor |
| `compact` | `boolean` | Notación compacta (1.5M) |

## Breakdown Automático

```tsx
// El componente calcula el breakdown automáticamente
<DashboardKpiCard
  title="Total Gastos"
  amount={totalAmount}
  items={payments}  // Array de { amount, currency_code, exchange_rate }
/>
// Muestra: "$ 5.2M" con subtítulo "+ US$ 2,500"
```

## Ejemplos

### KPI Simple
```tsx
<DashboardKpiCard
  title="Ingresos"
  amount={income}
  icon={<TrendingUp className="w-5 h-5" />}
  trend={{ value: 15, direction: "up", label: "vs mes anterior" }}
/>
```

### KPI con Breakdown
```tsx
<DashboardKpiCard
  title="Total Pagos"
  amount={totalPaid}
  items={allPayments}
  icon={<CreditCard className="w-5 h-5" />}
/>
```

### Hero KPI (Dashboard Principal)
```tsx
<DashboardKpiCard
  title="Balance General"
  amount={balance}
  size="hero"
  icon={<Wallet className="w-6 h-6" />}
/>
```

## Migración

```tsx
// ANTES
const money = useMoney();
const kpis = money.calculateKPIs(movements);

<DashboardKpiCard
  title="Balance"
  value={money.format(kpis.balance)}
  currencyBreakdown={...}
/>

// DESPUÉS
const { calculateKPIs } = useMoney();
const kpis = calculateKPIs(movements);

<DashboardKpiCard
  title="Balance"
  amount={kpis.balance}
  items={movements}  // Breakdown automático
/>
```
