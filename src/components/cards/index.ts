// ============================================================================
// SEENCEL CARD SYSTEM — Unified visual components
// ============================================================================
// Single import point for all card types.
// Usage: import { MetricCard, ChartCard, ListCard } from "@/components/cards";
// ============================================================================

// Base (internal — used by presets, not directly by features)
export { CardBase } from "./base/card-base";

// Presets — these are the public API
export { MetricCard } from "./presets/metric-card";
export type { MetricCardProps, CurrencyBreakdownItem } from "./presets/metric-card";

export { ChartCard } from "./presets/chart-card";

export { ListCard } from "./presets/list-card";
export type { ListCardItem } from "./presets/list-card";

export { InfoCard } from "./presets/info-card";

export { InsightCard } from "./presets/insight-card";
export type { Insight, InsightSeverity } from "./presets/insight-card";

export { Sparkline } from "./base/sparkline";
