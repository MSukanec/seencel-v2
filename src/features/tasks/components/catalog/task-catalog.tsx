"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MoreHorizontal, Pencil, Trash2, Eye, Monitor, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/providers/modal-store";
import { ContextSidebar } from "@/providers/context-sidebar-provider";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

import { DivisionsSidebar } from "./divisions-sidebar";
import { TaskForm } from "../forms/task-form";
import { deleteTask } from "../../actions";
import { TasksByDivision, TaskView, Unit, TaskDivision } from "../../types";

interface TaskCatalogProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    searchQuery?: string;
    originFilter?: "all" | "system" | "organization";
}

export function TaskCatalog({
    groupedTasks,
    orgId,
    units,
    divisions,
    isAdminMode = false,
    searchQuery: externalSearchQuery = "",
    originFilter = "all",
}: TaskCatalogProps) {
    const router = useRouter();
    const locale = useLocale();
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

    // Handlers
    const handleViewTask = (task: TaskView) => {
        const basePath = isAdminMode ? `/${locale}/admin/catalog/task` : `/${locale}/organization/catalog/task`;
        router.push(`${basePath}/${task.id}`);
    };

    const handleEditTask = (task: TaskView) => {
        openModal(
            <TaskForm
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
    };

    const handleDeleteClick = (task: TaskView) => {
        setTaskToDelete(task);
        setDeleteDialogOpen(true);
    };

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

            {/* Main Content - same pattern as MaterialsCatalogView */}
            <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="font-medium text-lg">No hay tareas</h3>
                        <p className="text-sm mt-1">
                            {externalSearchQuery ? "No se encontraron resultados" : "Agregá tareas para comenzar"}
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            isAdminMode={isAdminMode}
                            onView={handleViewTask}
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

// Individual Task List Item
interface TaskListItemProps {
    task: TaskView;
    isAdminMode: boolean;
    onView: (task: TaskView) => void;
    onEdit: (task: TaskView) => void;
    onDelete: (task: TaskView) => void;
}

function TaskListItem({ task, isAdminMode, onView, onEdit, onDelete }: TaskListItemProps) {
    // System tasks are NEVER editable - they are immutable by design
    // Only organization tasks (is_system = false) can be edited
    const isEditable = !task.is_system;
    const displayName = task.name || task.custom_name || "Sin nombre";

    return (
        <div
            className="flex items-center gap-3 p-3 rounded-lg border bg-sidebar hover:bg-muted/50 transition-colors group cursor-pointer"
            onClick={() => onView(task)}
        >
            {/* Origin Color Line - slate for system, indigo for organization */}
            <div
                className={`w-1.5 self-stretch rounded-full shrink-0 ${task.is_system
                    ? "bg-slate-500"
                    : "bg-indigo-500"
                    }`}
            />

            {/* Name & Badges (stacked) */}
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="text-sm font-medium truncate">{displayName}</div>

                {/* Rubro / Unidad / Código badges */}
                <div className="flex flex-wrap gap-1.5">
                    {task.division_name && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {task.division_name}
                        </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {task.unit_name || "Sin unidad"}
                    </span>
                    {task.code && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {task.code}
                        </span>
                    )}
                </div>
            </div>

            {/* Source Badge */}
            {task.is_system ? (
                <Badge variant="system" className="shrink-0 gap-1">
                    <Monitor className="h-3 w-3" />
                    Sistema
                </Badge>
            ) : (
                <Badge variant="organization" className="shrink-0 gap-1">
                    <Building2 className="h-3 w-3" />
                    Propia
                </Badge>
            )}

            {/* Status */}
            {!task.is_published && (
                <Badge variant="outline" className="shrink-0 text-xs text-amber-500 border-amber-500/30">
                    Borrador
                </Badge>
            )}

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onView(task)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                    </DropdownMenuItem>
                    {isEditable && (
                        <>
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(task)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

