"use client";

import { useState, useTransition } from "react";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { ConstructionTaskCard } from "../components/construction-task-card";
import { ConstructionTaskForm } from "../forms/construction-task-form";
import { deleteConstructionTask, updateConstructionTaskStatus } from "../actions";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useModal } from "@/providers/modal-store";
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
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ConstructionTasksViewProps {
    projectId: string;
    organizationId: string;
    tasks: ConstructionTaskView[];
}

export function ConstructionTasksView({
    projectId,
    organizationId,
    tasks: initialTasks,
}: ConstructionTasksViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [tasks, setTasks] = useState(initialTasks);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ConstructionTaskStatus | "all">("all");
    const [deletingTask, setDeletingTask] = useState<ConstructionTaskView | null>(null);
    const [isPending, startTransition] = useTransition();

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            (task.task_name || task.custom_name || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Group tasks by status for summary
    const taskCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleFormSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCreate = () => {
        openModal(
            <ConstructionTaskForm
                projectId={projectId}
                organizationId={organizationId}
                onSuccess={handleFormSuccess}
                onCancel={closeModal}
            />,
            {
                title: "Nueva Tarea",
                description: "Agrega una nueva tarea de construcción al proyecto.",
                size: "md",
            }
        );
    };

    const handleEdit = (task: ConstructionTaskView) => {
        openModal(
            <ConstructionTaskForm
                projectId={projectId}
                organizationId={organizationId}
                initialData={task}
                onSuccess={handleFormSuccess}
                onCancel={closeModal}
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

        startTransition(async () => {
            const result = await deleteConstructionTask(deletingTask.id, projectId);
            if (result.success) {
                setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
                toast.success("Tarea eliminada");
            } else {
                toast.error(result.error || "Error al eliminar");
            }
            setDeletingTask(null);
        });
    };

    const handleStatusChange = (task: ConstructionTaskView, newStatus: string) => {
        startTransition(async () => {
            const result = await updateConstructionTaskStatus(
                task.id,
                projectId,
                newStatus as ConstructionTaskStatus
            );
            if (result.success) {
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
                toast.success("Estado actualizado");
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        });
    };

    return (
        <>
            {/* Toolbar */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar tareas..."
                actions={[
                    {
                        label: "Nueva Tarea",
                        icon: Plus,
                        onClick: handleCreate,
                    },
                ]}
                leftActions={
                    <div className="flex items-center gap-2">
                        {(Object.keys(STATUS_CONFIG) as ConstructionTaskStatus[]).map((status) => (
                            <Badge
                                key={status}
                                variant="outline"
                                className={cn(
                                    "cursor-pointer transition-all",
                                    statusFilter === status
                                        ? cn(STATUS_CONFIG[status].color, STATUS_CONFIG[status].bgColor)
                                        : "hover:bg-muted"
                                )}
                                onClick={() => setStatusFilter(
                                    statusFilter === status ? "all" : status
                                )}
                            >
                                {STATUS_CONFIG[status].label}
                                {taskCounts[status] ? ` (${taskCounts[status]})` : ""}
                            </Badge>
                        ))}
                    </div>
                }
            />

            {/* Content */}
            {filteredTasks.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title="Sin tareas de construcción"
                    description={
                        tasks.length === 0
                            ? "Las tareas aparecerán aquí cuando se apruebe un presupuesto o las agregues manualmente."
                            : "No hay tareas que coincidan con los filtros aplicados."
                    }
                    action={tasks.length === 0 ? (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar tarea
                        </button>
                    ) : undefined}
                />
            ) : (
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
