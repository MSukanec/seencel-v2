"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    GanttHeaderCell,
    GANTT_HEADER_HEIGHT,
} from "./gantt-types";

// ============================================================================
// Gantt Header — Dual row time scale
// ============================================================================

interface GanttHeaderProps {
    topCells: GanttHeaderCell[];
    bottomCells: GanttHeaderCell[];
    totalWidth: number;
    headerRef: React.RefObject<HTMLDivElement | null>;
    className?: string;
}

export const GanttHeader = React.memo(function GanttHeader({
    topCells,
    bottomCells,
    totalWidth,
    headerRef,
    className,
}: GanttHeaderProps) {
    return (
        <div
            ref={headerRef}
            className={cn(
                "relative overflow-hidden border-b border-border bg-muted/30 select-none shrink-0",
                className
            )}
            style={{ height: GANTT_HEADER_HEIGHT }}
        >
            <div className="relative" style={{ width: totalWidth }}>
                {/* Top row — Months/Years */}
                <div
                    className="flex border-b border-border/50"
                    style={{ height: GANTT_HEADER_HEIGHT / 2 }}
                >
                    {topCells.map((cell, i) => (
                        <div
                            key={`top-${i}`}
                            className="absolute flex items-center justify-center text-xs font-semibold text-muted-foreground capitalize truncate px-2"
                            style={{
                                left: cell.x,
                                width: cell.width,
                                height: GANTT_HEADER_HEIGHT / 2,
                            }}
                        >
                            {cell.label}
                        </div>
                    ))}
                </div>

                {/* Bottom row — Days/Weeks/Months */}
                <div
                    className="flex"
                    style={{ height: GANTT_HEADER_HEIGHT / 2 }}
                >
                    {bottomCells.map((cell, i) => (
                        <div
                            key={`bottom-${i}`}
                            className={cn(
                                "absolute flex items-center justify-center text-[11px] text-muted-foreground/70 border-r border-border/30 truncate",
                                cell.isWeekend
                                    ? "bg-muted/60 text-muted-foreground/40"
                                    : "text-foreground/80"
                            )}
                            style={{
                                left: cell.x,
                                width: cell.width,
                                height: GANTT_HEADER_HEIGHT / 2,
                                top: GANTT_HEADER_HEIGHT / 2,
                            }}
                        >
                            {cell.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
