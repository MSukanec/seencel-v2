"use client";

import { cn } from "@/lib/utils";
import { useMoney } from "@/hooks/use-money";
import { useMemo, Fragment } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// BASE HEATMAP — CSS Grid, zero dependencies
// ============================================================================
// Generic heatmap: rows × columns grid with color intensity based on value.
// Designed for "concept × month" views but fully reusable.
// Responsive: fills available width, cells remain square.
// ============================================================================

export interface HeatMapRow {
    id: string;
    label: string;
}

export interface HeatMapColumn {
    key: string;
    label: string;
}

export interface BaseHeatMapProps {
    /** Row labels (Y axis — e.g. concepts) */
    rows: HeatMapRow[];
    /** Column labels (X axis — e.g. months) */
    columns: HeatMapColumn[];
    /** Data matrix: row.id → col.key → numeric value */
    data: Record<string, Record<string, number>>;
    /** Format value for tooltip display */
    formatValue?: (value: number) => string;
    /** Label for empty cells in tooltip */
    emptyLabel?: string;
    /** Gap between cells in px */
    cellGap?: number;
}

export function BaseHeatMap({
    rows,
    columns,
    data,
    formatValue,
    emptyLabel = 'Sin pago',
    cellGap = 3,
}: BaseHeatMapProps) {
    const money = useMoney();
    const defaultFormat = (v: number) => money.format(v);
    const fmt = formatValue || defaultFormat;

    // Compute max value for opacity scaling
    const maxValue = useMemo(() => {
        let max = 0;
        for (const rowId of Object.keys(data)) {
            for (const colKey of Object.keys(data[rowId])) {
                const v = data[rowId][colKey];
                if (v > max) max = v;
            }
        }
        return max;
    }, [data]);

    const getOpacity = (value: number | undefined): number => {
        if (!value || value <= 0 || maxValue <= 0) return 0;
        return 0.2 + (value / maxValue) * 0.8;
    };

    return (
        <TooltipProvider delayDuration={100}>
            <div className="w-full overflow-x-auto overflow-y-visible">
                <div
                    className="grid items-center w-full"
                    style={{
                        gridTemplateColumns: `minmax(100px, 140px) repeat(${columns.length}, minmax(28px, 1fr))`,
                        gap: `${cellGap}px`,
                    }}
                >
                    {/* Header row — empty corner + column labels */}
                    <div /> {/* Empty corner */}
                    {columns.map(col => (
                        <div
                            key={col.key}
                            className="text-[10px] text-muted-foreground text-center font-medium truncate pb-1"
                            title={col.label}
                        >
                            {col.label}
                        </div>
                    ))}

                    {/* Data rows */}
                    {rows.map(row => (
                        <Fragment key={row.id}>
                            {/* Row label */}
                            <div
                                className="text-[11px] text-foreground font-medium truncate flex items-center pr-2"
                                title={row.label}
                            >
                                {row.label}
                            </div>

                            {/* Cells */}
                            {columns.map(col => {
                                const value = data[row.id]?.[col.key];
                                const hasValue = value !== undefined && value > 0;
                                const opacity = getOpacity(value);

                                return (
                                    <Tooltip key={`${row.id}-${col.key}`}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "rounded-[4px] transition-all cursor-default aspect-square w-full",
                                                    !hasValue && "bg-muted/20 border border-border/30",
                                                    "hover:ring-2 hover:ring-primary/60"
                                                )}
                                                style={hasValue ? {
                                                    backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(opacity * 100)}%, transparent)`,
                                                } : undefined}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="text-xs"
                                        >
                                            <p className="font-medium">{row.label}</p>
                                            <p className="text-muted-foreground">{col.label}</p>
                                            <p className={cn(
                                                "font-semibold mt-0.5",
                                                hasValue ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {hasValue ? fmt(value!) : emptyLabel}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
