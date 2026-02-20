"use client";

import { useState, useMemo } from "react";
import { TaskConstructionSystem } from "@/features/tasks/types";
import { TasksSystemForm } from "../forms";
import { deleteConstructionSystem } from "../actions";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench, Tag } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ViewEmptyState } from "@/components/shared/empty-state";

// ============================================================================
// Types
// ============================================================================

interface SystemsCatalogViewProps {
    systems: TaskConstructionSystem[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksSistemasView({
    systems,
    isAdminMode = false,
}: SystemsCatalogViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<TaskConstructionSystem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredSystems = useMemo(() => {
        if (!searchQuery.trim()) return systems;
        const q = searchQuery.toLowerCase();
        return systems.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.code && s.code.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q)) ||
            (s.category && s.category.toLowerCase().includes(q))
        );
    }, [systems, searchQuery]);

    const sortedSystems = useMemo(() =>
        [...filteredSystems].sort((a, b) => a.name.localeCompare(b.name)),
        [filteredSystems]
    );

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleCreateSystem = () => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden crear sistemas");
            return;
        }
        openModal(
            <TasksSystemForm onSuccess={closeModal} onCancel={closeModal} />,
            { title: "Crear Sistema Constructivo", description: "Definí un nuevo sistema constructivo.", size: "md" }
        );
    };

    const handleEditSystem = (system: TaskConstructionSystem) => {
        if (!isAdminMode) return;
        openModal(
            <TasksSystemForm initialData={system} onSuccess={closeModal} onCancel={closeModal} />,
            { title: "Editar Sistema Constructivo", description: `Modificando "${system.name}"`, size: "md" }
        );
    };

    const handleDeleteClick = (system: TaskConstructionSystem) => {
        if (!isAdminMode) return;
        setItemToDelete(system);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        const result = await deleteConstructionSystem(itemToDelete.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Sistema eliminado");
        }
        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar sistemas constructivos..."
                actions={isAdminMode ? [{
                    label: "Nuevo Sistema",
                    icon: Plus,
                    onClick: handleCreateSystem,
                }] : []}
            />

            {sortedSystems.length === 0 ? (
                searchQuery ? (
                    <ViewEmptyState
                        mode="no-results"
                        icon={Wrench}
                        viewName="sistemas"
                        filterContext="con ese criterio de búsqueda"
                        onResetFilters={() => setSearchQuery("")}
                    />
                ) : (
                    <ViewEmptyState
                        mode="empty"
                        icon={Wrench}
                        viewName="Sistemas Constructivos"
                        featureDescription="Los sistemas constructivos agrupan elementos según su función (Estructura, Mampostería, Instalaciones, Revestimientos, etc.)."
                        onAction={isAdminMode ? handleCreateSystem : undefined}
                        actionLabel={isAdminMode ? "Nuevo Sistema" : undefined}
                    />
                )
            ) : (
                <div className="space-y-2">
                    {sortedSystems.map((system) => (
                        <Card key={system.id} className="flex items-center justify-between p-4">
                            {/* Icon */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                    <Wrench className="h-4 w-4" />
                                </div>

                                {/* Name and metadata */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{system.name}</span>
                                        {system.code && (
                                            <Badge variant="outline" className="text-xs font-mono">{system.code}</Badge>
                                        )}
                                        {system.category && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                <Tag className="h-3 w-3" />
                                                {system.category}
                                            </Badge>
                                        )}
                                    </div>
                                    {system.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{system.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {isAdminMode && (
                                <div className="flex gap-1 shrink-0 ml-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSystem(system)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteClick(system)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Sistema Constructivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que querés eliminar &quot;{itemToDelete?.name}&quot;?
                            Esta acción desvinculará el sistema de todos sus elementos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
