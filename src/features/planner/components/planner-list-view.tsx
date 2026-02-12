"use client";

import * as React from "react";
import { format, isToday, isTomorrow, isSameYear, compareAsc, compareDesc } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEvent } from "@/features/planner/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { PlannerEventActions } from "./planner-event-actions";
import { ViewEmptyState } from "@/components/shared/empty-state";

interface PlannerListViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    /** Total events before filtering — to distinguish empty vs no-results */
    totalEvents?: number;
    /** Callback to create a new event */
    onCreateEvent?: () => void;
    /** Callback to reset filters */
    onResetFilters?: () => void;
}

export function PlannerListView({ events, onEventClick, totalEvents, onCreateEvent, onResetFilters }: PlannerListViewProps) {
    // Group events by date category
    const groupedEvents = React.useMemo(() => {
        const sorted = [...events].sort((a, b) =>
            // Descending sort (Newest/Furthest first)
            compareDesc(new Date(a.start_at), new Date(b.start_at))
        );

        const groups: Record<string, CalendarEvent[]> = {};

        sorted.forEach(event => {
            const date = new Date(event.start_at);
            let key = format(date, "yyyy-MM-dd");

            if (isToday(date)) key = "today";
            else if (isTomorrow(date)) key = "tomorrow";

            if (!groups[key]) groups[key] = [];
            groups[key].push(event);
        });

        return groups;
    }, [events]);

    const groupKeys = Object.keys(groupedEvents).sort((a, b) => {
        const getDate = (key: string) => {
            if (key === "today") return new Date();
            if (key === "tomorrow") {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d;
            }
            return new Date(key + "T00:00:00");
        };

        const dateA = getDate(a);
        const dateB = getDate(b);

        // Descending sort: B - A
        return compareDesc(dateA, dateB);
    });

    if (events.length === 0) {
        const isReallyEmpty = (totalEvents ?? 0) === 0;

        if (isReallyEmpty) {
            return (
                <ViewEmptyState
                    mode="empty"
                    icon={CalendarIcon}
                    viewName="Planificador"
                    featureDescription="El planificador te permite organizar eventos, reuniones, visitas a obra y fechas importantes. Creá eventos con horarios, colores y descripciones para tener una vista completa de tu calendario."
                    onAction={onCreateEvent}
                    actionLabel="Nuevo Evento"
                    docsPath="/docs/planificador/kanban"
                />
            );
        }

        return (
            <ViewEmptyState
                mode="no-results"
                icon={CalendarIcon}
                viewName="eventos"
                filterContext="con los filtros actuales"
                onResetFilters={onResetFilters}
            />
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto w-full">
            {groupKeys.map(key => {
                const groupEvents = groupedEvents[key];
                let title = "";
                let subtitle = "";

                if (key === "today") {
                    title = "Hoy";
                    subtitle = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
                } else if (key === "tomorrow") {
                    title = "Mañana";
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    subtitle = format(tmrw, "EEEE d 'de' MMMM", { locale: es });
                } else {
                    const date = new Date(key + "T00:00:00"); // Fix timezone parsing issues roughly
                    // Actually getting date from first event is safer
                    const realDate = new Date(groupEvents[0].start_at);
                    title = format(realDate, "EEEE d", { locale: es });
                    subtitle = format(realDate, "MMMM yyyy", { locale: es });
                }

                return (
                    <div key={key} className="space-y-4">
                        <div className="flex items-baseline gap-3 border-b pb-2">
                            <h3 className="text-2xl font-bold capitalize text-foreground">{title}</h3>
                            <span className="text-muted-foreground capitalize">{subtitle}</span>
                        </div>

                        <div className="grid gap-3">
                            {groupEvents.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className="group relative flex items-center gap-4 bg-card hover:bg-accent/50 p-4 rounded-xl border border-transparent hover:border-border transition-all cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    {/* Color Strip */}
                                    <div
                                        className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-md"
                                        style={{ backgroundColor: event.color || '#3b82f6' }}
                                    />

                                    {/* Time */}
                                    <div className="flex flex-col items-center min-w-[80px] px-2 pl-4">
                                        <span className="text-lg font-bold">
                                            {format(new Date(event.start_at), "HH:mm")}
                                        </span>
                                        {event.end_at && (
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(event.end_at), "HH:mm")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-lg leading-none group-hover:text-primary transition-colors">
                                                {event.title}
                                            </h4>
                                            {event.source_type && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 font-normal uppercase tracking-wider">
                                                    {event.source_type.replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {event.project_name && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                                    {event.project_name}
                                                </span>
                                            )}
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Arrow (Visible on Hover) */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                        <PlannerEventActions
                                            event={event}
                                            onEdit={() => onEventClick?.(event)}
                                            className="h-8 w-8 rounded-full hover:bg-muted"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
