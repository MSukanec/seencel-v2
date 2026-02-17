"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    GanttItem,
    GanttZoom,
    GanttTimeRange,
    GanttBarPosition,
    GanttHeaderCell,
    GANTT_ROW_HEIGHT,
    GANTT_DAY_WIDTH_BY_ZOOM,
} from "./gantt-types";
import {
    startOfDay,
    endOfDay,
    addDays,
    differenceInDays,
    differenceInCalendarDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    format,
    isSameMonth,
    isToday,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";

// ============================================================================
// Hook
// ============================================================================

interface UseGanttOptions {
    items: GanttItem[];
    zoom: GanttZoom;
    paddingDays?: number;
    /** Days of week that are non-working (0=Sun..6=Sat). Default: [0,6] */
    nonWorkDays?: number[];
}

interface UseGanttReturn {
    // Time range
    timeRange: GanttTimeRange;
    totalWidth: number;

    // Conversions
    dateToX: (date: Date) => number;
    xToDate: (x: number) => Date;
    getBarPosition: (item: GanttItem, rowIndex: number) => GanttBarPosition;

    // Header cells
    topHeaderCells: GanttHeaderCell[];
    bottomHeaderCells: GanttHeaderCell[];

    // Scroll sync
    timelineRef: React.RefObject<HTMLDivElement | null>;
    taskListRef: React.RefObject<HTMLDivElement | null>;
    headerRef: React.RefObject<HTMLDivElement | null>;
    syncScroll: (source: "timeline" | "taskList") => void;

    // Today
    todayX: number | null;

    // Day width
    dayWidth: number;
}

export function useGantt({ items, zoom, paddingDays = 7, nonWorkDays = [0, 6] }: UseGanttOptions): UseGanttReturn {
    const timelineRef = useRef<HTMLDivElement>(null);
    const taskListRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const dayWidth = GANTT_DAY_WIDTH_BY_ZOOM[zoom];

    // ========================================================================
    // Time range calculation
    // ========================================================================

    const timeRange = useMemo<GanttTimeRange>(() => {
        const today = new Date();

        // Minimum range: always show at least -30 days ← today → +90 days
        const minRangeStart = addDays(startOfDay(today), -30);
        const minRangeEnd = addDays(endOfDay(today), 90);

        let rangeStart: Date;
        let rangeEnd: Date;

        if (items.length === 0) {
            rangeStart = minRangeStart;
            rangeEnd = minRangeEnd;
        } else {
            // Find actual min/max from items
            let minDate = items[0].startDate;
            let maxDate = items[0].endDate;

            for (const item of items) {
                if (item.startDate < minDate) minDate = item.startDate;
                if (item.endDate > maxDate) maxDate = item.endDate;
            }

            // Add padding to task range
            const taskStart = addDays(startOfDay(minDate), -paddingDays);
            const taskEnd = addDays(endOfDay(maxDate), paddingDays);

            // Union: take the earliest start and latest end
            rangeStart = taskStart < minRangeStart ? taskStart : minRangeStart;
            rangeEnd = taskEnd > minRangeEnd ? taskEnd : minRangeEnd;
        }

        // Align to period boundaries based on zoom
        let alignedStart = rangeStart;
        let alignedEnd = rangeEnd;

        switch (zoom) {
            case "day":
                alignedStart = startOfDay(rangeStart);
                alignedEnd = endOfDay(rangeEnd);
                break;
            case "week":
                alignedStart = startOfWeek(rangeStart, { locale: es });
                alignedEnd = endOfWeek(rangeEnd, { locale: es });
                break;
            case "month":
                alignedStart = startOfMonth(rangeStart);
                alignedEnd = endOfMonth(rangeEnd);
                break;
            case "quarter":
                alignedStart = startOfQuarter(rangeStart);
                alignedEnd = endOfQuarter(rangeEnd);
                break;
        }

        return {
            start: alignedStart,
            end: alignedEnd,
            totalDays: differenceInDays(alignedEnd, alignedStart),
        };
    }, [items, zoom, paddingDays]);

    // ========================================================================
    // Total width
    // ========================================================================

    const totalWidth = useMemo(() => {
        return timeRange.totalDays * dayWidth;
    }, [timeRange.totalDays, dayWidth]);

    // ========================================================================
    // Coordinate conversions
    // ========================================================================

    const dateToX = useCallback(
        (date: Date): number => {
            const days = differenceInDays(date, timeRange.start);
            return days * dayWidth;
        },
        [timeRange.start, dayWidth]
    );

    const xToDate = useCallback(
        (x: number): Date => {
            const days = Math.round(x / dayWidth);
            return addDays(timeRange.start, days);
        },
        [timeRange.start, dayWidth]
    );

    const getBarPosition = useCallback(
        (item: GanttItem, rowIndex: number): GanttBarPosition => {
            const x = dateToX(item.startDate);
            const endX = dateToX(item.endDate);
            const width = Math.max(endX - x, dayWidth); // Minimum 1 day

            return {
                x,
                width,
                y: rowIndex * GANTT_ROW_HEIGHT,
                row: rowIndex,
            };
        },
        [dateToX, dayWidth]
    );

    // ========================================================================
    // Header cells
    // ========================================================================

    const topHeaderCells = useMemo<GanttHeaderCell[]>(() => {
        const cells: GanttHeaderCell[] = [];
        const { start, end } = timeRange;

        switch (zoom) {
            case "day":
            case "week": {
                // Top row: months
                const months = eachMonthOfInterval({ start, end });
                for (let i = 0; i < months.length; i++) {
                    const monthStart = i === 0 ? start : months[i];
                    const monthEnd = i < months.length - 1
                        ? addDays(months[i + 1], -1)
                        : end;

                    const x = dateToX(monthStart);
                    const endX = dateToX(monthEnd);

                    cells.push({
                        label: format(months[i], "MMMM yyyy", { locale: es }),
                        x,
                        width: endX - x,
                        date: months[i],
                    });
                }
                break;
            }
            case "month":
            case "quarter": {
                // Top row: years
                const years = new Set(
                    eachMonthOfInterval({ start, end }).map((d) => d.getFullYear())
                );
                for (const year of years) {
                    const yearStart = new Date(year, 0, 1);
                    const yearEnd = new Date(year, 11, 31);
                    const clampedStart = yearStart < start ? start : yearStart;
                    const clampedEnd = yearEnd > end ? end : yearEnd;
                    const x = dateToX(clampedStart);
                    const endX = dateToX(clampedEnd);

                    cells.push({
                        label: year.toString(),
                        x,
                        width: endX - x,
                        date: clampedStart,
                    });
                }
                break;
            }
        }

        return cells;
    }, [timeRange, zoom, dateToX]);

    const bottomHeaderCells = useMemo<GanttHeaderCell[]>(() => {
        const cells: GanttHeaderCell[] = [];
        const { start, end } = timeRange;

        switch (zoom) {
            case "day": {
                // Bottom row: individual days
                const days = eachDayOfInterval({ start, end });
                for (const day of days) {
                    cells.push({
                        label: format(day, "EEE d", { locale: es }).toUpperCase(),
                        x: dateToX(day),
                        width: dayWidth,
                        isWeekend: nonWorkDays.includes(day.getDay()),
                        date: day,
                    });
                }
                break;
            }
            case "week": {
                // Bottom row: weeks
                const weeks = eachWeekOfInterval({ start, end }, { locale: es });
                for (const week of weeks) {
                    const weekEnd = endOfWeek(week, { locale: es });
                    const x = dateToX(week);
                    const endX = dateToX(weekEnd);

                    cells.push({
                        label: format(week, "d MMM", { locale: es }),
                        x,
                        width: endX - x,
                        date: week,
                    });
                }
                break;
            }
            case "month": {
                // Bottom row: months
                const months = eachMonthOfInterval({ start, end });
                for (const month of months) {
                    const monthEnd = endOfMonth(month);
                    const x = dateToX(month);
                    const endX = dateToX(monthEnd);

                    cells.push({
                        label: format(month, "MMM", { locale: es }),
                        x,
                        width: endX - x,
                        date: month,
                    });
                }
                break;
            }
            case "quarter": {
                // Bottom row: quarters
                const months = eachMonthOfInterval({ start, end });
                const quarters: Date[] = [];
                for (const m of months) {
                    const q = startOfQuarter(m);
                    if (!quarters.some((qq) => qq.getTime() === q.getTime())) {
                        quarters.push(q);
                    }
                }
                for (const quarter of quarters) {
                    const qEnd = endOfQuarter(quarter);
                    const x = dateToX(quarter);
                    const endX = dateToX(qEnd);
                    const qNum = Math.ceil((quarter.getMonth() + 1) / 3);

                    cells.push({
                        label: `Q${qNum}`,
                        x,
                        width: endX - x,
                        date: quarter,
                    });
                }
                break;
            }
        }

        return cells;
    }, [timeRange, zoom, dateToX, dayWidth]);

    // ========================================================================
    // Today line position
    // ========================================================================

    const todayX = useMemo<number | null>(() => {
        // Use differenceInCalendarDays (timezone-aware) and center within the day cell
        const today = startOfDay(new Date());
        if (today >= timeRange.start && today <= timeRange.end) {
            const dayIndex = differenceInCalendarDays(today, timeRange.start);
            return dayIndex * dayWidth + dayWidth / 2;
        }
        return null;
    }, [timeRange, dayWidth]);

    // ========================================================================
    // Scroll sync
    // ========================================================================

    const syncScroll = useCallback((source: "timeline" | "taskList") => {
        if (source === "timeline" && timelineRef.current) {
            const scrollTop = timelineRef.current.scrollTop;
            const scrollLeft = timelineRef.current.scrollLeft;

            if (taskListRef.current) {
                taskListRef.current.scrollTop = scrollTop;
            }
            if (headerRef.current) {
                headerRef.current.scrollLeft = scrollLeft;
            }
        } else if (source === "taskList" && taskListRef.current) {
            const scrollTop = taskListRef.current.scrollTop;
            if (timelineRef.current) {
                timelineRef.current.scrollTop = scrollTop;
            }
        }
    }, []);

    return {
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
    };
}
