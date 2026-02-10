import { ReactNode } from "react";

// ============================================================================
// WIDGET TYPES (Shared across all features)
// ============================================================================

/** Widget size as grid span { w: columns, h: rows } */
export interface WidgetSpan {
    w: number; // 1-4 columns
    h: number; // 1-N rows
}

/** @deprecated Use WidgetSpan instead. Kept for backward compat during migration. */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

/** Map legacy WidgetSize to WidgetSpan */
export const SIZE_TO_SPAN: Record<WidgetSize, WidgetSpan> = {
    sm: { w: 1, h: 1 },
    md: { w: 2, h: 1 },
    lg: { w: 2, h: 2 },
    wide: { w: 4, h: 1 },
    tall: { w: 1, h: 2 },
};

/** Widget category for grouping in the add-widget menu */
export type WidgetCategory = 'financial' | 'operational' | 'analytics' | 'general';

/** Props that every widget component receives from the grid */
export interface WidgetProps {
    /** @deprecated Will be removed. Use CSS to fill container. */
    size?: WidgetSize;
    config?: Record<string, any>;
    /** Pre-fetched data from server to avoid client-side waterfall */
    initialData?: any;
}

/** Definition of a single widget in the registry */
export interface WidgetDefinition {
    id: string;
    name: string;
    description?: string;
    /** Widget component. Should fill its container (h-full w-full). */
    component: React.ComponentType<any>;
    /** Default span in the grid */
    defaultSpan: WidgetSpan;
    /** Minimum span (resize limit) */
    minSpan?: WidgetSpan;
    /** Maximum span (resize limit) */
    maxSpan?: WidgetSpan;
    category: WidgetCategory;
    icon?: ReactNode;
    /** Domain group (matches widget folder: 'general', 'finance', etc.) */
    group: string;
    /** Default config for this widget when first added */
    defaultConfig?: Record<string, any>;
    /** If true, the widget is parametric (same component, different configs) */
    configurable?: boolean;
    /** Render function for the widget's settings panel (shown in edit mode) */
    configPanel?: (props: {
        config: Record<string, any>;
        onConfigChange: (newConfig: Record<string, any>) => void;
    }) => React.ReactNode;
    /** Optional link to the full page for this widget's data */
    href?: string;

    /** @deprecated Use defaultSpan instead */
    defaultSize?: WidgetSize;
}

/** Layout item for a single widget instance in the grid */
export interface WidgetLayoutItem {
    /** Widget definition ID */
    id: string;
    /** Position and size in the grid (react-grid-layout format) */
    x: number;
    y: number;
    w: number;
    h: number;
    /** Instance-specific configuration (e.g., scope, filters) */
    config?: Record<string, any>;
    /** Unique instance key (needed when same widget ID appears multiple times) */
    instanceId?: string;

    /** @deprecated Use x,y,w,h instead */
    size?: WidgetSize;
}
