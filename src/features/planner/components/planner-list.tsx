"use client";

import * as React from "react";
import { format, isToday, isTomorrow, compareDesc, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { PlannerItem } from "@/features/planner/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { ListItem, type ListItemContextMenuAction } from "@/components/shared/list-item";
import { Card } from "@/components/ui/card";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { deleteCalendarEvent } from "@/features/planner/actions";
import { toast } from "sonner";

interface PlannerListProps {
    events: PlannerItem[];
    onEventClick?: (event: PlannerItem) => void;
    /** Total events before filtering — to distinguish empty vs no-results */
    totalEvents?: number;
    /** Callback to create a new event */
    onCreateEvent?: () => void;
    /** Callback to reset filters */
    onResetFilters?: () => void;
    /** Optimistic delete callback */
    onOptimisticDeleteEvent?: (eventId: string) => void;
}

export function PlannerList({ events, onEventClick, totalEvents, onCreateEvent, onResetFilters, onOptimisticDeleteEvent }: PlannerListProps) {
    const [deleteTarget, setDeleteTarget] = React.useState<PlannerItem | null>(null);

    // ── Delete handler ──────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        const eventId = deleteTarget.id;
        setDeleteTarget(null);
        onOptimisticDeleteEvent?.(eventId);

        try {
            await deleteCalendarEvent(eventId);
            toast.success("Evento eliminado correctamente");
        } catch (error) {
            toast.error("Error al eliminar el evento");
            console.error(error);
        }
    };

    // ── Group events by date ────────────────────────────
    const groupedEvents = React.useMemo(() => {
        const sorted = [...events].sort((a, b) => {
            const dateA = a.start_at ? new Date(a.start_at) : new Date(0);
            const dateB = b.start_at ? new Date(b.start_at) : new Date(0);
            if (!isValid(dateA) || !isValid(dateB)) return 0;
            return compareDesc(dateA, dateB);
        });

        const groups: Record<string, PlannerItem[]> = {};

        sorted.forEach(event => {
            if (!event.start_at) return;
            const date = new Date(event.start_at);
            if (!isValid(date)) return;
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
            return new Date(key);
        };
        return compareDesc(getDate(a), getDate(b));
    });

    // ── Empty states ────────────────────────────────────
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

    // ── Context menu builder ────────────────────────────
    const getContextMenuActions = (event: PlannerItem): ListItemContextMenuAction[] => [
        {
            label: "Editar",
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => onEventClick?.(event),
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setDeleteTarget(event),
            variant: "destructive",
        },
    ];

    return (
        <>
            <DeleteConfirmationDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="¿Eliminar evento?"
                description="Esta acción eliminará el evento del calendario. ¿Estás seguro?"
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            />

            <Card variant="inset" className="w-full space-y-1.5">
                {groupKeys.map((key, groupIdx) => {
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
                        const realDate = new Date(groupEvents[0].start_at!);
                        title = format(realDate, "EEEE d", { locale: es });
                        subtitle = format(realDate, "MMMM yyyy", { locale: es });
                    }

                    return (
                        <React.Fragment key={key}>
                            {/* ── Date group header (flat on inset surface, like table group rows) ── */}
                            <div className={cn(
                                "flex items-baseline gap-3 px-3 py-2",
                                groupIdx > 0 && "mt-2"
                            )}>
                                <h3 className="text-sm font-semibold capitalize text-foreground">{title}</h3>
                                <span className="text-xs text-muted-foreground capitalize">{subtitle}</span>
                            </div>

                            {/* ── Event rows (cincel-island elevated) ── */}
                            {groupEvents.map(event => (
                                <ListItem
                                    key={event.id}
                                    variant="row"
                                    onClick={() => onEventClick?.(event)}
                                    contextMenuActions={getContextMenuActions(event)}
                                >
                                    {/* Color strip */}
                                    <div
                                        className="w-1 self-stretch rounded-full shrink-0"
                                        style={{ backgroundColor: event.color || '#3b82f6' }}
                                    />

                                    {/* Time */}
                                    <ListItem.Leading className="min-w-[60px]">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold font-mono">
                                                {event.is_all_day
                                                    ? "Día"
                                                    : event.start_at
                                                        ? format(new Date(event.start_at), "HH:mm")
                                                        : "--:--"
                                                }
                                            </span>
                                            {!event.is_all_day && event.end_at && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {format(new Date(event.end_at), "HH:mm")}
                                                </span>
                                            )}
                                        </div>
                                    </ListItem.Leading>

                                    {/* Content */}
                                    <ListItem.Content>
                                        <ListItem.Title>
                                            {event.title}
                                            {event.source_type && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 font-normal uppercase tracking-wider">
                                                    {event.source_type.replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </ListItem.Title>
                                        {((event as any).project_name || event.location) && (
                                            <ListItem.Description>
                                                <span className="flex items-center gap-3">
                                                    {(event as any).project_name && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                                            {(event as any).project_name}
                                                        </span>
                                                    )}
                                                    {event.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </span>
                                            </ListItem.Description>
                                        )}
                                    </ListItem.Content>
                                </ListItem>
                            ))}
                        </React.Fragment>
                    );
                })}
            </Card>
        </>
    );
}
