"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { updateConstructionTask, updateConstructionTaskStatus, createConstructionDependency, deleteConstructionDependency } from "../actions";
import { ConstructionDependencyRow } from "../queries";
import type { GanttItem, GanttDependency, GanttGroup } from "@/components/shared/gantt";
import { toast } from "sonner";

// ============================================================================
// Colores por estado para el Gantt
// ============================================================================

const STATUS_DOT_COLORS: Record<ConstructionTaskStatus, string> = {
    pending: "var(--muted-foreground)",
    in_progress: "var(--semantic-info)",
    completed: "var(--semantic-positive)",
    paused: "var(--semantic-warning)",
};

// ============================================================================
// Helpers
// ============================================================================

function taskToGanttItem(task: ConstructionTaskView): GanttItem | null {
    if (!task.planned_start_date && !task.planned_end_date) return null;

    const startDate = parseDateFromDB(task.planned_start_date)
        || parseDateFromDB(task.planned_end_date)!;
    const endDate = parseDateFromDB(task.planned_end_date)
        || parseDateFromDB(task.planned_start_date)!;

    const actualStart = parseDateFromDB(task.actual_start_date) ?? undefined;
    const actualEnd = parseDateFromDB(task.actual_end_date) ?? undefined;

    return {
        id: task.id,
        label: [
            task.task_name || task.custom_name || "Sin nombre",
            task.recipe_name,
        ].filter(Boolean).join(" — "),
        subtitle: task.division_name || undefined,
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        actualStartDate: actualStart,
        actualEndDate: actualEnd,
        progress: task.progress_percent || 0,
        statusColor: STATUS_DOT_COLORS[task.status] || STATUS_DOT_COLORS.pending,
        group: task.phase_name || undefined,
        groupId: task.division_name || "__ungrouped__",
    };
}

// ============================================================================
// Hook: useConstructionGantt
// ============================================================================

interface UseConstructionGanttOptions {
    organizationId: string;
    initialTasks: ConstructionTaskView[];
    initialDependencies: ConstructionDependencyRow[];
    filteredTasks: ConstructionTaskView[];
    workDays?: number[];
}

export function useConstructionGantt({
    organizationId,
    initialTasks,
    initialDependencies,
    filteredTasks,
    workDays = [1, 2, 3, 4, 5],
}: UseConstructionGanttOptions) {
    const [tasks, setTasks] = useState(initialTasks);
    const [dependencies, setDependencies] = useState<ConstructionDependencyRow[]>(initialDependencies);

    // Sync local state when server props change
    useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

    // Non-work days for Gantt
    const nonWorkDays = useMemo(() => {
        const allDays = [0, 1, 2, 3, 4, 5, 6];
        return allDays.filter(d => !workDays.includes(d));
    }, [workDays]);

    // Gantt items
    const ganttItems = useMemo(() => {
        return filteredTasks.map(taskToGanttItem).filter(Boolean) as GanttItem[];
    }, [filteredTasks]);

    // Gantt groups
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const ganttGroups: GanttGroup[] = useMemo(() => {
        const divisionNames = new Set<string>();
        for (const item of ganttItems) {
            if (item.groupId) divisionNames.add(item.groupId);
        }
        const sorted = Array.from(divisionNames).sort((a, b) => {
            if (a === "__ungrouped__") return 1;
            if (b === "__ungrouped__") return -1;
            return a.localeCompare(b);
        });
        return sorted.map(name => ({
            id: name,
            label: name === "__ungrouped__" ? "Sin rubro" : name,
            isCollapsed: collapsedGroups.has(name),
        }));
    }, [ganttItems, collapsedGroups]);

    const handleGroupToggle = useCallback((groupId: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    }, []);

    // Gantt dependencies
    const ganttDependencies: GanttDependency[] = useMemo(() => {
        return dependencies.map(d => ({
            id: d.id,
            fromId: d.predecessor_task_id,
            toId: d.successor_task_id,
            type: d.type,
        }));
    }, [dependencies]);

    // ========================================================================
    // Dependency propagation
    // ========================================================================

    const propagateDependencies = useCallback((
        movedTaskId: string,
        movedTaskNewEnd: Date,
        currentTasks: ConstructionTaskView[],
        currentDeps: typeof dependencies,
        visited: Set<string> = new Set(),
    ): { id: string; original: ConstructionTaskView; newStartStr: string; newEndStr: string; newDuration: number }[] => {
        if (visited.has(movedTaskId)) return [];
        visited.add(movedTaskId);

        const affected: { id: string; original: ConstructionTaskView; newStartStr: string; newEndStr: string; newDuration: number }[] = [];

        const fsDeps = currentDeps.filter(
            d => d.predecessor_task_id === movedTaskId && d.type === "FS"
        );

        for (const dep of fsDeps) {
            const successor = currentTasks.find(t => t.id === dep.successor_task_id);
            if (!successor) continue;

            const successorStart = parseDateFromDB(successor.planned_start_date);
            if (!successorStart) continue;

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

                const cascaded = propagateDependencies(
                    successor.id, newSuccessorEnd, currentTasks, currentDeps, visited,
                );
                affected.push(...cascaded);
            }
        }

        return affected;
    }, [dependencies]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleStatusChange = useCallback((task: ConstructionTaskView, newStatus: string) => {
        const previousStatus = task.status;
        const previousProgress = task.progress_percent;
        setTasks(prev =>
            prev.map(t =>
                t.id === task.id
                    ? { ...t, status: newStatus as ConstructionTaskStatus, progress_percent: newStatus === 'completed' ? 100 : t.progress_percent }
                    : t
            )
        );

        updateConstructionTaskStatus(task.id, task.project_id, newStatus as ConstructionTaskStatus)
            .then(result => {
                if (!result.success) {
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
    }, []);

    const persistCascade = useCallback((
        mainId: string,
        mainProjectId: string,
        mainUpdate: Partial<{ planned_start_date: string | null; planned_end_date: string | null }>,
        cascaded: { id: string; original: ConstructionTaskView; newStartStr: string; newEndStr: string }[],
        mainOriginal: ConstructionTaskView,
    ) => {
        const persists = [
            updateConstructionTask(mainId, mainProjectId, mainUpdate).then(result => {
                if (!result.success) {
                    setTasks(prev => prev.map(t => t.id === mainId ? mainOriginal : t));
                    toast.error(result.error || "Error al actualizar");
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
    }, []);

    const handleGanttItemClick = useCallback((id: string) => {
        return tasks.find(t => t.id === id) ?? null;
    }, [tasks]);

    const handleGanttItemMove = useCallback((id: string, newStart: Date, newEnd: Date) => {
        const original = tasks.find(t => t.id === id);
        if (!original) return;

        const newStartStr = formatDateForDB(newStart);
        const newEndStr = formatDateForDB(newEnd);
        const newDuration = differenceInCalendarDays(newEnd, newStart) + 1;
        const cascaded = propagateDependencies(id, newEnd, tasks, dependencies);

        setTasks(prev => {
            let updated = prev.map(t => t.id === id ? { ...t, planned_start_date: newStartStr, planned_end_date: newEndStr, duration_in_days: newDuration } : t);
            for (const c of cascaded) {
                updated = updated.map(t => t.id === c.id ? { ...t, planned_start_date: c.newStartStr, planned_end_date: c.newEndStr, duration_in_days: c.newDuration } : t);
            }
            return updated;
        });

        const totalMoved = 1 + cascaded.length;
        toast.success(totalMoved > 1 ? `${totalMoved} tareas actualizadas` : "Fechas actualizadas");

        persistCascade(id, original.project_id, { planned_start_date: newStartStr, planned_end_date: newEndStr }, cascaded, original);
    }, [tasks, dependencies, propagateDependencies, persistCascade]);

    const handleGanttItemResize = useCallback((id: string, newEnd: Date) => {
        const original = tasks.find(t => t.id === id);
        if (!original) return;

        const newEndStr = formatDateForDB(newEnd);
        const startDate = parseDateFromDB(original.planned_start_date) || newEnd;
        const newDuration = differenceInCalendarDays(newEnd, startDate) + 1;
        const cascaded = propagateDependencies(id, newEnd, tasks, dependencies);

        setTasks(prev => {
            let updated = prev.map(t => t.id === id ? { ...t, planned_end_date: newEndStr, duration_in_days: newDuration } : t);
            for (const c of cascaded) {
                updated = updated.map(t => t.id === c.id ? { ...t, planned_start_date: c.newStartStr, planned_end_date: c.newEndStr, duration_in_days: c.newDuration } : t);
            }
            return updated;
        });

        const totalMoved = 1 + cascaded.length;
        toast.success(totalMoved > 1 ? `${totalMoved} tareas actualizadas` : "Duración actualizada");

        persistCascade(id, original.project_id, { planned_end_date: newEndStr }, cascaded, original);
    }, [tasks, dependencies, propagateDependencies, persistCascade]);

    const handleDependencyCreate = useCallback((fromId: string, toId: string, type: GanttDependency["type"]) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic: ConstructionDependencyRow = { id: tempId, predecessor_task_id: fromId, successor_task_id: toId, type, lag_days: 0 };
        setDependencies(prev => [...prev, optimistic]);
        toast.success("Dependencia creada");

        createConstructionDependency(organizationId, fromId, toId, type).then(result => {
            if (result.success && result.id) {
                setDependencies(prev => prev.map(d => d.id === tempId ? { ...d, id: result.id! } : d));
            } else {
                setDependencies(prev => prev.filter(d => d.id !== tempId));
                toast.error(result.error || "Error al crear dependencia");
            }
        });
    }, [organizationId]);

    const handleDependencyDelete = useCallback((depId: string) => {
        const original = dependencies.find(d => d.id === depId);
        if (!original) return;

        setDependencies(prev => prev.filter(d => d.id !== depId));
        toast.success("Dependencia eliminada");

        deleteConstructionDependency(depId).then(result => {
            if (!result.success) {
                setDependencies(prev => [...prev, original]);
                toast.error(result.error || "Error al eliminar dependencia");
            }
        });
    }, [dependencies]);

    const handleRowReorder = useCallback((itemId: string, targetItemId: string, position: "before" | "after") => {
        setTasks(prev => {
            const itemIndex = prev.findIndex(t => t.id === itemId);
            const targetIndex = prev.findIndex(t => t.id === targetItemId);
            if (itemIndex === -1 || targetIndex === -1) return prev;

            const updated = [...prev];
            const [moved] = updated.splice(itemIndex, 1);
            const newTargetIndex = updated.findIndex(t => t.id === targetItemId);
            const insertAt = position === "before" ? newTargetIndex : newTargetIndex + 1;
            updated.splice(insertAt, 0, moved);
            return updated;
        });
    }, []);

    return {
        tasks,
        setTasks,
        ganttItems,
        ganttGroups,
        ganttDependencies,
        nonWorkDays,
        handleGroupToggle,
        handleStatusChange,
        handleGanttItemClick,
        handleGanttItemMove,
        handleGanttItemResize,
        handleDependencyCreate,
        handleDependencyDelete,
        handleRowReorder,
    };
}
