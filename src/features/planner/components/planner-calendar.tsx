"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePanel } from "@/stores/panel-store";
import { useActiveProjectId } from "@/stores/layout-store";

import { PlannerItem } from "@/features/planner/types";

import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths, addMonths, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";


// ============================================================================
// UTILS
// ============================================================================

function hexToRgba(hex: string, alpha: number) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0,0,0,${alpha})`;

    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

// ============================================================================
// PLANNER CALENDAR COMPONENT
// ============================================================================

interface PlannerCalendarProps {
    organizationId: string;
    events: PlannerItem[];
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function PlannerCalendar({ organizationId, events }: PlannerCalendarProps) {
    const activeProjectId = useActiveProjectId();
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const { openPanel } = usePanel();

    // Optimistic state for events
    const [optimisticEvents, setOptimisticEvents] = React.useState(events);

    // Sync optimistic events when prop changes
    React.useEffect(() => {
        setOptimisticEvents(events);
    }, [events]);

    // Optimistic event management
    const addOptimisticEvent = React.useCallback((tempEvent: PlannerItem) => {
        setOptimisticEvents(prev => [...prev, tempEvent]);
    }, []);

    const updateOptimisticEvent = React.useCallback((updatedEvent: PlannerItem) => {
        setOptimisticEvents(prev => prev.map(e => e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e));
    }, []);

    const rollbackOptimistic = React.useCallback(() => {
        setOptimisticEvents(events);
    }, [events]);

    // Navigation
    const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Open event form in panel
    const openEventForm = (defaultDate?: Date, event?: PlannerItem) => {
        openPanel('planner-event-form', {
            organizationId,
            projectId: activeProjectId,
            initialData: event,
            defaultDate,
            onOptimisticCreate: addOptimisticEvent,
            onOptimisticUpdate: updateOptimisticEvent,
            onRollback: rollbackOptimistic,
        });
    };


    // Event handlers
    const handleDayClick = (date: Date) => {
        openEventForm(date);
    };

    const handleEventClick = (event: PlannerItem, e: React.MouseEvent) => {
        e.stopPropagation();
        openEventForm(undefined, event);
    };

    // Use already-filtered events from props, then apply project context
    const displayEvents = React.useMemo(() => {
        return optimisticEvents.filter(event => {
            if (activeProjectId && event.project_id && event.project_id !== activeProjectId) {
                return false;
            }
            return true;
        });
    }, [optimisticEvents, activeProjectId]);

    // Calendar Generation Logic - Dynamic rows based on month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    // Calculate only the weeks needed for this month
    const calendarDays: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }



    return (
        <Card variant="inset" className="h-full flex flex-col overflow-hidden">

            {/* Calendar Navigation Row (flat on inset surface) */}
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="cincel-island h-7 w-7" onClick={goToPrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-36 text-center select-none capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                    </span>
                    <Button variant="ghost" size="icon" className="cincel-island h-7 w-7" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="cincel-island h-7 text-xs" onClick={goToToday}>
                    Hoy
                </Button>
            </div>

            {/* Day Headers Row (flat on surface) */}
            <div className="grid grid-cols-7">
                {DAYS.map((dayName) => (
                    <div
                        key={dayName}
                        className="py-2 text-center text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider"
                    >
                        {dayName}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-7 gap-1.5 p-1.5">
                {calendarDays.map((date, idx) => {
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isToday = isSameDay(date, new Date());

                    // Filter events for this day
                    const dayEvents = displayEvents.filter(e => e.start_at && isSameDay(new Date(e.start_at), date));
                    const visibleEvents = dayEvents.slice(0, 3);
                    const hiddenCount = dayEvents.length - 3;

                    return (
                        <div
                            key={date.toISOString()}
                            className={cn(
                                "relative min-h-[100px] md:min-h-[120px] p-1.5 md:p-2 transition-all cursor-pointer group flex flex-col rounded-lg",
                                // Island effect for current month cells
                                isCurrentMonth
                                    ? "bg-background border border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_0.5px_1px_rgba(0,0,0,0.15)]"
                                    : "bg-transparent opacity-40",
                                // Today highlight
                                isToday && "ring-2 ring-primary ring-inset"
                            )}
                            onClick={() => handleDayClick(date)}
                        >
                            {/* Date Number */}
                            <div className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1.5 transition-all shrink-0",
                                isToday
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : isCurrentMonth
                                        ? "text-foreground group-hover:bg-accent"
                                        : "text-muted-foreground/50"
                            )}>
                                {date.getDate()}
                            </div>

                            {/* Events Container */}
                            <div className={cn(
                                "flex flex-col gap-0.5 w-full flex-1 overflow-hidden",
                                !isCurrentMonth && "opacity-40"
                            )}>
                                {visibleEvents.map((event) => {
                                    const eventColor = event.color || "#3b82f6";
                                    const isAllDay = event.is_all_day;

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => handleEventClick(event, e)}
                                            className={cn(
                                                "text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate w-full cursor-pointer",
                                                "transition-all hover:scale-[1.02] hover:shadow-md",
                                                "border-l-2 flex items-center gap-1"
                                            )}
                                            style={{
                                                backgroundColor: hexToRgba(eventColor, isAllDay ? 0.2 : 0.1),
                                                color: eventColor,
                                                borderColor: eventColor,
                                            }}
                                        >
                                            {!isAllDay && (
                                                <span className="opacity-80 font-mono text-[9px] hidden md:inline shrink-0">
                                                    {event.start_at ? format(new Date(event.start_at), "HH:mm") : ""}
                                                </span>
                                            )}
                                            <span className={cn("truncate", isAllDay && "font-semibold")}>
                                                {event.title}
                                            </span>
                                        </div>
                                    );
                                })}

                                {hiddenCount > 0 && (
                                    <div className="text-[10px] text-muted-foreground px-1.5 font-medium">
                                        +{hiddenCount} más
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
