"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { TaskListItem } from "@/components/shared/list-item";
import { useModal } from "@/stores/modal-store";
import { ContextSidebar } from "@/stores/sidebar-store";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";

import { DivisionsSidebar } from "./divisions-sidebar";
import { TasksForm } from "../forms/tasks-form";
import { deleteTask } from "../actions";
import { TasksByDivision, TaskView, Unit, TaskDivision } from "../types";

interface TaskCatalogProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    searchQuery?: string;
    originFilter?: "all" | "system" | "organization";
    /** Multi-select: check if a task is selected */
    isSelected?: (id: string) => boolean;
    /** Multi-select: toggle selection of a task */
    onToggleSelect?: (id: string) => void;
}

export function TaskCatalog({
    groupedTasks,
    orgId,
    units,
    divisions,
    isAdminMode = false,
    searchQuery: externalSearchQuery = "",
    originFilter = "all",
    isSelected,
    onToggleSelect,
}: TaskCatalogProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    // State
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<TaskView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create order map from divisions for sorting
    const divisionOrderMap = useMemo(() => {
        const map: Record<string, number> = {};
        divisions.forEach(d => {
            map[d.id] = d.order ?? 999999;
        });
        return map;
    }, [divisions]);

    // Flatten all tasks
    const allTasks = useMemo(() => {
        return groupedTasks.flatMap(g => g.tasks);
    }, [groupedTasks]);

    // Calculate task counts per division (considering origin filter)
    const taskCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        // Filter by origin first
        let tasksToCount = allTasks;
        if (originFilter === "system") {
            tasksToCount = tasksToCount.filter(t => t.is_system);
        } else if (originFilter === "organization") {
            tasksToCount = tasksToCount.filter(t => !t.is_system);
        }

        tasksToCount.forEach(t => {
            const divId = t.task_division_id || "sin-division";
            counts[divId] = (counts[divId] || 0) + 1;
        });

        return counts;
    }, [allTasks, originFilter]);

    // Filter tasks by selected division, search, and origin
    const filteredTasks = useMemo(() => {
        let tasks = allTasks;

        // Filter by origin
        if (originFilter === "system") {
            tasks = tasks.filter(t => t.is_system);
        } else if (originFilter === "organization") {
            tasks = tasks.filter(t => !t.is_system);
        }

        // Filter by division
        if (selectedDivisionId === "sin-division") {
            tasks = tasks.filter(t => !t.task_division_id);
        } else if (selectedDivisionId !== null) {
            tasks = tasks.filter(t => t.task_division_id === selectedDivisionId);
        }

        // Filter by search (from external toolbar)
        if (externalSearchQuery.trim()) {
            const query = externalSearchQuery.toLowerCase();
            tasks = tasks.filter(t =>
                t.name?.toLowerCase().includes(query) ||
                t.custom_name?.toLowerCase().includes(query) ||
                t.code?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Sort by division order, then by code/name
        return [...tasks].sort((a, b) => {
            // First by division order
            const orderA = a.task_division_id ? (divisionOrderMap[a.task_division_id] ?? 999999) : 999999;
            const orderB = b.task_division_id ? (divisionOrderMap[b.task_division_id] ?? 999999) : 999999;
            if (orderA !== orderB) return orderA - orderB;

            // Then by code (if available)
            if (a.code && b.code) return a.code.localeCompare(b.code);
            if (a.code) return -1;
            if (b.code) return 1;

            // Finally by name
            return (a.name || a.custom_name || "").localeCompare(b.name || b.custom_name || "");
        });
    }, [allTasks, selectedDivisionId, externalSearchQuery, originFilter, divisionOrderMap]);

    // Handlers — stable refs for memo'd children
    const handleViewTask = useCallback((task: TaskView) => {
        const pathname = isAdminMode
            ? '/admin/catalog/task/[taskId]'
            : '/organization/catalog/task/[taskId]';
        router.push({ pathname, params: { taskId: task.id } } as any);
    }, [isAdminMode, router]);

    const handleEditTask = useCallback((task: TaskView) => {
        openModal(
            <TasksForm
                mode="edit"
                initialData={task}
                organizationId={orgId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                onCancel={closeModal}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Editar Tarea",
                description: "Modifica los datos de esta tarea",
                size: "lg"
            }
        );
    }, [orgId, units, divisions, isAdminMode, openModal, closeModal, router]);

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
        } catch (error) {
            toast.error("Error al eliminar la tarea");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTaskToDelete(null);
        }
    };

    // Sidebar content - injected into the layout's context sidebar
    const sidebarContent = (
        <DivisionsSidebar
            divisions={divisions}
            taskCounts={taskCounts}
            selectedDivisionId={selectedDivisionId}
            onSelectDivision={setSelectedDivisionId}
            totalTasks={allTasks.length}
        />
    );

    return (
        <>
            {/* Inject sidebar content into the layout's context sidebar slot */}
            <ContextSidebar title="Rubros">
                {sidebarContent}
            </ContextSidebar>

            {/* Main Content */}
            <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <ViewEmptyState
                            mode="no-results"
                            icon={ClipboardList}
                            viewName="tareas"
                            filterContext={externalSearchQuery ? "con ese criterio de búsqueda" : "en esta categoría"}
                            onResetFilters={() => setSelectedDivisionId(null)}
                        />
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            isAdminMode={isAdminMode}
                            selected={isSelected?.(task.id) ?? false}
                            onToggleSelect={onToggleSelect}
                            onClick={handleViewTask}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteClick}
                        />
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
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
