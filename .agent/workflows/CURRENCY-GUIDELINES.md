---
description: How to handle bi-currency/multi-currency in SEENCEL components and calculations
---

# Bi-Currency Guidelines

## Overview
SEENCEL supports **bi-monetary** organizations (e.g., ARS + USD in Argentina). All financial calculations and displays MUST respect this.

---

## Core Rules

### 1. Never Sum Amounts Directly
```typescript
// ❌ WRONG
const total = payments.reduce((sum, p) => sum + p.amount, 0);

// ✅ CORRECT - Use utilities
import { sumMonetaryAmounts } from '@/lib/currency-utils';
const { total } = sumMonetaryAmounts(payments, primaryCurrencyCode);
```

### 2. Use Context-Aware Formatting
```typescript
// ❌ WRONG
new Intl.NumberFormat('es-ES', { currency: 'USD' }).format(amount);

// ✅ CORRECT
import { formatCurrency } from '@/lib/currency-utils';
formatCurrency(amount, currencyContext?.primaryCurrency || 'ARS');
```

### 3. Access Currency Context
```typescript
// In client components:
import { useCurrencyOptional } from '@/providers/currency-context';

function MyComponent() {
  const ctx = useCurrencyOptional();
  const primaryCode = ctx?.primaryCurrency?.code || 'ARS';
}
```

---

## Display Components

### MoneyDisplay - For individual amounts
```tsx
<MoneyDisplay 
  amount={1000} 
  currency="USD" 
  exchangeRate={1500} 
  display="both" // 'original' | 'functional' | 'both' | 'auto'
/>
```

### DashboardKpiCard - With breakdown
```tsx
<DashboardKpiCard
  title="Total Cobrado"
  value={formatCurrency(total)}
  currencyBreakdown={getAmountsByCurrency(payments, primaryCode)}
/>
```

---

## Smart Currency Display (KPIs, Charts, Insights)

### The Problem
When displaying **aggregated totals** (KPIs, charts, insights), we can't just sum `amount` or `functional_amount`. We need **smart conversion** that:
- Preserves original USD values when displaying in USD
- Converts ARS to USD using current rate when displaying in USD
- Uses functional_amount (historical ARS) when displaying in ARS

### The Solution: `useSmartCurrency` Hook

```typescript
import { useSmartCurrency } from '@/hooks/use-smart-currency';

function MyDashboard({ payments }) {
    const { sumDisplayAmounts, groupAndSum, displayCurrencyCode } = useSmartCurrency();
    
    // Sum all payments correctly for current display currency
    const totalPaid = sumDisplayAmounts(payments);
    
    // Group by client and sum correctly
    const byClient = groupAndSum(payments, p => p.client_name);
    
    // Group by month and sum correctly
    const byMonth = groupAndSum(payments, p => p.payment_date.slice(0, 7));
}
```

### When to Use

| Scenario | Use Smart Currency? | Why |
|----------|---------------------|-----|
| KPI totals | ✅ YES | User expects correct display currency |
| Charts (donut, bar) | ✅ YES | Values must match KPIs |
| Insights calculations | ✅ YES | Analysis should respect display preference |
| Data tables | ❌ NO | Show original transaction values |
| Forms/inputs | ❌ NO | User enters actual amounts |
| CSV exports | ❌ NO | Export raw data |

### Hook Returns

```typescript
{
    calculateDisplayAmount(item) // Single item → number
    sumDisplayAmounts(items)     // Array → total number
    groupAndSum(items, keyFn)    // Array → Record<key, sum>
    displayCurrencyCode          // 'ARS' or 'USD'
    isSecondaryDisplay           // true if showing USD
    currentRate                  // Exchange rate being used
    primaryCurrencyCode          // 'ARS'
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `types/currency.ts` | Type definitions |
| `lib/currency-utils.ts` | Calculation utilities |
| `providers/currency-context.tsx` | Global context + hook |
| `hooks/use-smart-currency.ts` | **Smart display hook (for KPIs/Charts)** |
| `components/ui/money-display.tsx` | Display component |
| `components/ui/currency-selector.tsx` | Header toggle |

---

## Checklist for New Features

- [ ] Import `useCurrencyOptional` for context
- [ ] Use `useSmartCurrency` for KPIs, charts, and insights
- [ ] Use `formatCurrency()` from utils, never hardcode
- [ ] Use `sumMonetaryAmounts()` for basic sums (without display conversion)
- [ ] Pass `currencyBreakdown` to KPIs when relevant
- [ ] Test with organization that has 2 currencies enabled
