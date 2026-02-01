"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-store";

import { CalendarEvent } from "@/features/planner/types";
import { CalendarEventForm } from "../forms/calendar-event-form";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { PlannerListView } from "./planner-list-view";
import { Project } from "@/types/project";
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
    projectId?: string | null;
    events: CalendarEvent[];
    onRefresh?: () => void;
    projects?: Project[];
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function PlannerCalendar({ organizationId, projectId, events, onRefresh, projects }: PlannerCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [searchQuery, setSearchQuery] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = React.useState<'month' | 'list'>('month');
    const { openModal, closeModal } = useModal();

    // Optimistic state for events
    const [optimisticEvents, setOptimisticEvents] = React.useState(events);

    // Sync optimistic events when prop changes
    React.useEffect(() => {
        setOptimisticEvents(events);
    }, [events]);

    // Optimistic event management
    const addOptimisticEvent = React.useCallback((tempEvent: CalendarEvent) => {
        setOptimisticEvents(prev => [...prev, tempEvent]);
    }, []);

    const updateOptimisticEvent = React.useCallback((updatedEvent: CalendarEvent) => {
        setOptimisticEvents(prev => prev.map(e => e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e));
    }, []);

    const rollbackOptimistic = React.useCallback(() => {
        setOptimisticEvents(events);
    }, [events]);

    // Navigation
    const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Open event form modal
    const openEventForm = (defaultDate?: Date, event?: CalendarEvent) => {
        openModal(
            <CalendarEventForm
                organizationId={organizationId}
                projectId={projectId}
                initialData={event}
                defaultDate={defaultDate}
                projects={projects}
                onOptimisticCreate={addOptimisticEvent}
                onOptimisticUpdate={updateOptimisticEvent}
                onRollback={rollbackOptimistic}
                onCancel={closeModal}
            />,
            {
                title: event ? "Editar evento" : "Nuevo evento",
                description: event
                    ? "Modificá los detalles del evento."
                    : "Completá los campos para crear un nuevo evento.",
                size: 'md'
            }
        );
    };

    // Event handlers
    const handleNewEvent = () => {
        openEventForm(new Date());
    };

    const handleDayClick = (date: Date) => {
        openEventForm(date);
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        openEventForm(undefined, event);
    };

    const handleTypeSelect = (value: string) => {
        const next = new Set(typeFilter);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        setTypeFilter(next);
    };

    // Filter Events
    const filteredEvents = React.useMemo(() => {
        return optimisticEvents.filter(event => {
            // Text Search
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                event.title.toLowerCase().includes(searchLower) ||
                event.description?.toLowerCase().includes(searchLower) ||
                event.project_name?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Type Filter
            if (typeFilter.size > 0 && event.source_type) {
                if (!typeFilter.has(event.source_type)) return false;
            } else if (typeFilter.size > 0 && !event.source_type) {
                if (!typeFilter.has('manual')) return false;
            }

            return true;
        });
    }, [optimisticEvents, searchQuery, typeFilter]);

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

    const typeFilterOptions = [
        { label: "Manual", value: "manual", icon: CalendarIcon },
        { label: "Kanban", value: "kanban_card", icon: List },
        { label: "Pagos", value: "payment", icon: CalendarIcon },
        { label: "Hitos", value: "quote_milestone", icon: CalendarIcon },
    ];

    if (viewMode === 'list') {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <Toolbar
                    portalToHeader
                    mobileShowViewToggler
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Buscar eventos..."
                    filterContent={
                        <FacetedFilter
                            title="Tipo"
                            options={typeFilterOptions}
                            selectedValues={typeFilter}
                            onSelect={handleTypeSelect}
                        />
                    }
                    actions={[{
                        label: "Nuevo Evento",
                        icon: Plus,
                        onClick: handleNewEvent
                    }]}
                    leftActions={
                        <ToolbarTabs
                            value={viewMode}
                            onValueChange={(v) => setViewMode(v as 'month' | 'list')}
                            options={[
                                { label: "Mes", value: "month", icon: CalendarIcon },
                                { label: "Agenda", value: "list", icon: List },
                            ]}
                        />
                    }
                />
                <div className="flex-1 overflow-hidden p-0">
                    <PlannerListView
                        events={filteredEvents}
                        onEventClick={(e) => openEventForm(undefined, e)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Header / Toolbar */}
            <Toolbar
                portalToHeader
                mobileShowViewToggler
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar eventos..."
                filterContent={
                    <FacetedFilter
                        title="Tipo"
                        options={typeFilterOptions}
                        selectedValues={typeFilter}
                        onSelect={handleTypeSelect}
                    />
                }
                actions={[{
                    label: "Nuevo Evento",
                    icon: Plus,
                    onClick: handleNewEvent
                }]}
                leftActions={
                    <div className="flex items-center gap-2">
                        <ToolbarTabs
                            value={viewMode}
                            onValueChange={(v) => setViewMode(v as 'month' | 'list')}
                            options={[
                                { label: "Mes", value: "month", icon: CalendarIcon },
                                { label: "Agenda", value: "list", icon: List },
                            ]}
                        />
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-32 text-center select-none capitalize">
                                {format(currentDate, "MMMM yyyy", { locale: es })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 ml-2" onClick={goToToday}>
                            Hoy
                        </Button>
                    </div>
                }
            />

            {/* Day Headers Row */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {DAYS.map((dayName) => (
                    <div
                        key={dayName}
                        className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                        {dayName}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - Days Only */}
            <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-7 bg-border gap-px">
                {calendarDays.map((date, idx) => {
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isToday = isSameDay(date, new Date());

                    // Filter events for this day
                    const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.start_at), date));
                    const visibleEvents = dayEvents.slice(0, 3);
                    const hiddenCount = dayEvents.length - 3;

                    return (
                        <div
                            key={date.toISOString()}
                            className={cn(
                                "relative min-h-[100px] md:min-h-[120px] p-1.5 md:p-2 transition-colors cursor-pointer group flex flex-col",
                                // Background - Solid colors for contrast
                                isCurrentMonth
                                    ? "bg-card hover:bg-accent/50"
                                    : "bg-muted/40 hover:bg-muted/60",
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
                                                    {format(new Date(event.start_at), "HH:mm")}
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
        </div>
    );
}
