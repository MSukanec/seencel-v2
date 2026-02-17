"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    GanttHeaderCell,
    GanttDisplayRow,
    GANTT_ROW_HEIGHT,
    GANTT_GROUP_ROW_HEIGHT,
} from "./gantt-types";

// ============================================================================
// Gantt Grid — Background lines + today line
// ============================================================================

interface GanttGridProps {
    bottomCells: GanttHeaderCell[];
    totalWidth: number;
    totalRows: number;
    displayRows?: GanttDisplayRow[];
    rowYOffsets?: number[];
    todayX: number | null;
    showTodayLine?: boolean;
}

export const GanttGrid = React.memo(function GanttGrid({
    bottomCells,
    totalWidth,
    totalRows,
    displayRows,
    rowYOffsets,
    todayX,
    showTodayLine = true,
}: GanttGridProps) {
    // Calculate totalHeight using accumulated offsets if available
    const totalHeight = rowYOffsets && displayRows
        ? (rowYOffsets[rowYOffsets.length - 1] ?? 0) + (displayRows[displayRows.length - 1]?.type === "group" ? GANTT_GROUP_ROW_HEIGHT : GANTT_ROW_HEIGHT)
        : totalRows * GANTT_ROW_HEIGHT;

    return (
        <div
            className="absolute inset-0 pointer-events-none h-full"
            style={{ width: totalWidth, minHeight: totalHeight }}
        >
            {/* Vertical grid lines */}
            {bottomCells.map((cell, i) => (
                <div
                    key={`vline-${i}`}
                    className={cn(
                        "absolute top-0 bottom-0 border-r",
                        cell.isWeekend
                            ? "border-border/20 bg-muted/40"
                            : "border-border/10"
                    )}
                    style={{
                        left: cell.x,
                        width: cell.width,
                    }}
                />
            ))}

            {/* Horizontal row lines */}
            {Array.from({ length: totalRows }).map((_, i) => {
                const lineY = rowYOffsets
                    ? (rowYOffsets[i] ?? 0) + (displayRows?.[i]?.type === "group" ? GANTT_GROUP_ROW_HEIGHT : GANTT_ROW_HEIGHT)
                    : (i + 1) * GANTT_ROW_HEIGHT;
                return (
                    <div
                        key={`hline-${i}`}
                        className="absolute left-0 border-b border-border/10"
                        style={{
                            top: lineY,
                            width: totalWidth,
                        }}
                    />
                );
            })}

            {/* Today line */}
            {showTodayLine && todayX !== null && (
                <div
                    className="absolute top-0 bottom-0 z-20"
                    style={{ left: todayX }}
                >
                    {/* Main line — full height */}
                    <div className="absolute inset-y-0 w-[2px] bg-primary/70" />

                    {/* Circle indicator at top */}
                    <div className="absolute -top-0.5 left-[1px] -translate-x-1/2">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                    </div>
                </div>
            )}
        </div>
    );
});
