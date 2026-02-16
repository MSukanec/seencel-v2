"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { ConstructionTaskCard } from "../components/construction-task-card";
import { ConstructionTaskForm } from "../forms/construction-task-form";
import { deleteConstructionTask, updateConstructionTask, updateConstructionTaskStatus, createConstructionDependency, deleteConstructionDependency } from "../actions";
import { ConstructionDependencyRow } from "../queries";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { GanttChart, GanttItem, GanttDependency } from "@/components/shared/gantt";
import { DataTable } from "@/components/shared/data-table/data-table";
import { getConstructionTaskColumns } from "../components/construction-tasks-columns";

import { useModal } from "@/stores/modal-store";
import { useActiveProjectId } from "@/stores/layout-store";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardList, Plus, GanttChartSquare, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type ViewMode = "gantt" | "cards" | "table";

interface ConstructionTasksViewProps {
    projectId?: string;
    organizationId: string;
    tasks: ConstructionTaskView[];
    initialDependencies: ConstructionDependencyRow[];
    catalogTasks: {
        id: string;
        name: string | null;
        custom_name: string | null;
        unit_name?: string;
        division_name?: string;
        code: string | null;
    }[];
    workDays?: number[];
}

// ============================================================================
// Helpers
// ============================================================================

// Colores por estado para el dot indicador del Gantt
const STATUS_DOT_COLORS: Record<ConstructionTaskStatus, string> = {
    pending: "#94a3b8",     // slate-400
    in_progress: "#3b82f6", // blue-500
    completed: "#22c55e",   // green-500
    paused: "#f59e0b",      // amber-500
};

function taskToGanttItem(task: ConstructionTaskView): GanttItem | null {
    // Sin fechas no puede renderizarse en el Gantt
    if (!task.planned_start_date && !task.planned_end_date) return null;

    const now = new Date();
    const startDate = parseDateFromDB(task.planned_start_date)
        || parseDateFromDB(task.planned_end_date)!;
    const endDate = parseDateFromDB(task.planned_end_date)
        || parseDateFromDB(task.planned_start_date)!;

    return {
        id: task.id,
        label: [
            task.task_name || task.custom_name || "Sin nombre",
            task.recipe_name,
        ].filter(Boolean).join(" — "),
        subtitle: task.division_name || undefined,
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        progress: task.progress_percent || 0,
        statusColor: STATUS_DOT_COLORS[task.status] || STATUS_DOT_COLORS.pending,
        group: task.phase_name || undefined,
    };
}

// Opciones para el FacetedFilter de estado
const STATUS_FILTER_OPTIONS = (Object.keys(STATUS_CONFIG) as ConstructionTaskStatus[]).map((status) => ({
    label: STATUS_CONFIG[status].label,
    value: status,
}));

// ============================================================================
// Component
// ============================================================================

export function ConstructionTasksView({
    projectId: propProjectId,
    organizationId,
    tasks: initialTasks,
    initialDependencies,
    catalogTasks,
    workDays = [1, 2, 3, 4, 5],
}: ConstructionTasksViewProps) {
    const { openModal } = useModal();
    const storeProjectId = useActiveProjectId();
    // Use store filter first, then prop fallback
    const activeProjectId = storeProjectId ?? propProjectId ?? null;

    // Compute non-work days (inverse of workDays) for the Gantt
    const nonWorkDays = useMemo(() => {
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        return allDays.filter(d => !workDays.includes(d));
    }, [workDays]);
    const [tasks, setTasks] = useState(initialTasks);
    const [viewMode, setViewMode] = useState<ViewMode>("gantt");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
    const [deletingTask, setDeletingTask] = useState<ConstructionTaskView | null>(null);
    const [isPending, startTransition] = useTransition();

    // Sync local state when server props change (e.g., after router.refresh())
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Dependencies state
    const [dependencies, setDependencies] = useState<ConstructionDependencyRow[]>(initialDependencies);

    // ========================================================================
    // Filtered tasks
    // ========================================================================

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Project filter (from store or prop)
            if (activeProjectId && task.project_id !== activeProjectId) return false;
            const matchesSearch =
                [
                    task.task_name || task.custom_name || "",
                    task.recipe_name || "",
                ].join(" ")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(task.status);
            return matchesSearch && matchesStatus;
        });
    }, [tasks, searchQuery, selectedStatuses, activeProjectId]);

    // ========================================================================
    // Gantt items (memoized conversion)
    // ========================================================================

    const ganttItems = useMemo(() => {
        return filteredTasks
            .map(taskToGanttItem)
            .filter(Boolean) as GanttItem[];
    }, [filteredTasks]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleStatusFilterSelect = (value: string) => {
        const next = new Set(selectedStatuses);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        setSelectedStatuses(next);
    };


    const handleCreate = () => {
        if (!activeProjectId) {
            toast.error("Seleccioná un proyecto en el header para crear una tarea.");
            return;
        }
        openModal(
            <ConstructionTaskForm
                projectId={activeProjectId}
                organizationId={organizationId}
                catalogTasks={catalogTasks}
            />,
            {
                title: "Nueva Tarea",
                description: "Seleccioná una tarea del catálogo o creá una personalizada.",
                size: "md",
            }
        );
    };

    const handleEdit = (task: ConstructionTaskView) => {
        openModal(
            <ConstructionTaskForm
                projectId={task.project_id}
                organizationId={organizationId}
                catalogTasks={catalogTasks}
                initialData={task}
            />,
            {
                title: "Editar Tarea",
                description: "Modifica los detalles de la tarea de construcción.",
                size: "md",
            }
        );
    };

    const handleDelete = (task: ConstructionTaskView) => {
        setDeletingTask(task);
    };

    const confirmDelete = () => {
        if (!deletingTask) return;
        const taskToDelete = deletingTask;

        // Optimistic: remove from UI immediately
        setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        setDeletingTask(null);
        toast.success("Tarea eliminada");

        // Persist in background
        startTransition(async () => {
            const result = await deleteConstructionTask(taskToDelete.id, taskToDelete.project_id);
            if (!result.success) {
                // Rollback on error
                setTasks(prev => [...prev, taskToDelete]);
                toast.error(result.error || "Error al eliminar");
            }
        });
    };

    const handleStatusChange = (task: ConstructionTaskView, newStatus: string) => {
        // Optimistic: update UI immediately
        const previousStatus = task.status;
        const previousProgress = task.progress_percent;
        setTasks(prev =>
            prev.map(t =>
                t.id === task.id
                    ? {
                        ...t,
                        status: newStatus as ConstructionTaskStatus,
                        progress_percent: newStatus === 'completed' ? 100 : t.progress_percent
                    }
                    : t
            )
        );

        // Persist in background
        startTransition(async () => {
            const result = await updateConstructionTaskStatus(
                task.id,
                task.project_id,
                newStatus as ConstructionTaskStatus
            );
            if (!result.success) {
                // Rollback on error
                setTasks(prev =>
                    prev.map(t =>
                        t.id === task.id
                            ? { ...t, status: previousStatus, progress_percent: previousProgress }
                            : t
                    )
                );
                toast.error(result.error || "Error al actualizar");
            }
        });
    };

    // ========================================================================
    // Dependency propagation (push-forward cascade)
    // ========================================================================

    /**
     * When a task's end date changes, check its FS successors.
     * If the new end date >= successor's start date, push the successor
     * forward to maintain the constraint. Recursive.
     * Returns array of {id, originalTask, newStart, newEnd} for all affected tasks.
     */
    const propagateDependencies = useCallback((
        movedTaskId: string,
        movedTaskNewEnd: Date,
        currentTasks: ConstructionTaskView[],
        currentDeps: typeof dependencies,
        visited: Set<string> = new Set(),
    ): { id: string; original: ConstructionTaskView; newStartStr: string; newEndStr: string; newDuration: number }[] => {
        if (visited.has(movedTaskId)) return []; // prevent cycles
        visited.add(movedTaskId);

        const affected: { id: string; original: ConstructionTaskView; newStartStr: string; newEndStr: string; newDuration: number }[] = [];

        // Find FS dependencies where this task is the predecessor
        const fsDeps = currentDeps.filter(
            d => d.predecessor_task_id === movedTaskId && d.type === "FS"
        );

        for (const dep of fsDeps) {
            const successor = currentTasks.find(t => t.id === dep.successor_task_id);
            if (!successor) continue;

            const successorStart = parseDateFromDB(successor.planned_start_date);
            if (!successorStart) continue;

            // Only push forward, never pull back
            // FS constraint: successor must start AFTER predecessor ends
            // So if predecessorEnd >= successorStart, push successor
            if (movedTaskNewEnd >= successorStart) {
                const newSuccessorStart = movedTaskNewEnd;
                const successorEnd = parseDateFromDB(successor.planned_end_date);
                const duration = successorEnd
                    ? differenceInCalendarDays(successorEnd, successorStart)
                    : 0;
                const newSuccessorEnd = addDays(newSuccessorStart, duration);

                affected.push({
                    id: successor.id,
                    original: successor,
                    newStartStr: formatDateForDB(newSuccessorStart)!,
                    newEndStr: formatDateForDB(newSuccessorEnd)!,
                    newDuration: duration + 1,
                });

                // Recurse: this successor might also push its own successors
                const cascaded = propagateDependencies(
                    successor.id,
                    newSuccessorEnd,
                    currentTasks,
                    currentDeps,
                    visited,
                );
                affected.push(...cascaded);
            }
        }

        return affected;
    }, [dependencies]);

    // ========================================================================
    // Gantt interaction handlers
    // ========================================================================

    const handleGanttItemClick = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) handleEdit(task);
    };

    const handleGanttItemMove = useCallback((id: string, newStart: Date, newEnd: Date) => {
        const original = tasks.find(t => t.id === id);
        if (!original) return;

        const newStartStr = formatDateForDB(newStart);
        const newEndStr = formatDateForDB(newEnd);
        const newDuration = differenceInCalendarDays(newEnd, newStart) + 1;

        // Cascade: find tasks that need to be pushed
        const cascaded = propagateDependencies(id, newEnd, tasks, dependencies);

        // Optimistic update — moved task + cascaded
        setTasks(prev => {
            let updated = prev.map(t => t.id === id ? {
                ...t,
                planned_start_date: newStartStr,
                planned_end_date: newEndStr,
                duration_in_days: newDuration,
            } : t);

            for (const c of cascaded) {
                updated = updated.map(t => t.id === c.id ? {
                    ...t,
                    planned_start_date: c.newStartStr,
                    planned_end_date: c.newEndStr,
                    duration_in_days: c.newDuration,
                } : t);
            }

            return updated;
        });

        const totalMoved = 1 + cascaded.length;
        toast.success(
            totalMoved > 1
                ? `${totalMoved} tareas actualizadas`
                : "Fechas actualizadas"
        );

        // Persist all in parallel
        const persists = [
            updateConstructionTask(id, original.project_id, {
                planned_start_date: newStartStr,
                planned_end_date: newEndStr,
            }).then(result => {
                if (!result.success) {
                    setTasks(prev => prev.map(t => t.id === id ? original : t));
                    toast.error(result.error || "Error al actualizar fechas");
                }
            }),
            ...cascaded.map(c =>
                updateConstructionTask(c.id, c.original.project_id, {
                    planned_start_date: c.newStartStr,
                    planned_end_date: c.newEndStr,
                }).then(result => {
                    if (!result.success) {
                        setTasks(prev => prev.map(t => t.id === c.id ? c.original : t));
                        toast.error(`Error al propagar tarea: ${result.error}`);
                    }
                })
            ),
        ];

        void Promise.all(persists);
    }, [tasks, dependencies, propagateDependencies]);

    const handleGanttItemResize = useCallback((id: string, newEnd: Date) => {
        const original = tasks.find(t => t.id === id);
        if (!original) return;

        const newEndStr = formatDateForDB(newEnd);
        const startDate = parseDateFromDB(original.planned_start_date) || newEnd;
        const newDuration = differenceInCalendarDays(newEnd, startDate) + 1;

        // Cascade: find tasks that need to be pushed
        const cascaded = propagateDependencies(id, newEnd, tasks, dependencies);

        // Optimistic update — resized task + cascaded
        setTasks(prev => {
            let updated = prev.map(t => t.id === id ? {
                ...t,
                planned_end_date: newEndStr,
                duration_in_days: newDuration,
            } : t);

            for (const c of cascaded) {
                updated = updated.map(t => t.id === c.id ? {
                    ...t,
                    planned_start_date: c.newStartStr,
                    planned_end_date: c.newEndStr,
                    duration_in_days: c.newDuration,
                } : t);
            }

            return updated;
        });

        const totalMoved = 1 + cascaded.length;
        toast.success(
            totalMoved > 1
                ? `${totalMoved} tareas actualizadas`
                : "Duración actualizada"
        );

        // Persist all in parallel
        const persists = [
            updateConstructionTask(id, original.project_id, {
                planned_end_date: newEndStr,
            }).then(result => {
                if (!result.success) {
                    setTasks(prev => prev.map(t => t.id === id ? original : t));
                    toast.error(result.error || "Error al actualizar duración");
                }
            }),
            ...cascaded.map(c =>
                updateConstructionTask(c.id, c.original.project_id, {
                    planned_start_date: c.newStartStr,
                    planned_end_date: c.newEndStr,
                }).then(result => {
                    if (!result.success) {
                        setTasks(prev => prev.map(t => t.id === c.id ? c.original : t));
                        toast.error(`Error al propagar tarea: ${result.error}`);
                    }
                })
            ),
        ];

        void Promise.all(persists);
    }, [tasks, dependencies, propagateDependencies]);

    // ========================================================================
    // Dependency handlers
    // ========================================================================

    const ganttDependencies: GanttDependency[] = useMemo(() => {
        return dependencies.map(d => ({
            id: d.id,
            fromId: d.predecessor_task_id,
            toId: d.successor_task_id,
            type: d.type,
        }));
    }, [dependencies]);

    const handleDependencyCreate = useCallback((fromId: string, toId: string, type: GanttDependency["type"]) => {
        // Optimistic: add temp dependency
        const tempId = `temp-${Date.now()}`;
        const optimistic: ConstructionDependencyRow = {
            id: tempId,
            predecessor_task_id: fromId,
            successor_task_id: toId,
            type,
            lag_days: 0,
        };
        setDependencies(prev => [...prev, optimistic]);
        toast.success("Dependencia creada");

        // Persist
        createConstructionDependency(organizationId, fromId, toId, type).then(result => {
            if (result.success && result.id) {
                // Replace temp id with real id
                setDependencies(prev => prev.map(d => d.id === tempId ? { ...d, id: result.id! } : d));
            } else {
                // Rollback
                setDependencies(prev => prev.filter(d => d.id !== tempId));
                toast.error(result.error || "Error al crear dependencia");
            }
        });
    }, [organizationId]);

    const handleDependencyDelete = useCallback((depId: string) => {
        const original = dependencies.find(d => d.id === depId);
        if (!original) return;

        // Optimistic remove
        setDependencies(prev => prev.filter(d => d.id !== depId));
        toast.success("Dependencia eliminada");

        // Persist
        deleteConstructionDependency(depId).then(result => {
            if (!result.success) {
                setDependencies(prev => [...prev, original]);
                toast.error(result.error || "Error al eliminar dependencia");
            }
        });
    }, [dependencies]);

    // ========================================================================
    // DataTable columns (memoized)
    // ========================================================================

    const tableColumns = useMemo(() => getConstructionTaskColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onStatusChange: handleStatusChange,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);

    // ========================================================================
    // View toggle
    // ========================================================================

    const viewToggle = (
        <ToolbarTabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            options={[
                { value: "gantt", label: "Gantt", icon: GanttChartSquare },
                { value: "cards", label: "Tarjetas", icon: LayoutGrid },
                { value: "table", label: "Tabla", icon: List },
            ]}
        />
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Toolbar */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar tareas..."
                leftActions={viewToggle}
                filterContent={
                    <FacetedFilter
                        title="Estado"
                        options={STATUS_FILTER_OPTIONS}
                        selectedValues={selectedStatuses}
                        onSelect={handleStatusFilterSelect}
                        onClear={() => setSelectedStatuses(new Set())}
                    />
                }
                actions={[
                    {
                        label: "Nueva Tarea",
                        icon: Plus,
                        onClick: handleCreate,
                    },
                ]}
            />

            {/* Content */}
            {filteredTasks.length === 0 ? (
                <>
                    {tasks.length === 0 ? (
                        <div className="min-h-full flex flex-col">
                            <ViewEmptyState
                                mode="empty"
                                icon={ClipboardList}
                                viewName="Ejecución de Obra"
                                featureDescription="La ejecución de obra es donde las tareas del catálogo cobran vida. Desde aquí podés asignar tareas a tu proyecto, planificar fechas, hacer seguimiento de avance y controlar desvíos de cantidad, costo y tiempo. Usá el Gantt interactivo para programar tu obra visualmente."
                                onAction={handleCreate}
                                actionLabel="Agregar Tarea"
                                docsPath="/docs/ejecucion-de-obra/introduccion"
                            />
                        </div>
                    ) : (
                        <div className="min-h-full flex flex-col">
                            <ViewEmptyState
                                mode="no-results"
                                icon={ClipboardList}
                                viewName="tareas de construcción"
                                filterContext="con los filtros aplicados"
                                onResetFilters={() => {
                                    setSearchQuery("");
                                    setSelectedStatuses(new Set());
                                }}
                            />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Gantt View */}
                    {viewMode === "gantt" && (
                        <>
                            {ganttItems.length > 0 ? (
                                <GanttChart
                                    items={ganttItems}
                                    dependencies={ganttDependencies}
                                    onItemClick={handleGanttItemClick}
                                    onItemMove={handleGanttItemMove}
                                    onItemResize={handleGanttItemResize}
                                    onDependencyCreate={handleDependencyCreate}
                                    onDependencyDelete={handleDependencyDelete}
                                    todayLine={true}
                                    nonWorkDays={nonWorkDays}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Las tareas necesitan fechas planificadas para mostrarse en el Gantt.
                                </div>
                            )}
                        </>
                    )}

                    {/* Cards View */}
                    {viewMode === "cards" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredTasks.map((task) => (
                                <ConstructionTaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === "table" && (
                        <DataTable
                            columns={tableColumns}
                            data={filteredTasks}
                            onRowClick={handleEdit}
                            pageSize={20}
                            showPagination={filteredTasks.length > 20}
                            stickyHeader
                        />
                    )}
                </>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la tarea "{deletingTask?.task_name || deletingTask?.custom_name}".
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
