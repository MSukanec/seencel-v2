// ============================================================================
// SEENCEL CARD SYSTEM — Unified visual components
// ============================================================================
// Single import point for all card types.
// Usage: import { MetricCard, ContentCard } from "@/components/cards";
// ============================================================================

// Base (internal — used by presets, not directly by features)
export { CardBase } from "./base/card-base";

// Presets — these are the public API
export { MetricCard } from "./presets/metric-card";
export type { MetricCardProps, CurrencyBreakdownItem } from "./presets/metric-card";

export { ContentCard } from "./presets/chart-card";
/** @deprecated Use ContentCard instead */
export { ContentCard as ChartCard } from "./presets/chart-card";

export { Sparkline } from "./base/sparkline";
