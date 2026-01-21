"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TasksByDivision, TaskView, Unit, TaskDivision } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ChevronDown,
    ChevronRight,
    Search,
    Plus,
    Building2,
    Monitor,
    FileCode,
    Ruler,
    MoreHorizontal,
    Pencil,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-store";
import { TaskForm } from "../forms/task-form";
import { deleteTask } from "../../actions";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

interface TaskCatalogProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    isAdminMode?: boolean;
}

export function TaskCatalog({ groupedTasks, orgId, units, divisions, isAdminMode = false }: TaskCatalogProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
        new Set(groupedTasks.map(g => g.division?.id || "sin-division"))
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<TaskView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter tasks by search
    const filteredGroups = groupedTasks.map(group => ({
        ...group,
        tasks: group.tasks.filter(task => {
            const query = searchQuery.toLowerCase();
            return (
                task.name?.toLowerCase().includes(query) ||
                task.custom_name?.toLowerCase().includes(query) ||
                task.code?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query)
            );
        })
    })).filter(group => group.tasks.length > 0)
        // Sort by division order using the divisions prop
        .sort((a, b) => {
            if (!a.division) return 1;
            if (!b.division) return -1;
            const divA = divisions.find(d => d.id === a.division?.id);
            const divB = divisions.find(d => d.id === b.division?.id);
            const orderA = divA?.order ?? 999999;
            const orderB = divB?.order ?? 999999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.division.name || "").localeCompare(b.division.name || "");
        });

    const toggleDivision = (divisionId: string) => {
        setExpandedDivisions(prev => {
            const next = new Set(prev);
            if (next.has(divisionId)) {
                next.delete(divisionId);
            } else {
                next.add(divisionId);
            }
            return next;
        });
    };

    const handleCreateTask = () => {
        openModal(
            <TaskForm
                mode="create"
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
                title: isAdminMode ? "Nueva Tarea de Sistema" : "Nueva Tarea",
                description: isAdminMode
                    ? "Crear una tarea del sistema disponible para todas las organizaciones"
                    : "Agregar una tarea personalizada al catálogo de tu organización",
                size: "lg"
            }
        );
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

    const totalTasks = groupedTasks.reduce((acc, g) => acc + g.tasks.length, 0);
    const systemTasks = groupedTasks.reduce((acc, g) => acc + g.tasks.filter(t => t.is_system).length, 0);
    const orgTasks = totalTasks - systemTasks;

    return (
        <>
            <Card>
                {/* Header with toolbar */}
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <CardTitle>Catálogo de Tareas</CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                    <FileCode className="h-3 w-3" />
                                    {totalTasks} tareas
                                </Badge>
                                <Badge variant="system" className="gap-1">
                                    <Monitor className="h-3 w-3" />
                                    {systemTasks} sistema
                                </Badge>
                                <Badge variant="organization" className="gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {orgTasks} propias
                                </Badge>
                            </div>
                        </div>
                        <CardDescription>
                            Gestiona las tareas disponibles para tus presupuestos
                        </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleCreateTask}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Tarea
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tareas por nombre, código o descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Grouped Tasks */}
                    <div className="space-y-2">
                        {filteredGroups.map((group) => {
                            const divisionId = group.division?.id || "sin-division";
                            const isExpanded = expandedDivisions.has(divisionId);
                            const publishedCount = group.tasks.filter(t => t.is_published).length;
                            const draftCount = group.tasks.length - publishedCount;

                            return (
                                <div key={divisionId} className="border rounded-lg overflow-hidden">
                                    {/* Division Header */}
                                    <div
                                        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors bg-muted/30"
                                        onClick={() => toggleDivision(divisionId)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: group.division?.color || "#6b7280" }}
                                                />
                                                <span className="text-sm font-medium">
                                                    {group.division?.name || "Sin División"}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {group.tasks.length}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tasks List */}
                                    {isExpanded && (
                                        <div className="border-t divide-y">
                                            {group.tasks.map((task) => (
                                                <TaskRow
                                                    key={task.id}
                                                    task={task}
                                                    isAdminMode={isAdminMode}
                                                    onEdit={handleEditTask}
                                                    onDelete={handleDeleteClick}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filteredGroups.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No se encontraron tareas</p>
                            <p className="text-sm">
                                {searchQuery ? "Probá con otro término de búsqueda" : "Agregá tareas para comenzar"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

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

// Individual Task Row with actions
interface TaskRowProps {
    task: TaskView;
    isAdminMode?: boolean;
    onEdit: (task: TaskView) => void;
    onDelete: (task: TaskView) => void;
}

function TaskRow({ task, isAdminMode = false, onEdit, onDelete }: TaskRowProps) {
    // In admin mode, all tasks are editable. In org mode, only non-system tasks.
    const isEditable = isAdminMode || !task.is_system;

    return (
        <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-4">
                {/* Code */}
                <div className="w-40 shrink-0">
                    <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {task.code || "—"}
                    </code>
                </div>

                {/* Name */}
                <div className="flex-1">
                    <p className="text-sm font-medium">
                        {task.name || task.custom_name || "Sin nombre"}
                    </p>
                    {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                            {task.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Unit */}
                <Badge variant="outline" className="gap-1 text-xs">
                    <Ruler className="h-3 w-3" />
                    {task.unit_name || "—"}
                </Badge>

                {/* Source Badge */}
                {task.is_system ? (
                    <Badge variant="system" icon={<Monitor className="h-3 w-3" />}>
                        Sistema
                    </Badge>
                ) : (
                    <Badge variant="organization" icon={<Building2 className="h-3 w-3" />}>
                        Propia
                    </Badge>
                )}

                {/* Status */}
                {!task.is_published && (
                    <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                        Borrador
                    </Badge>
                )}

                {/* Actions Menu - Only for org tasks */}
                {isEditable ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="w-8" /> // Spacer for alignment
                )}
            </div>
        </div>
    );
}
