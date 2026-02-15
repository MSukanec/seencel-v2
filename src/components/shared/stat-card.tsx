"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// StatCard — Shared presentational card that visually matches Widget aesthetic
// ============================================================================
// Use this for KPIs, mini-charts, and inline analytics in views that are NOT
// part of the configurable dashboard/bento grid.
//
// Visual DNA matches the Widget components (rounded-xl, border, shadow-sm,
// header with icon pill, etc.) but has NO dependency on the widget system.
// ============================================================================

// ── Types ──

export interface StatCardProps {
    /** Card title */
    title: string;
    /** Optional subtitle below title */
    subtitle?: string;
    /** Lucide icon for the header */
    icon?: LucideIcon;
    /** Optional action element in the header (button, badge, etc.) */
    headerAction?: React.ReactNode;
    /** Card body content — KPIs, charts, lists, anything */
    children: React.ReactNode;
    /** Additional className for the root container */
    className?: string;
    /** Additional className for the body */
    contentClassName?: string;
    /** If true, card height is auto. Otherwise fills parent (h-full) */
    compact?: boolean;
}

// ── Component ──

export function StatCard({
    title,
    subtitle,
    icon: Icon,
    headerAction,
    children,
    className,
    contentClassName,
    compact = false,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
                !compact && "h-full",
                className
            )}
        >
            {/* Header — matches Widget visual pattern */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && (
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-none truncate">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {headerAction && (
                    <div className="shrink-0 flex items-center gap-1">
                        {headerAction}
                    </div>
                )}
            </div>

            {/* Body — flexible content area */}
            <div className={cn("flex-1 overflow-y-auto", contentClassName)}>
                {children}
            </div>
        </div>
    );
}

// ── StatCard.Group — Layout container for multiple StatCards ──

export interface StatCardGroupProps {
    children: React.ReactNode;
    /** Number of columns (default: auto-fit with minmax) */
    columns?: 2 | 3 | 4;
    className?: string;
}

const COLUMN_CLASSES: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function StatCardGroup({
    children,
    columns = 2,
    className,
}: StatCardGroupProps) {
    return (
        <div className={cn("grid gap-4", COLUMN_CLASSES[columns], className)}>
            {children}
        </div>
    );
}
