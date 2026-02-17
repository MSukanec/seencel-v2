"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

import {
    GanttChartProps,
    GanttItem,
    GanttZoom,
    GanttDisplayRow,
    GanttHeaderCell,
    GANTT_ROW_HEIGHT,
    GANTT_GROUP_ROW_HEIGHT,
    GANTT_HEADER_HEIGHT,
    GANTT_BAR_HEIGHT,
    GANTT_BAR_VERTICAL_PADDING,
    GANTT_DAY_WIDTH_BY_ZOOM,
} from "./gantt-types";
import { useGantt } from "./use-gantt";
import { GanttGrid } from "./gantt-grid";
import { GanttDependencyLines } from "./gantt-dependency-lines";
import { GanttTooltip } from "./gantt-tooltip";
import { TimelineRow } from "./gantt-timeline-row";
import { addDays } from "date-fns";

// ============================================================================
// GanttChart — Main orchestrator component
// ============================================================================

const ZOOM_ORDER: GanttZoom[] = ["day", "week", "month", "quarter"];

export function GanttChart({
    items,
    dependencies = [],
    groups,
    onGroupToggle,
    onItemMove,
    onItemResize,
    onItemClick,
    onDependencyCreate,
    onDependencyDelete,
    onRowReorder,
    zoom: controlledZoom,
    onZoomChange,
    todayLine = true,
    className,
    readOnly = false,
    nonWorkDays,
}: GanttChartProps) {
    // ========================================================================
    // State
    // ========================================================================

    const [internalZoom, setInternalZoom] = useState<GanttZoom>("day");
    const zoom = controlledZoom ?? internalZoom;
    const setZoom = onZoomChange ?? setInternalZoom;


    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragItemId, setDragItemId] = useState<string | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [resizeItemId, setResizeItemId] = useState<string | null>(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeOffset, setResizeOffset] = useState(0);

    // Row reorder drag state
    const [rowDragId, setRowDragId] = useState<string | null>(null);
    const [rowDropTargetId, setRowDropTargetId] = useState<string | null>(null);
    const [rowDropPosition, setRowDropPosition] = useState<"before" | "after">("after");

    // Flag to suppress click after drag/resize
    const justDraggedOrResized = useRef(false);

    // Connection state (drag to create dependency)
    const [connectingFrom, setConnectingFrom] = useState<{ id: string; side: "left" | "right" } | null>(null);
    const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);
    const [connectTargetId, setConnectTargetId] = useState<string | null>(null);

    // Tooltip state
    const [tooltipItem, setTooltipItem] = useState<GanttItem | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const containerRef = useRef<HTMLDivElement>(null);

    // ========================================================================
    // Hook
    // ========================================================================

    const {
        timeRange,
        totalWidth,
        dateToX,
        xToDate,
        getBarPosition,
        topHeaderCells,
        bottomHeaderCells,
        timelineRef,
        taskListRef,
        headerRef,
        syncScroll,
        todayX,
        dayWidth,
    } = useGantt({ items, zoom, nonWorkDays });

    // ========================================================================
    // Display rows (groups + items)
    // ========================================================================

    const displayRows: GanttDisplayRow[] = useMemo(() => {
        if (!groups || groups.length === 0) {
            // No groups → flat list
            return items.map((item, index) => ({ type: "item" as const, item, originalIndex: index }));
        }

        const rows: GanttDisplayRow[] = [];

        for (const group of groups) {
            const groupItems = items.filter(i => i.groupId === group.id);
            if (groupItems.length === 0) continue;

            // Compute group date range
            let minDate = groupItems[0].startDate;
            let maxDate = groupItems[0].endDate;
            for (const gi of groupItems) {
                if (gi.startDate < minDate) minDate = gi.startDate;
                if (gi.endDate > maxDate) maxDate = gi.endDate;
            }

            rows.push({
                type: "group",
                group,
                itemCount: groupItems.length,
                startDate: minDate,
                endDate: maxDate,
            });

            if (!group.isCollapsed) {
                for (const gi of groupItems) {
                    const originalIndex = items.indexOf(gi);
                    rows.push({ type: "item", item: gi, originalIndex });
                }
            }
        }

        // Items without group
        const ungrouped = items.filter(i => !i.groupId || !groups.some(g => g.id === i.groupId));
        for (const item of ungrouped) {
            const originalIndex = items.indexOf(item);
            rows.push({ type: "item", item, originalIndex });
        }

        return rows;
    }, [items, groups]);

    // Visible items (only item rows, for dependency lines and position lookups)
    const visibleItems = useMemo(() =>
        displayRows.filter((r): r is Extract<GanttDisplayRow, { type: "item" }> => r.type === "item").map(r => r.item),
        [displayRows]
    );

    // Row Y offsets — computed cumulatively for variable row heights
    const rowYOffsets = useMemo(() => {
        const offsets: number[] = [];
        let y = 0;
        for (const row of displayRows) {
            offsets.push(y);
            y += row.type === "group" ? GANTT_GROUP_ROW_HEIGHT : GANTT_ROW_HEIGHT;
        }
        return offsets;
    }, [displayRows]);

    // Map from item id → visual row index
    const itemVisualRowMap = useMemo(() => {
        const map = new Map<string, number>();
        displayRows.forEach((row, idx) => {
            if (row.type === "item") {
                map.set(row.item.id, idx);
            }
        });
        return map;
    }, [displayRows]);

    // Adjusted bar position using cumulative Y offsets
    const getVisualBarPosition = useCallback(
        (item: GanttItem) => {
            const visualRow = itemVisualRowMap.get(item.id) ?? 0;
            const x = dateToX(item.startDate);
            const endX = dateToX(item.endDate);
            const width = Math.max(endX - x, dayWidth);
            return {
                x,
                width,
                y: rowYOffsets[visualRow] ?? 0,
                row: visualRow,
            };
        },
        [itemVisualRowMap, rowYOffsets, dateToX, dayWidth]
    );

    const totalHeight = useMemo(() => {
        return displayRows.reduce((acc, row) =>
            acc + (row.type === "group" ? GANTT_GROUP_ROW_HEIGHT : GANTT_ROW_HEIGHT), 0);
    }, [displayRows]);

    // ========================================================================
    // Zoom controls
    // ========================================================================

    const handleZoomIn = useCallback(() => {
        const currentIndex = ZOOM_ORDER.indexOf(zoom);
        if (currentIndex > 0) {
            setZoom(ZOOM_ORDER[currentIndex - 1]);
        }
    }, [zoom, setZoom]);

    const handleZoomOut = useCallback(() => {
        const currentIndex = ZOOM_ORDER.indexOf(zoom);
        if (currentIndex < ZOOM_ORDER.length - 1) {
            setZoom(ZOOM_ORDER[currentIndex + 1]);
        }
    }, [zoom, setZoom]);

    const handleFitToView = useCallback(() => {
        if (!containerRef.current || items.length === 0) return;
        const containerWidth = containerRef.current.clientWidth;
        const totalDays = timeRange.totalDays;

        // Find best zoom level
        for (const z of ZOOM_ORDER) {
            const dayW = GANTT_DAY_WIDTH_BY_ZOOM[z];
            if (totalDays * dayW <= containerWidth) {
                setZoom(z);
                return;
            }
        }
        setZoom("quarter");
    }, [items.length, timeRange.totalDays, setZoom]);


    // ========================================================================
    // Bar drag & drop
    // ========================================================================

    const handleDragStart = useCallback((id: string, clientX: number) => {
        if (readOnly) return;
        setIsDragging(true);
        setDragItemId(id);
        setDragStartX(clientX);
        setDragOffset(0);
    }, [readOnly]);

    const handleResizeStart = useCallback((id: string, clientX: number) => {
        if (readOnly) return;
        setIsResizing(true);
        setResizeItemId(id);
        setResizeStartX(clientX);
        setResizeOffset(0);
    }, [readOnly]);

    // ========================================================================
    // Dependency connection (drag between bars)
    // ========================================================================

    const handleConnectStart = useCallback((id: string, side: "left" | "right") => {
        if (readOnly) return;
        setConnectingFrom({ id, side });
    }, [readOnly]);

    const handleConnectEnd = useCallback((targetId: string) => {
        if (!connectingFrom || connectingFrom.id === targetId) {
            setConnectingFrom(null);
            setConnectMousePos(null);
            setConnectTargetId(null);
            return;
        }
        // Always FS (Finish-to-Start) for now
        onDependencyCreate?.(connectingFrom.id, targetId, "FS");
        setConnectingFrom(null);
        setConnectMousePos(null);
        setConnectTargetId(null);
    }, [connectingFrom, onDependencyCreate]);

    // Track mouse during connection drag
    useEffect(() => {
        if (!connectingFrom) return;

        const handleMouseMove = (e: MouseEvent) => {
            const timeline = timelineRef.current;
            if (!timeline) return;
            const rect = timeline.getBoundingClientRect();
            setConnectMousePos({
                x: e.clientX - rect.left + timeline.scrollLeft,
                y: e.clientY - rect.top + timeline.scrollTop,
            });

            // Check if hovering over a bar for target highlight
            const target = (e.target as HTMLElement).closest("[data-gantt-bar-id]");
            if (target) {
                const barId = target.getAttribute("data-gantt-bar-id");
                if (barId && barId !== connectingFrom.id) {
                    setConnectTargetId(barId);
                } else {
                    setConnectTargetId(null);
                }
            } else {
                setConnectTargetId(null);
            }
        };

        const handleMouseUp = () => {
            // Dropped on empty space → cancel
            setConnectingFrom(null);
            setConnectMousePos(null);
            setConnectTargetId(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [connectingFrom]);

    // Global mouse move/up for drag & resize
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const delta = e.clientX - dragStartX;
                // Snap to day boundaries
                const snapped = Math.round(delta / dayWidth) * dayWidth;
                setDragOffset(snapped);
            }
            if (isResizing) {
                const delta = e.clientX - resizeStartX;
                // Snap to day boundaries
                const snapped = Math.round(delta / dayWidth) * dayWidth;
                setResizeOffset(snapped);
            }
        };

        const handleMouseUp = () => {
            if (isDragging && dragItemId) {
                const item = items.find((i) => i.id === dragItemId);
                if (item && dragOffset !== 0) {
                    const daysMoved = Math.round(dragOffset / dayWidth);
                    if (daysMoved !== 0) {
                        const newStart = addDays(item.startDate, daysMoved);
                        const newEnd = addDays(item.endDate, daysMoved);
                        onItemMove?.(dragItemId, newStart, newEnd);
                    }
                }
                // Suppress click that fires right after mouseup
                justDraggedOrResized.current = true;
                requestAnimationFrame(() => { justDraggedOrResized.current = false; });
                setIsDragging(false);
                setDragItemId(null);
                setDragOffset(0);
            }

            if (isResizing && resizeItemId) {
                const item = items.find((i) => i.id === resizeItemId);
                if (item && resizeOffset !== 0) {
                    const daysResized = Math.round(resizeOffset / dayWidth);
                    if (daysResized !== 0) {
                        const newEnd = addDays(item.endDate, daysResized);
                        if (newEnd > item.startDate) {
                            onItemResize?.(resizeItemId, newEnd);
                        }
                    }
                }
                // Suppress click that fires right after mouseup
                justDraggedOrResized.current = true;
                requestAnimationFrame(() => { justDraggedOrResized.current = false; });
                setIsResizing(false);
                setResizeItemId(null);
                setResizeOffset(0);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, isResizing, dragItemId, resizeItemId, dragStartX, resizeStartX, dragOffset, resizeOffset, dayWidth, items, onItemMove, onItemResize]);

    // ========================================================================
    // Tooltip
    // ========================================================================

    const handleBarMouseEnter = useCallback((item: GanttItem, e: React.MouseEvent) => {
        if (isDragging || isResizing) return;
        clearTimeout(tooltipTimeout.current);
        setTooltipItem(item);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        tooltipTimeout.current = setTimeout(() => {
            setTooltipVisible(true);
        }, 400);
    }, [isDragging, isResizing]);

    const handleBarMouseLeave = useCallback(() => {
        clearTimeout(tooltipTimeout.current);
        setTooltipVisible(false);
        setTooltipItem(null);
    }, []);

    const handleBarMouseMove = useCallback((e: React.MouseEvent) => {
        if (tooltipVisible) {
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    }, [tooltipVisible]);

    // ========================================================================
    // Scroll to today on mount
    // ========================================================================

    useEffect(() => {
        if (todayX !== null && timelineRef.current) {
            const containerWidth = timelineRef.current.clientWidth;
            timelineRef.current.scrollLeft = todayX - containerWidth / 2;
        }
    }, []); // Only on mount

    // ========================================================================
    // Row reorder drag & drop
    // ========================================================================

    const handleRowDragStart = useCallback((itemId: string) => {
        if (readOnly || !onRowReorder) return;
        setRowDragId(itemId);
    }, [readOnly, onRowReorder]);

    const handleRowDragOver = useCallback((targetItemId: string, position: "before" | "after") => {
        if (!rowDragId || rowDragId === targetItemId) {
            setRowDropTargetId(null);
            return;
        }

        // Constraint: only within the same group
        const dragItem = items.find(i => i.id === rowDragId);
        const targetItem = items.find(i => i.id === targetItemId);
        if (!dragItem || !targetItem) return;

        // Both must be in the same group (or both ungrouped)
        if (dragItem.groupId !== targetItem.groupId) {
            setRowDropTargetId(null);
            return;
        }

        setRowDropTargetId(targetItemId);
        setRowDropPosition(position);
    }, [rowDragId, items]);

    const handleRowDrop = useCallback(() => {
        if (rowDragId && rowDropTargetId && rowDragId !== rowDropTargetId) {
            onRowReorder?.(rowDragId, rowDropTargetId, rowDropPosition);
        }
        setRowDragId(null);
        setRowDropTargetId(null);
    }, [rowDragId, rowDropTargetId, rowDropPosition, onRowReorder]);

    const handleRowDragEnd = useCallback(() => {
        setRowDragId(null);
        setRowDropTargetId(null);
    }, []);

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative h-full w-full bg-background overflow-hidden",
                className
            )}
        >
            {/* Single scroll container — true canvas */}
            <div
                ref={timelineRef}
                className="h-full w-full overflow-auto"
                onScroll={() => syncScroll("timeline")}
            >
                <div
                    className="relative"
                    style={{
                        width: totalWidth,
                        height: totalHeight + GANTT_HEADER_HEIGHT,
                        minHeight: "100%",
                        minWidth: "100%",
                    }}
                >
                    {/* Sticky header inside scroll — stays at top */}
                    <div
                        ref={headerRef}
                        className="sticky top-0 z-20 bg-background border-b border-border"
                        style={{ height: GANTT_HEADER_HEIGHT }}
                    >
                        <div className="relative" style={{ width: totalWidth }}>
                            {/* Top row — Months/Years */}
                            <div
                                className="flex border-b border-border/50"
                                style={{ height: GANTT_HEADER_HEIGHT / 2 }}
                            >
                                {topHeaderCells.map((cell, i) => (
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

                            {/* Bottom row — Days/Weeks */}
                            <div
                                className="flex"
                                style={{ height: GANTT_HEADER_HEIGHT / 2 }}
                            >
                                {bottomHeaderCells.map((cell, i) => (
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

                    {/* Canvas body — offset below header */}
                    <div
                        className="relative"
                        style={{ minHeight: totalHeight }}
                    >
                        {/* Grid background — absolute layer behind rows */}
                        <div className="absolute inset-0 pointer-events-none">
                            <GanttGrid
                                bottomCells={bottomHeaderCells}
                                totalWidth={totalWidth}
                                totalHeight={totalHeight}
                                rowYOffsets={rowYOffsets}
                                todayX={todayX}
                                showTodayLine={todayLine}
                            />
                        </div>

                        {/* Dependency lines — absolute layer behind bars */}
                        <div className="absolute inset-0 pointer-events-none z-[1]">
                            <GanttDependencyLines
                                dependencies={dependencies}
                                items={visibleItems}
                                getPosition={(item: GanttItem) => getVisualBarPosition(item)}
                                dayWidth={dayWidth}
                                totalWidth={totalWidth}
                                totalHeight={totalHeight}
                                onDependencyClick={onDependencyDelete}
                            />
                        </div>

                        {/* Row-based rendering — each row is a complete component */}
                        {displayRows.map((row, rowIndex) => {
                            const rowKey = row.type === "group"
                                ? `row-${row.group.id}`
                                : `row-${row.item.id}`;

                            // Check if this specific item is being dragged or resized
                            const isItemDragging = row.type === "item" && isDragging && dragItemId === row.item.id;
                            const isItemResizing = row.type === "item" && isResizing && resizeItemId === row.item.id;

                            // Row reorder state
                            const isRowBeingDragged = row.type === "item" && rowDragId === row.item.id;
                            const isDropTarget = row.type === "item" && rowDropTargetId === row.item.id;
                            const dropPosition = isDropTarget ? rowDropPosition : undefined;

                            return (
                                <TimelineRow
                                    key={rowKey}
                                    row={row}
                                    totalWidth={totalWidth}
                                    dayWidth={dayWidth}
                                    dateToX={dateToX}
                                    getBarPosition={(item) => getVisualBarPosition(item)}
                                    readOnly={readOnly}
                                    isConnecting={!!connectingFrom}
                                    connectTargetId={connectTargetId}
                                    connectingFromId={connectingFrom?.id}
                                    isDragging={isItemDragging}
                                    dragOffset={isItemDragging ? dragOffset : 0}
                                    isResizing={isItemResizing}
                                    resizeOffset={isItemResizing ? resizeOffset : 0}
                                    onGroupToggle={onGroupToggle}
                                    onBarMouseEnter={handleBarMouseEnter}
                                    onBarMouseLeave={handleBarMouseLeave}
                                    onBarMouseMove={handleBarMouseMove}
                                    onDragStart={handleDragStart}
                                    onResizeStart={handleResizeStart}
                                    onItemClick={(id) => {
                                        if (justDraggedOrResized.current) return;
                                        onItemClick?.(id);
                                    }}
                                    onConnectStart={handleConnectStart}
                                    onConnectEnd={handleConnectEnd}
                                    // Row reorder props
                                    isRowDragging={isRowBeingDragged}
                                    isRowDropTarget={isDropTarget}
                                    rowDropPosition={dropPosition}
                                    isAnyRowDragging={!!rowDragId}
                                    canReorder={!!onRowReorder && !readOnly}
                                    onRowDragStart={handleRowDragStart}
                                    onRowDragOver={handleRowDragOver}
                                    onRowDrop={handleRowDrop}
                                    onRowDragEnd={handleRowDragEnd}
                                />
                            );
                        })}

                        {/* Connection line while dragging */}
                        {connectingFrom && connectMousePos && (() => {
                            const sourceItem = visibleItems.find(i => i.id === connectingFrom.id);
                            if (!sourceItem) return null;
                            const sourcePos = getVisualBarPosition(sourceItem);
                            const startX = connectingFrom.side === "right"
                                ? sourcePos.x + sourcePos.width + 6
                                : sourcePos.x - 6;
                            const startY = sourcePos.y + GANTT_BAR_VERTICAL_PADDING + (GANTT_BAR_HEIGHT / 2);
                            return (
                                <svg
                                    className="absolute inset-0 pointer-events-none"
                                    width={totalWidth}
                                    height={totalHeight}
                                    style={{ zIndex: 50 }}
                                >
                                    <line
                                        x1={startX}
                                        y1={startY}
                                        x2={connectMousePos.x}
                                        y2={connectMousePos.y}
                                        className="stroke-primary"
                                        strokeWidth="2"
                                        strokeDasharray="6 3"
                                        opacity="0.7"
                                    />
                                    <circle cx={startX} cy={startY} r="4" className="fill-primary" />
                                    <circle cx={connectMousePos.x} cy={connectMousePos.y} r="4" className="fill-primary" opacity="0.5" />
                                </svg>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Gradient blur masks — fixed over the canvas edges */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[100px] pointer-events-none z-30"
                style={{
                    background: "linear-gradient(to right, var(--background) 0%, transparent 100%)",
                }}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-[100px] pointer-events-none z-30"
                style={{
                    background: "linear-gradient(to left, var(--background) 0%, transparent 100%)",
                }}
            />

            {/* Floating zoom palette — centered bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={handleFitToView}
                    title="Ajustar a pantalla"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-4 bg-border/50" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={handleZoomIn}
                    disabled={zoom === "day"}
                    title="Acercar"
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-medium text-muted-foreground w-14 text-center capitalize select-none">
                    {zoom === "day" ? "Día" : zoom === "week" ? "Semana" : zoom === "month" ? "Mes" : "Trimestre"}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={handleZoomOut}
                    disabled={zoom === "quarter"}
                    title="Alejar"
                >
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Tooltip */}
            <GanttTooltip
                item={tooltipItem}
                x={tooltipPos.x}
                y={tooltipPos.y}
                visible={tooltipVisible}
            />
        </div>
    );
}
