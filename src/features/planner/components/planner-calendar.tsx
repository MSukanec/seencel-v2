"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-store";

import { CalendarEvent } from "@/features/planner/types";
import { CalendarEventForm } from "./calendar-event-form";

// ============================================================================
// PLANNER CALENDAR COMPONENT
// ============================================================================
// A full-featured calendar component for viewing and managing events
// ============================================================================

interface PlannerCalendarProps {
    organizationId: string;
    projectId?: string | null;
    events: CalendarEvent[];
    onRefresh?: () => void;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function PlannerCalendar({ organizationId, projectId, events, onRefresh }: PlannerCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const { openModal, closeModal } = useModal();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Open event form modal
    const openEventForm = (defaultDate?: Date, event?: CalendarEvent) => {
        openModal(
            <CalendarEventForm
                organizationId={organizationId}
                projectId={projectId}
                initialData={event}
                defaultDate={defaultDate}
                onSuccess={() => {
                    closeModal();
                    onRefresh?.();
                }}
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

    const handleDayClick = (day: number) => {
        openEventForm(new Date(year, month, day));
    };

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        openEventForm(undefined, event);
    };

    // Check if a day is today
    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    // Get events for a specific day
    const getEventsForDay = (day: number) => {
        return events.filter((event) => {
            const eventDate = new Date(event.start_at);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
            );
        });
    };

    // Generate calendar grid
    const calendarDays = [];

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(
            <div key={`empty-${i}`} className="h-24 border-b border-r border-border/50 bg-muted/20" />
        );
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayEvents = getEventsForDay(day);

        calendarDays.push(
            <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={cn(
                    "h-24 border-b border-r border-border/50 p-1 transition-colors hover:bg-muted/30 cursor-pointer",
                    isToday(day) && "bg-primary/5"
                )}
            >
                <div className="flex items-center justify-between">
                    <span
                        className={cn(
                            "inline-flex items-center justify-center w-7 h-7 text-sm rounded-full",
                            isToday(day) && "bg-primary text-primary-foreground font-semibold"
                        )}
                    >
                        {day}
                    </span>
                </div>
                <div className="mt-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                        <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color || "#3b82f6", color: "white" }}
                        >
                            {event.title}
                        </div>
                    ))}
                    {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 2} más
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">
                        {MONTHS[month]} {year}
                    </h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToToday}>
                            Hoy
                        </Button>
                        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button size="sm" onClick={handleNewEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo evento
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {DAYS.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {calendarDays}
                </div>
            </div>

            {/* Empty State */}
            {events.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-muted-foreground/50">
                        <p className="text-lg font-medium">Sin eventos</p>
                        <p className="text-sm">Haz clic en un día o en "Nuevo evento" para empezar</p>
                    </div>
                </div>
            )}
        </div>
    );
}

