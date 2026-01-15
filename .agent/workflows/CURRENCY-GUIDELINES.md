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

## Key Files

| File | Purpose |
|------|---------|
| `types/currency.ts` | Type definitions |
| `lib/currency-utils.ts` | Calculation utilities |
| `providers/currency-context.tsx` | Global context + hook |
| `components/ui/money-display.tsx` | Display component |
| `components/ui/currency-selector.tsx` | Header toggle |

---

## Checklist for New Features

- [ ] Import `useCurrencyOptional` for context
- [ ] Use `formatCurrency()` from utils, never hardcode
- [ ] Use `sumMonetaryAmounts()` for sums
- [ ] Pass `currencyBreakdown` to KPIs when relevant
- [ ] Test with organization that has 2 currencies enabled
