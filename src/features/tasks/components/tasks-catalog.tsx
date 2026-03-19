"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { ClipboardList, Archive } from "lucide-react";
import { toast } from "sonner";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { TaskListItem } from "@/components/shared/list-item";
import { usePanel } from "@/stores/panel-store";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";

import { deleteTask, updateTaskStatus } from "../actions";
import { TasksByDivision, TaskView, Unit, TaskDivision } from "../types";

// ============================================================================
// Section Header components
// ============================================================================

function DivisionSectionHeader({ name, count }: { name: string; count: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider whitespace-nowrap">
                {name}
            </span>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs tabular-nums text-muted-foreground/60">({count})</span>
        </div>
    );
}

function ArchivedSectionHeader({ count }: { count: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Archive className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground/40 tracking-wider whitespace-nowrap">
                Archivadas
            </span>
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-xs tabular-nums text-muted-foreground/40">({count})</span>
        </div>
    );
}

// ============================================================================
// Props
// ============================================================================

interface TaskCatalogProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    searchQuery?: string;
    originFilter?: "all" | "system" | "organization";
    /** Status values to show (empty Set = show all) */
    statusFilter?: Set<string>;
    /** Division filter from parent sidebar */
    selectedDivisionId?: string | null;
}

// ============================================================================
// Component
// ============================================================================

export function TaskCatalog({
    groupedTasks,
    orgId,
    units,
    divisions,
    isAdminMode = false,
    searchQuery: externalSearchQuery = "",
    originFilter = "all",
    statusFilter,
    selectedDivisionId = null,
}: TaskCatalogProps) {
    const router = useRouter();
    const { openPanel } = usePanel();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<TaskView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    /** Optimistic status overrides: taskId → newStatus */
    const [optimisticStatusMap, setOptimisticStatusMap] = useState<Map<string, string>>(new Map());

    // ── Division order map ─────────────────────────────────────────────────
    const divisionOrderMap = useMemo(() => {
        const map: Record<string, number> = {};
        divisions.forEach(d => { map[d.id] = d.order ?? 999999; });
        return map;
    }, [divisions]);

    // ── Flat tasks with optimistic status overrides applied ────────────────
    const allTasks = useMemo(() => {
        const tasks = groupedTasks.flatMap(g => g.tasks);
        if (optimisticStatusMap.size === 0) return tasks;
        return tasks.map(t =>
            optimisticStatusMap.has(t.id)
                ? { ...t, status: optimisticStatusMap.get(t.id)! }
                : t
        );
    }, [groupedTasks, optimisticStatusMap]);

    // ── Filtered tasks (search + origin + division + status) ───────────────
    const filteredTasks = useMemo(() => {
        let tasks = allTasks;

        // Origin filter
        if (originFilter === "system") tasks = tasks.filter(t => t.is_system);
        else if (originFilter === "organization") tasks = tasks.filter(t => !t.is_system);

        // Division sidebar filter
        if (selectedDivisionId === "sin-division") {
            tasks = tasks.filter(t => !t.task_division_id);
        } else if (selectedDivisionId !== null) {
            tasks = tasks.filter(t => t.task_division_id === selectedDivisionId);
        }

        // Search filter
        if (externalSearchQuery.trim()) {
            const q = externalSearchQuery.toLowerCase();
            tasks = tasks.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.custom_name?.toLowerCase().includes(q) ||
                t.code?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }

        // Status filter (empty set = show all)
        if (statusFilter && statusFilter.size > 0) {
            tasks = tasks.filter(t => statusFilter.has(t.status ?? "active"));
        }

        return tasks;
    }, [allTasks, selectedDivisionId, externalSearchQuery, originFilter, statusFilter]);

    // ── Group: active+draft by division, archived in separate bucket ───────
    const { divisionGroups, archivedTasks } = useMemo(() => {
        const active = filteredTasks.filter(t => (t.status ?? "active") !== "archived");
        const archived = filteredTasks.filter(t => t.status === "archived");

        // Group active tasks by division
        const groupMap = new Map<string | null, TaskView[]>();
        active.forEach(task => {
            const key = task.task_division_id ?? null;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(task);
        });

        // Sort each group alphabetically
        groupMap.forEach(group =>
            group.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );

        // Build ordered groups following division order
        const groups: { divisionId: string | null; divisionName: string; tasks: TaskView[] }[] = [];

        divisions
            .slice()
            .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999))
            .forEach(div => {
                const tasks = groupMap.get(div.id);
                if (tasks && tasks.length > 0) {
                    groups.push({ divisionId: div.id, divisionName: div.name, tasks });
                }
            });

        // "Sin Rubro" at end of active groups
        const noDiv = groupMap.get(null);
        if (noDiv && noDiv.length > 0) {
            groups.push({ divisionId: null, divisionName: "Sin Rubro", tasks: noDiv });
        }

        // Sort archived alphabetically
        archived.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        return { divisionGroups: groups, archivedTasks: archived };
    }, [filteredTasks, divisions]);



    // ── Handlers ───────────────────────────────────────────────────────────
    const handleViewTask = useCallback((task: TaskView) => {
        const pathname = isAdminMode
            ? "/admin/catalog/task/[taskId]"
            : "/organization/catalog/task/[taskId]";
        router.push({ pathname, params: { taskId: task.id } } as any);
    }, [isAdminMode, router]);

    const handleEditTask = useCallback((task: TaskView) => {
        openPanel('tasks-form', {
            mode: "edit",
            initialData: task,
            organizationId: orgId,
            units,
            divisions,
            isAdminMode,
            directType: "own",
        });
    }, [orgId, units, divisions, isAdminMode, openPanel]);

    const handleDeleteClick = useCallback((task: TaskView) => {
        setTaskToDelete(task);
        setDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteTask(taskToDelete.id, isAdminMode);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Tarea eliminada correctamente");
                router.refresh();
            }
        } catch {
            toast.error("Error al eliminar la tarea");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
        }
    };

    const handleStatusChange = useCallback(async (
        task: TaskView,
        status: "draft" | "active" | "archived"
    ) => {
        // 1. Optimistic: update UI immediately
        setOptimisticStatusMap(prev => new Map(prev).set(task.id, status));

        // 2. Server action (runs in background)
        const result = await updateTaskStatus(task.id, status, isAdminMode);

        if (result.error) {
            // Rollback
            setOptimisticStatusMap(prev => {
                const next = new Map(prev);
                next.delete(task.id);
                return next;
            });
            toast.error(result.error);
        } else {
            const labels = { draft: "Borrador", active: "Activa", archived: "Archivada" };
            toast.success(`Estado cambiado a: ${labels[status]}`);
            router.refresh(); // Sync in background
        }
    }, [isAdminMode, router]);

    // ── Derived ────────────────────────────────────────────────────────────
    const isEmpty = divisionGroups.length === 0 && archivedTasks.length === 0;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <div className="pb-8">
                {isEmpty ? (
                    <div className="flex items-center justify-center py-12">
                        <ViewEmptyState
                            mode="no-results"
                            icon={ClipboardList}
                            viewName="tareas"
                            filterContext={
                                externalSearchQuery
                                    ? "con ese criterio de búsqueda"
                                    : "en esta categoría"
                            }
                            onResetFilters={() => {}}
                        />
                    </div>
                ) : (
                    <>
                        {/* ── Division groups (active + draft) ── */}
                        {divisionGroups.map(({ divisionId, divisionName, tasks }) => (
                            <div key={divisionId ?? "no-div"}>
                                <DivisionSectionHeader name={divisionName} count={tasks.length} />
                                <div className="space-y-2">
                                    {tasks.map((task) => (
                                        <TaskListItem
                                            key={task.id}
                                            task={task}
                                            isAdminMode={isAdminMode}
                                            hideDivisionBadge={true}
                                            onClick={handleViewTask}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteClick}
                                            onStatusChange={(isAdminMode || !task.is_system) ? handleStatusChange : undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* ── Archived section (always at bottom) ── */}
                        {archivedTasks.length > 0 && (
                            <div className="opacity-60">
                                <ArchivedSectionHeader count={archivedTasks.length} />
                                <div className="space-y-2">
                                    {archivedTasks.map((task) => (
                                        <TaskListItem
                                            key={task.id}
                                            task={task}
                                            isAdminMode={isAdminMode}
                                            hideDivisionBadge={true}
                                            onClick={handleViewTask}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteClick}
                                            onStatusChange={(isAdminMode || !task.is_system) ? handleStatusChange : undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Tarea"
                description={
                    taskToDelete
                        ? `¿Estás seguro de que deseas eliminar la tarea "${taskToDelete.name || taskToDelete.custom_name}"? Esta acción no se puede deshacer.`
                        : ""
                }
                confirmLabel="Eliminar"
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}
