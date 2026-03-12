"use client";

import { cn } from "@/lib/utils";
import { useMoney } from "@/hooks/use-money";
import { useState, useMemo, Fragment } from "react";

// ============================================================================
// BASE HEATMAP — CSS Grid, zero dependencies
// ============================================================================
// Generic heatmap: rows × columns grid with color intensity based on value.
// Designed for "concept × month" views but fully reusable.
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
    /** Cell size in px */
    cellSize?: number;
    /** Gap between cells in px */
    cellGap?: number;
}

export function BaseHeatMap({
    rows,
    columns,
    data,
    formatValue,
    emptyLabel = 'Sin pago',
    cellSize = 32,
    cellGap = 3,
}: BaseHeatMapProps) {
    const money = useMoney();
    const defaultFormat = (v: number) => money.format(v);
    const fmt = formatValue || defaultFormat;

    const [hoveredCell, setHoveredCell] = useState<{ rowId: string; colKey: string } | null>(null);

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
        // Min opacity 0.2 to ensure visibility, max 1.0
        return 0.2 + (value / maxValue) * 0.8;
    };

    return (
        <div className="w-full overflow-x-auto">
            <div
                className="inline-grid items-center"
                style={{
                    gridTemplateColumns: `minmax(120px, auto) repeat(${columns.length}, ${cellSize}px)`,
                    gap: `${cellGap}px`,
                }}
            >
                {/* Header row — empty corner + column labels */}
                <div /> {/* Empty corner */}
                {columns.map(col => (
                    <div
                        key={col.key}
                        className="text-[10px] text-muted-foreground text-center font-medium truncate pb-1"
                        style={{ width: cellSize }}
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
                            className="text-[11px] text-foreground font-medium truncate flex items-center pr-3"
                            title={row.label}
                        >
                            {row.label}
                        </div>

                        {/* Cells */}
                        {columns.map(col => {
                            const value = data[row.id]?.[col.key];
                            const hasValue = value !== undefined && value > 0;
                            const opacity = getOpacity(value);
                            const isHovered = hoveredCell?.rowId === row.id && hoveredCell?.colKey === col.key;

                            return (
                                <div
                                    key={`${row.id}-${col.key}`}
                                    className={cn(
                                        "rounded-[4px] transition-all cursor-default relative",
                                        !hasValue && "bg-muted/15",
                                        isHovered && "ring-2 ring-primary/60"
                                    )}
                                    style={{
                                        width: cellSize,
                                        height: cellSize,
                                        ...(hasValue ? {
                                            backgroundColor: `hsl(var(--primary) / ${opacity})`,
                                        } : {}),
                                    }}
                                    onMouseEnter={() => setHoveredCell({ rowId: row.id, colKey: col.key })}
                                    onMouseLeave={() => setHoveredCell(null)}
                                >
                                    {/* Tooltip on hover */}
                                    {isHovered && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                            <div className="bg-background border border-border/50 rounded-lg shadow-xl px-2.5 py-1.5 whitespace-nowrap">
                                                <p className="text-[11px] font-medium text-foreground">{row.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{col.label}</p>
                                                <p className={cn(
                                                    "text-xs font-semibold mt-0.5",
                                                    hasValue ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {hasValue ? fmt(value!) : emptyLabel}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
