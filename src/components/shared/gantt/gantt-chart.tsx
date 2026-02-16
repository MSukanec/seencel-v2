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
    GANTT_ROW_HEIGHT,
    GANTT_HEADER_HEIGHT,
    GANTT_BAR_HEIGHT,
    GANTT_BAR_VERTICAL_PADDING,
    GANTT_TASK_LIST_WIDTH,
    GANTT_DAY_WIDTH_BY_ZOOM,
} from "./gantt-types";
import { useGantt } from "./use-gantt";
import { GanttHeader } from "./gantt-header";
import { GanttGrid } from "./gantt-grid";
import { GanttBar } from "./gantt-bar";
import { GanttTaskList } from "./gantt-task-list";
import { GanttDependencyLines } from "./gantt-dependency-lines";
import { GanttTooltip } from "./gantt-tooltip";
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

    const [taskListWidth, setTaskListWidth] = useState(GANTT_TASK_LIST_WIDTH);
    const [isResizingPanel, setIsResizingPanel] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragItemId, setDragItemId] = useState<string | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [resizeItemId, setResizeItemId] = useState<string | null>(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeOffset, setResizeOffset] = useState(0);

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

    // Map from item id → visual row index (accounting for group headers)
    const itemVisualRowMap = useMemo(() => {
        const map = new Map<string, number>();
        displayRows.forEach((row, idx) => {
            if (row.type === "item") {
                map.set(row.item.id, idx);
            }
        });
        return map;
    }, [displayRows]);

    // Adjusted bar position using visual row indices
    const getVisualBarPosition = useCallback(
        (item: GanttItem) => {
            const visualRow = itemVisualRowMap.get(item.id) ?? 0;
            const x = dateToX(item.startDate);
            const endX = dateToX(item.endDate);
            const width = Math.max(endX - x, dayWidth);
            return {
                x,
                width,
                y: visualRow * GANTT_ROW_HEIGHT,
                row: visualRow,
            };
        },
        [itemVisualRowMap, dateToX, dayWidth]
    );

    const totalHeight = displayRows.length * GANTT_ROW_HEIGHT;

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
        const containerWidth = containerRef.current.clientWidth - taskListWidth;
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
    }, [items.length, taskListWidth, timeRange.totalDays, setZoom]);

    // ========================================================================
    // Panel resize
    // ========================================================================

    const handlePanelResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingPanel(true);
        const startX = e.clientX;
        const startWidth = taskListWidth;

        const handleMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.max(200, Math.min(500, startWidth + delta));
            setTaskListWidth(newWidth);
        };

        const handleUp = () => {
            setIsResizingPanel(false);
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
    }, [taskListWidth]);

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
    // Render
    // ========================================================================

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex flex-col h-full w-full bg-background border border-border rounded-lg overflow-hidden",
                isResizingPanel && "select-none",
                className
            )}
        >
            {/* Toolbar row — Zoom controls */}
            <div className="flex items-center justify-end gap-1 px-3 py-1 border-b border-border bg-muted/20 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleFitToView}
                    title="Ajustar a pantalla"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomIn}
                    disabled={zoom === "day"}
                    title="Acercar"
                >
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] font-medium text-muted-foreground w-14 text-center capitalize">
                    {zoom === "day" ? "Día" : zoom === "week" ? "Semana" : zoom === "month" ? "Mes" : "Trimestre"}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleZoomOut}
                    disabled={zoom === "quarter"}
                    title="Alejar"
                >
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Main content: task list + timeline */}
            <div className="flex flex-1 min-h-0">
                {/* Task list panel */}
                <GanttTaskList
                    items={items}
                    displayRows={groups && groups.length > 0 ? displayRows : undefined}
                    taskListRef={taskListRef}
                    onScroll={() => syncScroll("taskList")}
                    onItemClick={onItemClick}
                    onGroupToggle={onGroupToggle}
                    width={taskListWidth}
                />

                {/* Panel resize handle */}
                <div
                    className={cn(
                        "w-1 shrink-0 cursor-col-resize transition-colors hover:bg-primary/20 active:bg-primary/30",
                        isResizingPanel && "bg-primary/30"
                    )}
                    onMouseDown={handlePanelResizeStart}
                />

                {/* Timeline area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Timeline header */}
                    <GanttHeader
                        topCells={topHeaderCells}
                        bottomCells={bottomHeaderCells}
                        totalWidth={totalWidth}
                        headerRef={headerRef}
                    />

                    {/* Timeline body (scrollable) */}
                    <div
                        ref={timelineRef}
                        className="flex-1 overflow-auto relative"
                        onScroll={() => syncScroll("timeline")}
                    >
                        <div
                            className="relative"
                            style={{
                                width: totalWidth,
                                height: totalHeight,
                                minHeight: "100%",
                            }}
                        >
                            {/* Grid background */}
                            <GanttGrid
                                bottomCells={bottomHeaderCells}
                                totalWidth={totalWidth}
                                totalRows={displayRows.length}
                                todayX={todayX}
                                showTodayLine={todayLine}
                            />

                            {/* Dependency lines (behind bars) */}
                            <GanttDependencyLines
                                dependencies={dependencies}
                                items={visibleItems}
                                getPosition={(item: GanttItem) => getVisualBarPosition(item)}
                                dayWidth={dayWidth}
                                totalWidth={totalWidth}
                                totalHeight={totalHeight}
                                onDependencyClick={onDependencyDelete}
                            />

                            {/* Group summary bars */}
                            {displayRows.map((row, rowIndex) => {
                                if (row.type !== "group") return null;
                                const x = dateToX(row.startDate);
                                const endX = dateToX(row.endDate);
                                const width = Math.max(endX - x, dayWidth);
                                const y = rowIndex * GANTT_ROW_HEIGHT;
                                return (
                                    <div
                                        key={`group-bar-${row.group.id}`}
                                        className="absolute"
                                        style={{
                                            left: x,
                                            top: y + GANTT_BAR_VERTICAL_PADDING + 2,
                                            width,
                                            height: GANTT_BAR_HEIGHT - 4,
                                        }}
                                    >
                                        {/* Summary bar background */}
                                        <div className="h-full w-full rounded bg-muted-foreground/15 border border-muted-foreground/20" />
                                        {/* Diamond endpoints */}
                                        <div
                                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-muted-foreground/40 rounded-[1px]"
                                        />
                                        <div
                                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-muted-foreground/40 rounded-[1px]"
                                        />
                                    </div>
                                );
                            })}

                            {/* Task bars */}
                            {visibleItems.map((item) => {
                                let position = getVisualBarPosition(item);

                                // Apply drag offset
                                if (isDragging && dragItemId === item.id) {
                                    position = {
                                        ...position,
                                        x: position.x + dragOffset,
                                    };
                                }

                                // Apply resize offset
                                if (isResizing && resizeItemId === item.id) {
                                    position = {
                                        ...position,
                                        width: Math.max(dayWidth, position.width + resizeOffset),
                                    };
                                }

                                return (
                                    <div
                                        key={item.id}
                                        className="absolute group"
                                        data-gantt-bar-id={item.id}
                                        style={{
                                            left: position.x,
                                            top: position.y,
                                            width: position.width,
                                            height: GANTT_ROW_HEIGHT,
                                        }}
                                        onMouseEnter={(e) => handleBarMouseEnter(item, e)}
                                        onMouseLeave={handleBarMouseLeave}
                                        onMouseMove={handleBarMouseMove}
                                    >
                                        <GanttBar
                                            item={item}
                                            position={position}
                                            dayWidth={dayWidth}
                                            readOnly={readOnly}
                                            isConnecting={!!connectingFrom}
                                            isConnectTarget={connectingFrom?.id !== item.id && connectTargetId === item.id}
                                            onDragStart={handleDragStart}
                                            onResizeStart={handleResizeStart}
                                            onClick={(id) => {
                                                if (justDraggedOrResized.current) return;
                                                onItemClick?.(id);
                                            }}
                                            onConnectStart={handleConnectStart}
                                            onConnectEnd={handleConnectEnd}
                                        />
                                    </div>
                                );
                            })}
                            {/* Temporary connection line while dragging */}
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
                                        <circle
                                            cx={startX}
                                            cy={startY}
                                            r="4"
                                            className="fill-primary"
                                        />
                                        <circle
                                            cx={connectMousePos.x}
                                            cy={connectMousePos.y}
                                            r="4"
                                            className="fill-primary"
                                            opacity="0.5"
                                        />
                                    </svg>
                                );
                            })()}
                        </div>
                    </div>
                </div>
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
