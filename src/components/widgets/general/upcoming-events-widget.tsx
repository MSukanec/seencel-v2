"use client";

import { useEffect, useState, useMemo } from "react";
import type { WidgetProps } from "@/components/widgets/grid/types";
import { CalendarDays, CheckSquare, Calendar } from "lucide-react";
import { getUpcomingEvents, type UpcomingEventItem } from "@/actions/widget-actions";
import { format, isToday, isTomorrow, isThisWeek, addWeeks, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { cn } from "@/lib/utils";

// ============================================================================
// UPCOMING EVENTS WIDGET (Calendar + Kanban, Parametric, Autonomous)
// ============================================================================

const SCOPE_TITLES: Record<string, string> = {
    all: "Próximos Eventos",
    calendar: "Eventos de Calendario",
    kanban: "Tareas Pendientes",
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
    none: "bg-muted-foreground/30",
};

/** Group items by relative date label */
function groupByDate(items: UpcomingEventItem[]): { label: string; items: UpcomingEventItem[] }[] {
    const groups: Map<string, UpcomingEventItem[]> = new Map();

    for (const item of items) {
        const date = parseISO(item.date);
        let label: string;

        if (isToday(date)) {
            label = "Hoy";
        } else if (isTomorrow(date)) {
            label = "Mañana";
        } else if (isThisWeek(date, { weekStartsOn: 1 })) {
            label = format(date, "EEEE", { locale: es });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        } else {
            const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
            const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
            if (date >= nextWeekStart && date <= nextWeekEnd) {
                label = "Próxima semana";
            } else {
                label = format(date, "d 'de' MMMM", { locale: es });
            }
        }

        const group = groups.get(label) || [];
        group.push(item);
        groups.set(label, group);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function EventItemRow({ item }: { item: UpcomingEventItem }) {
    const date = parseISO(item.date);

    const dayNum = format(date, "dd");
    const dayAbbr = format(date, "EEE", { locale: es }).toUpperCase();

    const timeStr = item.isAllDay
        ? null
        : format(date, "HH:mm", { locale: es });

    // Color indicator for the date avatar border
    const borderColor = item.type === 'calendar'
        ? (item.color || '#3b82f6')
        : undefined;

    const borderClass = item.type === 'kanban'
        ? PRIORITY_COLORS[item.priority || 'none']
            ? `border-l-2 ${PRIORITY_COLORS[item.priority || 'none'].replace('bg-', 'border-')}`
            : 'border-l-2 border-muted-foreground/30'
        : '';

    return (
        <div className="flex items-center gap-3 py-1.5">
            {/* Date avatar */}
            <div
                className={cn(
                    "w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 bg-muted/50",
                    item.type === 'kanban' && "border-l-2",
                    item.type === 'kanban' && (PRIORITY_COLORS[item.priority || 'none']
                        ? PRIORITY_COLORS[item.priority || 'none'].replace('bg-', 'border-')
                        : 'border-muted-foreground/30')
                )}
                style={item.type === 'calendar' ? { borderLeft: `2px solid ${item.color || '#3b82f6'}` } : undefined}
            >
                <span className="text-xs font-bold leading-none text-foreground">{dayNum}</span>
                <span className="text-[9px] font-medium leading-none text-muted-foreground mt-0.5">{dayAbbr}</span>
            </div>

            {/* Title + type icon */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <p className="text-sm font-medium truncate text-foreground">
                    {item.title}
                </p>
                {item.type === 'kanban' ? (
                    <CheckSquare className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                ) : (
                    <CalendarDays className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                )}
            </div>

            {/* Time (only for timed events) */}
            {timeStr && (
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {timeStr}
                </span>
            )}
        </div>
    );
}

function UpcomingEventsSkeleton() {
    return (
        <div className="space-y-3 px-3 py-2">
            <Skeleton className="h-3 w-12" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-10" />
                </div>
            ))}
            <Skeleton className="h-3 w-16 mt-2" />
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i + 3} className="flex items-center gap-2.5">
                    <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-10" />
                </div>
            ))}
        </div>
    );
}

export function UpcomingEventsWidget({ config, initialData }: WidgetProps) {
    const scope = config?.scope || "all";
    const [items, setItems] = useState<UpcomingEventItem[] | null>(
        initialData ?? null
    );

    // Only fetch client-side if no initialData was provided
    useEffect(() => {
        if (initialData) return;
        let cancelled = false;
        setItems(null);
        getUpcomingEvents(scope, 8).then((data) => {
            if (!cancelled) setItems(data);
        });
        return () => {
            cancelled = true;
        };
    }, [scope, initialData]);

    // Group items by date
    const groups = useMemo(() => {
        if (!items) return [];
        return groupByDate(items);
    }, [items]);

    return (
        <div className="h-full flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="p-1.5 rounded-md bg-primary/10">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold leading-none">
                        {SCOPE_TITLES[scope] || "Próximos Eventos"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Fechas y vencimientos
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 pb-2">
                {items === null ? (
                    <UpcomingEventsSkeleton />
                ) : items.length === 0 ? (
                    <WidgetEmptyState
                        icon={Calendar}
                        title="Sin eventos próximos"
                        description="Los eventos de calendario y tareas con fecha aparecerán aquí"
                        href="/organization/planner"
                        actionLabel="Ir a Agenda"
                    />
                ) : (
                    <div className="space-y-3 pt-2">
                        {groups.map((group) => (
                            <div key={group.label}>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    {group.label}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <EventItemRow key={`${item.type}-${item.id}`} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
