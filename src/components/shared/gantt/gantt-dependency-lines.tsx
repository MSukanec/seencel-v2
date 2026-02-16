"use client";

import React, { useMemo } from "react";
import {
    GanttItem,
    GanttDependency,
    GanttBarPosition,
    GANTT_BAR_HEIGHT,
    GANTT_BAR_VERTICAL_PADDING,
    GANTT_ROW_HEIGHT,
} from "./gantt-types";

// ============================================================================
// Gantt Dependency Lines — Orthogonal routed lines between bars
// ============================================================================

interface GanttDependencyLinesProps {
    dependencies: GanttDependency[];
    items: GanttItem[];
    getPosition: (item: GanttItem, index?: number) => GanttBarPosition;
    dayWidth: number;
    totalWidth: number;
    totalHeight: number;
    onDependencyClick?: (id: string) => void;
}

export const GanttDependencyLines = React.memo(function GanttDependencyLines({
    dependencies,
    items,
    getPosition,
    dayWidth,
    totalWidth,
    totalHeight,
    onDependencyClick,
}: GanttDependencyLinesProps) {
    const itemIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach((item, index) => {
            map.set(item.id, index);
        });
        return map;
    }, [items]);

    const lines = useMemo(() => {
        const stubLength = dayWidth / 2; // Half-day horizontal stub
        const barCenterY = GANTT_BAR_VERTICAL_PADDING + GANTT_BAR_HEIGHT / 2;

        return dependencies.map((dep) => {
            const fromIndex = itemIndexMap.get(dep.fromId);
            const toIndex = itemIndexMap.get(dep.toId);

            if (fromIndex === undefined || toIndex === undefined) return null;

            const fromItem = items[fromIndex];
            const toItem = items[toIndex];
            const fromPos = getPosition(fromItem, fromIndex);
            const toPos = getPosition(toItem, toIndex);

            // Source point (FS = end of from bar)
            let x1: number, y1: number;
            let stubDir1: number; // +1 = right, -1 = left

            switch (dep.type) {
                case "FS":
                case "FF":
                    x1 = fromPos.x + fromPos.width;
                    stubDir1 = 1; // stub goes right
                    break;
                case "SS":
                case "SF":
                    x1 = fromPos.x;
                    stubDir1 = -1; // stub goes left
                    break;
            }
            y1 = fromPos.y + barCenterY;

            // Target point (FS = start of to bar)
            let x2: number, y2: number;
            let stubDir2: number;

            switch (dep.type) {
                case "FS":
                case "SS":
                    x2 = toPos.x;
                    stubDir2 = -1; // stub goes left (enters from left)
                    break;
                case "FF":
                case "SF":
                    x2 = toPos.x + toPos.width;
                    stubDir2 = 1; // stub goes right
                    break;
            }
            y2 = toPos.y + barCenterY;

            // Stub endpoints
            const stubEndX1 = x1 + stubDir1 * stubLength;
            const stubEndX2 = x2 + stubDir2 * stubLength;

            // Horizontal line Y = on the row divider between the two rows
            // Use the divider that's between the two bars
            const minRow = Math.min(fromIndex, toIndex);
            const maxRow = Math.max(fromIndex, toIndex);
            const horizontalY = (minRow + 1) * GANTT_ROW_HEIGHT; // bottom of the upper row = divider line

            // Build the orthogonal path:
            // 1. Horizontal stub from source bar
            // 2. Vertical from stub to the divider line
            // 3. Horizontal along divider to align with target stub
            // 4. Vertical from divider to target stub height
            // 5. Horizontal stub to target bar
            const path =
                `M ${x1} ${y1} ` +           // Start at source bar edge
                `L ${stubEndX1} ${y1} ` +     // Horizontal stub from source
                `L ${stubEndX1} ${horizontalY} ` + // Vertical to divider
                `L ${stubEndX2} ${horizontalY} ` + // Horizontal along divider
                `L ${stubEndX2} ${y2} ` +     // Vertical to target height
                `L ${x2} ${y2}`;              // Horizontal stub to target

            return { dep, path };
        }).filter(Boolean) as { dep: GanttDependency; path: string }[];
    }, [dependencies, items, itemIndexMap, getPosition, dayWidth]);

    if (lines.length === 0) return null;

    return (
        <svg
            className="absolute inset-0 pointer-events-none z-10"
            width={totalWidth}
            height={totalHeight}
        >
            <defs>
                {/* Arrowhead marker */}
                <marker
                    id="gantt-arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <polygon
                        points="0 0, 8 3, 0 6"
                        className="fill-muted-foreground/60"
                    />
                </marker>
                <marker
                    id="gantt-arrowhead-hover"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <polygon
                        points="0 0, 8 3, 0 6"
                        className="fill-primary"
                    />
                </marker>
            </defs>

            {lines.map(({ dep, path }) => (
                <g key={dep.id} className="group/dep">
                    {/* Invisible wider path for click target */}
                    <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => onDependencyClick?.(dep.id)}
                    />
                    {/* Visible path */}
                    <path
                        d={path}
                        fill="none"
                        className="stroke-muted-foreground/40 group-hover/dep:stroke-primary transition-colors"
                        strokeWidth={1.5}
                        strokeDasharray={dep.type !== "FS" ? "4 3" : undefined}
                        markerEnd="url(#gantt-arrowhead)"
                    />
                </g>
            ))}
        </svg>
    );
});
