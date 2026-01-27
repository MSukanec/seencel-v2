# Charts Component Library

## Overview

This directory contains **agnostic, reusable chart components** built on top of [Recharts](https://recharts.org/) and styled with [Shadcn/ui](https://ui.shadcn.com/) conventions.

All charts are designed to be:
- **Data-agnostic**: Accept generic data arrays with configurable keys
- **Theme-aware**: Use CSS variables for colors (`var(--color-*)`)
- **Responsive**: Adapt to container dimensions
- **Accessible**: Proper ARIA labels and keyboard navigation

## Directory Structure

```
charts/
├── area/               # Area-based visualizations
│   ├── base-area-chart.tsx      # Single area/line
│   └── base-dual-area-chart.tsx # Dual area comparison
├── bar/                # Bar/column charts
│   └── base-bar-chart.tsx
├── line/               # Line charts
│   └── base-line-chart.tsx
├── pie/                # Pie and donut charts
│   ├── base-pie-chart.tsx
│   └── base-donut-chart.tsx
├── waffle/             # Waffle/Pixel charts
│   └── base-waffle-chart.tsx    # Grid-based visualization
├── chart-config.ts     # Shared configuration & formatters
├── index.ts            # Re-exports for clean imports
└── README.md           # This file
```

## Usage Pattern

```tsx
import { BaseAreaChart, BaseDualAreaChart } from '@/components/charts';

// Single metric
<BaseAreaChart
    data={data}
    xKey="month"
    yKey="amount"
    height={250}
    gradient
/>

// Dual metric comparison
<BaseDualAreaChart
    data={data}
    xKey="month"
    primaryKey="paid"
    secondaryKey="balance"
    primaryLabel="Cobrado"
    secondaryLabel="Saldo Pendiente"
/>
```

## Configuration

All charts use `chart-config.ts` for shared defaults:

| Constant | Value | Description |
|----------|-------|-------------|
| `CHART_DEFAULTS.animationDuration` | 400ms | Animation speed |
| `CHART_DEFAULTS.gridColor` | `hsl(var(--border))` | Grid line color |
| `CHART_DEFAULTS.fontSize` | 12 | Axis label size |

## Formatting Functions

| Function | Purpose |
|----------|---------|
| `formatCurrency(value)` | Format as currency (e.g., $1.234) |
| `formatCompactNumber(value)` | Compact notation (e.g., 1.2K, 1.5M) |
| `formatPercent(value)` | Percentage format |

## Color Variables

Charts automatically resolve colors from CSS variables defined in the `config` prop:

```tsx
config={{
    paid: { label: "Cobrado", color: "hsl(var(--chart-1))" },
    balance: { label: "Saldo", color: "hsl(var(--chart-2))" }
}}
```

## Adding New Charts

1. Create component in appropriate subfolder
2. Follow naming convention: `Base[Type]Chart.tsx`
3. Accept `ChartConfig` for Shadcn compatibility
4. Export from `index.ts`
5. Add usage example to this README
