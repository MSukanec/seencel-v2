// Bento Cards System
// A complete and scalable system for Bento-style dashboard layouts
//
// Architecture:
//   bento-card.tsx   → Parent shell (bg, border, header, body, footer, grid sizing)
//   bento-grid.tsx   → Grid layout container
//   presets/         → Content presets that compose BentoCard
//     bento-kpi-card.tsx  → KPI value + trend + chart
//     bento-list-card.tsx → Avatar list with ranks/badges

export { BentoGrid } from './bento-grid';
export { BentoCard, sizeStyles } from './bento-card';
export { BentoKpiCard } from './presets/bento-kpi-card';
export type { ChartDataPoint } from './presets/bento-kpi-card';
export { BentoListCard, type BentoListItem } from './presets/bento-list-card';
