// ============================================================================
// Gantt Chart — Generic Types
// ============================================================================
// Componente reutilizable, agnóstico del dominio.
// No sabe nada de "construction", "design" ni "project".

// ============================================================================
// Constants
// ============================================================================

export const GANTT_ROW_HEIGHT = 66;
export const GANTT_GROUP_ROW_HEIGHT = 33;
export const GANTT_HEADER_HEIGHT = 56;
export const GANTT_TASK_LIST_WIDTH = 300;
export const GANTT_TASK_LIST_MIN_WIDTH = 200;
export const GANTT_TASK_LIST_MAX_WIDTH = 500;
export const GANTT_BAR_HEIGHT = 42;
export const GANTT_BAR_VERTICAL_PADDING = (GANTT_ROW_HEIGHT - GANTT_BAR_HEIGHT) / 2;
export const GANTT_MILESTONE_SIZE = 16;
export const GANTT_DAY_WIDTH_BY_ZOOM: Record<GanttZoom, number> = {
    day: 50,
    week: 16,
    month: 5,
    quarter: 2,
};

// ============================================================================
// Core Types
// ============================================================================

export type GanttZoom = "day" | "week" | "month" | "quarter";

export interface GanttItem {
    id: string;
    label: string;
    subtitle?: string;
    startDate: Date;
    endDate: Date;
    actualStartDate?: Date;        // Real start (rendered inside planned bar)
    actualEndDate?: Date;          // Real end (rendered inside planned bar)
    progress: number;              // 0-100
    color?: string;                // Tailwind color class or hex
    statusColor?: string;          // Small indicator circle
    avatar?: {
        src?: string;
        fallback: string;
    };
    group?: string;                // Grouping label (phase, division)
    groupId?: string;              // Reference to GanttGroup.id
    isDisabled?: boolean;
    isMilestone?: boolean;         // Diamond shape instead of bar
}

export interface GanttGroup {
    id: string;
    label: string;
    isCollapsed: boolean;
}

/** A display row can be either a group header or a task item */
export type GanttDisplayRow =
    | { type: "group"; group: GanttGroup; itemCount: number; startDate: Date; endDate: Date }
    | { type: "item"; item: GanttItem; originalIndex: number };

export interface GanttDependency {
    id: string;
    fromId: string;
    toId: string;
    type: "FS" | "FF" | "SS" | "SF";
}

// ============================================================================
// Component Props
// ============================================================================

export interface GanttChartProps {
    items: GanttItem[];
    dependencies?: GanttDependency[];
    groups?: GanttGroup[];
    onGroupToggle?: (groupId: string) => void;
    onItemMove?: (id: string, newStart: Date, newEnd: Date) => void;
    onItemResize?: (id: string, newEnd: Date) => void;
    onItemClick?: (id: string) => void;
    onDependencyCreate?: (fromId: string, toId: string, type: GanttDependency["type"]) => void;
    onDependencyDelete?: (id: string) => void;
    zoom?: GanttZoom;
    onZoomChange?: (zoom: GanttZoom) => void;
    todayLine?: boolean;
    className?: string;
    readOnly?: boolean;
    /** Days of week that are non-working (0=Sun..6=Sat). Default: [0,6] (weekends) */
    nonWorkDays?: number[];
}

// ============================================================================
// Internal types (used by sub-components)
// ============================================================================

export interface GanttBarPosition {
    x: number;
    width: number;
    y: number;
    row: number;
}

export interface GanttTimeRange {
    start: Date;
    end: Date;
    totalDays: number;
}

export interface GanttHeaderCell {
    label: string;
    x: number;
    width: number;
    isWeekend?: boolean;
    date: Date;
}
