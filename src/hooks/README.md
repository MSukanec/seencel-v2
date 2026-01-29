# 🎣 Hooks

## useMoney - Single Source of Truth para Dinero

> **CRÍTICO**: Este es el ÚNICO hook que debe usarse para operaciones monetarias.
> Nunca implementes formateo o conversiones de moneda manualmente.

### Importación

```tsx
import { useMoney } from '@/hooks/use-money';
```

### Uso Básico

```tsx
function MyComponent() {
  const money = useMoney();
  
  // Formatear un monto
  const formatted = money.format(1500000); // "$ 1.500.000"
  
  // Calcular KPIs
  const kpis = money.calculateKPIs(movements);
  
  return <div>{formatted}</div>;
}
```

### API Completa

```tsx
const {
  // ═══ CONFIGURACIÓN ═══
  config,                 // MoneyConfig: currencies, rates, decimals
  displayMode,            // 'mix' | 'functional' | 'secondary'
  setDisplayMode,         // Cambiar modo de visualización
  displayCurrencyCode,    // Código de moneda actual ('ARS' o 'USD')
  primaryCurrencyCode,    // Siempre la moneda funcional
  
  // ═══ FORMATEO ═══
  format,                 // (amount, currencyCode?) => "$ 1.500.000"
  formatWithSign,         // (amount) => "+$ 1.500.000" 
  formatCompact,          // (amount) => "$ 1.5M"
  
  // ═══ CONVERSIÓN ═══
  calculateDisplayAmount, // Convierte MoneyInput según displayMode
  createMoney,            // Crea Money object desde MoneyInput
  
  // ═══ AGREGACIÓN ═══
  sum,                    // Suma con breakdown por moneda
  sumWithSign,            // Separa ingresos (amount_sign=1) / egresos (amount_sign=-1)
  
  // ═══ KPIs ═══
  calculateKPIs,          // { balance, income, expenses, ...trends }
  calculateCashFlow,      // Data para gráficos de evolución mensual
  calculateWalletBalances,// Saldos por wallet/cuenta
  
} = useMoney();
```

### DisplayMode

| Modo | Descripción |
|------|-------------|
| `'mix'` | Muestra cada monto en su moneda original. Para sumas, agrupa por moneda. |
| `'functional'` | Todo convertido a moneda primaria (típicamente ARS). USD × rate = ARS |
| `'secondary'` | Todo convertido a moneda secundaria (típicamente USD). ARS ÷ rate = USD |

### Ejemplo: Sumar con Breakdown

```tsx
const { sum, displayMode } = useMoney();

const payments = [
  { amount: 1000, currency_code: 'USD', exchange_rate: 1200 },
  { amount: 50000, currency_code: 'ARS' },
];

const result = sum(payments);
// En displayMode='functional':
// result.total = 1,250,000 (1000*1200 + 50000)
// result.breakdown = [
//   { currencyCode: 'ARS', nativeTotal: 50000, isPrimary: true },
//   { currencyCode: 'USD', nativeTotal: 1000, isPrimary: false },
// ]
```

### Ejemplo: KPIs

```tsx
const { calculateKPIs, format } = useMoney();

const kpis = calculateKPIs(movements);
// kpis = {
//   balance: 1500000,
//   income: 2000000,
//   expenses: 500000,
//   incomeVsExpensesRatio: 4.0,
//   ...
// }

<DashboardKpiCard amount={kpis.balance} />
```

### ⚠️ Reglas

1. **Nunca usar `toLocaleString()` para dinero** - Usar `money.format()`
2. **Nunca sumar amounts manualmente** - Usar `money.sum()`
3. **Nunca hardcodear exchange rates** - Vienen del config
4. **Nunca asumir 2 decimales** - Usar `config.decimalPlaces`

### Otros Hooks (No Monetarios)

| Hook | Uso |
|------|-----|
| `useModal` | Gestión de modales |
| `useCurrency` | Contexto de moneda (interno, preferir useMoney) |
| `useDisplayMode` | Modo de display (interno, preferir useMoney) |
