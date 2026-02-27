// ============================================================================
// SEENCEL CARD SYSTEM — Unified visual components
// ============================================================================
// Single import point for all card types.
// Usage: import { MetricCard, ChartCard, ListCard } from "@/components/cards";
// ============================================================================

// Base (internal — used by presets, not directly by features)
export { CardBase } from "./card-base";

// Presets — these are the public API
export { MetricCard } from "./metric-card";
export type { MetricCardProps, CurrencyBreakdownItem } from "./metric-card";

export { ChartCard } from "./chart-card";

export { ListCard } from "./list-card";
export type { ListCardItem } from "./list-card";

export { InfoCard } from "./info-card";

export { InsightCard } from "./insight-card";
export type { Insight, InsightSeverity } from "./insight-card";

export { Sparkline } from "./sparkline";
