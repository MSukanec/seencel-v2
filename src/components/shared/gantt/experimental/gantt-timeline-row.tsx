"use client";

import React, { useCallback, useRef } from "react";
import {
    GanttItem,
    GanttBarPosition,
    GanttDisplayRow,
    GANTT_ROW_HEIGHT,
    GANTT_GROUP_ROW_HEIGHT,
    GANTT_BAR_HEIGHT,
    GANTT_BAR_VERTICAL_PADDING,
} from "./gantt-types";
import { GanttBar } from "./gantt-bar";
import { GripVertical } from "lucide-react";

// ============================================================================
// Props
// ============================================================================

interface TimelineRowProps {
    row: GanttDisplayRow;
    totalWidth: number;
    dayWidth: number;
    dateToX: (date: Date) => number;
    getBarPosition: (item: GanttItem) => GanttBarPosition;
    readOnly?: boolean;
    isConnecting?: boolean;
    connectTargetId?: string | null;
    connectingFromId?: string | null;
    /** Whether this item's BAR is being dragged (horizontal move) */
    isDragging?: boolean;
    dragOffset?: number;
    isResizing?: boolean;
    resizeOffset?: number;

    // — Bar events —
    onGroupToggle?: (groupId: string) => void;
    onBarMouseEnter?: (item: GanttItem, e: React.MouseEvent) => void;
    onBarMouseLeave?: () => void;
    onBarMouseMove?: (e: React.MouseEvent) => void;
    onDragStart?: (id: string, clientX: number) => void;
    onResizeStart?: (id: string, clientX: number) => void;
    onItemClick?: (id: string) => void;
    onConnectStart?: (id: string, side: "left" | "right") => void;
    onConnectEnd?: (id: string) => void;

    // — Row reorder —
    isRowDragging?: boolean;
    isRowDropTarget?: boolean;
    rowDropPosition?: "before" | "after";
    /** Whether ANY row is being dragged (for dimming other rows) */
    isAnyRowDragging?: boolean;
    canReorder?: boolean;
    onRowDragStart?: (itemId: string) => void;
    onRowDragOver?: (targetItemId: string, position: "before" | "after") => void;
    onRowDrop?: () => void;
    onRowDragEnd?: () => void;
}

// ============================================================================
// TimelineRow — A single full-width row (group header or task)
// ============================================================================

export const TimelineRow = React.memo(function TimelineRow({
    row,
    totalWidth,
    dayWidth,
    dateToX,
    getBarPosition,
    readOnly,
    isConnecting,
    connectTargetId,
    connectingFromId,
    isDragging,
    dragOffset = 0,
    isResizing,
    resizeOffset = 0,
    onGroupToggle,
    onBarMouseEnter,
    onBarMouseLeave,
    onBarMouseMove,
    onDragStart,
    onResizeStart,
    onItemClick,
    onConnectStart,
    onConnectEnd,
    isRowDragging,
    isRowDropTarget,
    rowDropPosition,
    isAnyRowDragging,
    canReorder,
    onRowDragStart,
    onRowDragOver,
    onRowDrop,
    onRowDragEnd,
}: TimelineRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    // ====================================================================
    // Row drag handlers (native HTML5 DnD)
    // ====================================================================

    const handleDragStart = useCallback((e: React.DragEvent) => {
        if (row.type !== "item" || !canReorder) return;

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", row.item.id);

        // Custom drag image — capture just this row
        if (rowRef.current) {
            const rect = rowRef.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(rowRef.current, rect.width / 2, rect.height / 2);
        }

        requestAnimationFrame(() => {
            onRowDragStart?.(row.item.id);
        });
    }, [row, canReorder, onRowDragStart]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (row.type !== "item" || !canReorder) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        const rect = rowRef.current?.getBoundingClientRect();
        if (rect) {
            const midY = rect.top + rect.height / 2;
            const position = e.clientY < midY ? "before" : "after";
            onRowDragOver?.(row.item.id, position);
        }
    }, [row, canReorder, onRowDragOver]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        onRowDrop?.();
    }, [onRowDrop]);

    const handleDragEnd = useCallback(() => {
        onRowDragEnd?.();
    }, [onRowDragEnd]);

    // ====================================================================
    // Drop indicator bar
    // ====================================================================
    const dropIndicator = isRowDropTarget && rowDropPosition && (
        <div
            className={`absolute left-0 right-0 h-[3px] bg-primary rounded-full z-30 ${rowDropPosition === "before" ? "-top-[1.5px]" : "-bottom-[1.5px]"
                }`}
        >
            <div className="absolute left-1 -top-[4px] w-[11px] h-[11px] rounded-full bg-primary border-2 border-background" />
        </div>
    );

    // ====================================================================
    // Group header row
    // ====================================================================
    if (row.type === "group") {
        const x = dateToX(row.startDate);
        const endX = dateToX(row.endDate);
        const barWidth = Math.max(endX - x, dayWidth);
        const groupBarHeight = GANTT_GROUP_ROW_HEIGHT - 10;
        const groupBarTop = (GANTT_GROUP_ROW_HEIGHT - groupBarHeight) / 2;

        return (
            <div
                ref={rowRef}
                className={`relative z-[2] w-full border-b border-border/20 bg-muted/5 transition-opacity duration-200 ${isAnyRowDragging ? "opacity-60" : ""
                    }`}
                style={{ height: GANTT_GROUP_ROW_HEIGHT, minWidth: totalWidth }}
                data-timeline-row="group"
                data-group-id={row.group.id}
            >
                {/* Sticky group label */}
                <div className="sticky left-0 z-10 inline-flex items-center h-full pointer-events-auto">
                    <span
                        className="sticky left-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none px-2 py-1 rounded hover:bg-muted/30 transition-colors"
                        onClick={() => onGroupToggle?.(row.group.id)}
                    >
                        <span className="text-[10px]">{row.group.isCollapsed ? "▸" : "▾"}</span>
                        {row.group.label}
                        <span className="text-[10px] font-normal text-muted-foreground/50">{row.itemCount}</span>
                    </span>
                </div>

                {/* Group summary bar */}
                <div
                    className="absolute"
                    style={{
                        left: x,
                        top: groupBarTop,
                        width: barWidth,
                        height: groupBarHeight,
                    }}
                >
                    <div className="h-full w-full rounded bg-muted-foreground/15 border border-muted-foreground/20" />
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-muted-foreground/40 rounded-[1px]" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-muted-foreground/40 rounded-[1px]" />
                </div>
            </div>
        );
    }

    // ====================================================================
    // Task item row
    // ====================================================================
    const item = row.item;
    let position = getBarPosition(item);

    if (isDragging) {
        position = { ...position, x: position.x + dragOffset };
    }
    if (isResizing) {
        position = { ...position, width: Math.max(dayWidth, position.width + resizeOffset) };
    }

    // Visual states
    const isDimmed = isAnyRowDragging && !isRowDragging && !isRowDropTarget;

    return (
        <div
            ref={rowRef}
            className={`
                relative z-[2] w-full border-b transition-all duration-200 group/row
                ${isRowDragging
                    ? "opacity-0 border-border/5"
                    : isDimmed
                        ? "opacity-50 border-border/5"
                        : "border-border/10 hover:bg-muted/5"
                }
            `}
            style={{ height: GANTT_ROW_HEIGHT, minWidth: totalWidth }}
            data-timeline-row="task"
            data-task-id={item.id}
            draggable={canReorder}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {/* Drop indicator */}
            {dropIndicator}

            {/* Sticky task label with drag handle */}
            <div className="sticky left-0 z-10 inline-flex items-center h-full pointer-events-none">
                <div className="sticky left-0 inline-flex items-center gap-0.5 pointer-events-auto">
                    {canReorder && (
                        <GripVertical
                            className="w-3.5 h-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground/50 cursor-grab active:cursor-grabbing transition-colors shrink-0 ml-1"
                        />
                    )}
                    <span className="text-[12px] font-medium text-foreground/70 max-w-[200px] truncate select-none group-hover/row:text-foreground/90 transition-colors">
                        {item.label}
                    </span>
                </div>
            </div>

            {/* Bar container */}
            <div
                className="absolute group"
                data-gantt-bar-id={item.id}
                style={{
                    left: position.x,
                    top: 0,
                    width: position.width,
                    height: GANTT_ROW_HEIGHT,
                }}
                onMouseEnter={(e) => onBarMouseEnter?.(item, e)}
                onMouseLeave={onBarMouseLeave}
                onMouseMove={onBarMouseMove}
            >
                <GanttBar
                    item={item}
                    position={position}
                    dayWidth={dayWidth}
                    readOnly={readOnly}
                    isConnecting={!!isConnecting}
                    isConnectTarget={connectingFromId !== item.id && connectTargetId === item.id}
                    onDragStart={onDragStart!}
                    onResizeStart={onResizeStart!}
                    onClick={(id) => onItemClick?.(id)}
                    onConnectStart={onConnectStart!}
                    onConnectEnd={onConnectEnd!}
                />
            </div>
        </div>
    );
});
