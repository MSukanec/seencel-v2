// Widget Grid System
// Infrastructure for resizable, draggable widget dashboards
//
// Architecture:
//   bento-card.tsx            → Flexible card shell (bg, border, header, body, footer)
//   dashboard-widget-grid.tsx → Resizable drag-and-drop widget grid (react-grid-layout)
//   types.ts                  → Shared widget types
//   presets/                  → Content presets that compose BentoCard
//     bento-kpi-card.tsx      → KPI value + trend + chart
//     bento-list-card.tsx     → Avatar list with ranks/badges

export { BentoCard, sizeStyles } from './bento-card';
export { BentoKpiCard } from './presets/bento-kpi-card';
export type { ChartDataPoint } from './presets/bento-kpi-card';
export { BentoListCard, type BentoListItem } from './presets/bento-list-card';
export { DashboardWidgetGrid } from './dashboard-widget-grid';
export { WidgetEmptyState } from './widget-empty-state';
export type { WidgetDefinition, WidgetSize, WidgetSpan, WidgetCategory, WidgetLayoutItem, WidgetProps } from './types';
export { SIZE_TO_SPAN } from './types';
