# 💰 Money System - Single Source of Truth

> **IMPORTANTE**: Este directorio contiene la lógica central de manejo de dinero en SEENCEL.
> **NUNCA** implementes conversiones de moneda o formateo fuera de este sistema.

## Arquitectura

```
src/lib/money/
├── money.ts          # Tipos: Money, MoneyInput, MoneyConfig, DisplayMode
├── money-service.ts  # Conversiones: convertToFunctional, calculateDisplayAmount, sumMoney
├── money-formatter.ts # Formateo: formatAmount, formatMoney
├── kpi-calculator.ts # Analytics: calculateFinanceKPIs, calculateCashFlowData
└── index.ts          # Barrel exports

src/hooks/use-money.ts # Hook React que orquesta todo
```

## Reglas de Oro 🏆

### 1. Money como Objeto Inmutable
```typescript
// ✅ CORRECTO - Usar createMoney para crear objetos Money
const money = createMoney({
  amount: 1000,
  currency_code: 'USD',
  exchange_rate: 1200
}, config);

// ❌ INCORRECTO - Nunca usar números crudos para dinero
const total = payment1.amount + payment2.amount; // MAL!
```

### 2. Siempre Usar useMoney() en Componentes
```typescript
// ✅ CORRECTO
function MyComponent() {
  const { format, calculateDisplayAmount, sum } = useMoney();
  return <div>{format(amount)}</div>;
}

// ❌ INCORRECTO - Nunca formatear manualmente
return <div>${amount.toFixed(2)}</div>; // MAL!
```

### 3. Componentes con autoFormat
Los componentes de charts y KPIs ya tienen `useMoney` integrado:

```typescript
// ✅ CORRECTO - Solo pasar el número crudo
<DashboardKpiCard amount={kpis.balance} />
<BaseDonutChart data={data} /> // autoFormat=true por defecto

// ⚠️ LEGACY - Aún soportado pero deprecado
<DashboardKpiCard value={money.format(balance)} />
```

## DisplayMode

```typescript
type DisplayMode = 'mix' | 'functional' | 'secondary';
```

| Mode | Comportamiento |
|------|----------------|
| `mix` | Muestra montos en su moneda original |
| `functional` | Todo convertido a moneda primaria (ARS) |
| `secondary` | Todo convertido a moneda secundaria (USD) |

## Conversiones

```typescript
// USD → ARS: multiplicar por exchange_rate
const arsAmount = usdAmount * exchangeRate;

// ARS → USD: dividir por exchange_rate
const usdAmount = arsAmount / exchangeRate;
```

## API del Hook

```typescript
const {
  // Configuración
  config,           // MoneyConfig actual
  displayMode,      // 'mix' | 'functional' | 'secondary'
  setDisplayMode,   // Cambiar modo
  
  // Formateo
  format,           // (amount, currencyCode?) => string
  formatWithSign,   // Con signo + para positivos
  formatCompact,    // "1.5M" en lugar de "1.500.000"
  
  // Conversión
  calculateDisplayAmount, // Convierte según displayMode
  createMoney,            // Crea objeto Money
  
  // Agregación
  sum,              // Suma con breakdown por moneda
  sumWithSign,      // Separa ingresos/egresos
  
  // KPIs
  calculateKPIs,    // balance, income, expenses
  calculateCashFlow,// Data para gráficos de evolución
} = useMoney();
```

## ⚠️ Errores Comunes

1. **NO usar `functional_amount`** - Fue eliminado de la DB
2. **NO hacer math manualmente** - Siempre usar `sum()` o `calculateDisplayAmount()`
3. **NO formatear con toLocaleString()** - Usar `format()`
4. **NO asumir exchange_rate = 1** - Siempre verificar
