"use client";

import { useState, useMemo } from "react";
import { TaskConstructionSystem, TaskParameter } from "@/features/tasks/types";
import { TasksSystemForm } from "../forms";
import { deleteConstructionSystem, toggleSystemParameter } from "../actions";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench, ChevronDown, ChevronRight, Settings2, Tag } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ViewEmptyState } from "@/components/shared/empty-state";

// ============================================================================
// Types
// ============================================================================

interface SystemParameterLink {
    system_id: string;
    parameter_id: string;
}

interface SystemsCatalogViewProps {
    systems: TaskConstructionSystem[];
    parameters?: TaskParameter[];
    systemParameterLinks?: SystemParameterLink[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksSistemasView({
    systems,
    parameters = [],
    systemParameterLinks = [],
    isAdminMode = false,
}: SystemsCatalogViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<TaskConstructionSystem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

    // Build parameter IDs set per system
    const parametersBySystem = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        systemParameterLinks.forEach(link => {
            if (!map[link.system_id]) {
                map[link.system_id] = new Set();
            }
            map[link.system_id].add(link.parameter_id);
        });
        return map;
    }, [systemParameterLinks]);

    // Filter systems by search query
    const filteredSystems = useMemo(() => {
        if (!searchQuery.trim()) return systems;
        const query = searchQuery.toLowerCase();
        return systems.filter(s =>
            s.name.toLowerCase().includes(query) ||
            (s.code && s.code.toLowerCase().includes(query)) ||
            (s.description && s.description.toLowerCase().includes(query)) ||
            (s.category && s.category.toLowerCase().includes(query))
        );
    }, [systems, searchQuery]);

    // Sort by order, then name
    const sortedSystems = useMemo(() => {
        return [...filteredSystems].sort((a, b) => {
            if (a.order !== null && b.order !== null) return a.order - b.order;
            if (a.order !== null) return -1;
            if (b.order !== null) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [filteredSystems]);

    // Sort parameters alphabetically
    const sortedParametersList = useMemo(() => {
        return [...parameters].sort((a, b) => a.label.localeCompare(b.label));
    }, [parameters]);

    // ========================================================================
    // Toggle expand
    // ========================================================================

    const toggleExpand = (systemId: string) => {
        setExpandedSystems(prev => {
            const next = new Set(prev);
            if (next.has(systemId)) {
                next.delete(systemId);
            } else {
                next.add(systemId);
            }
            return next;
        });
    };

    // ========================================================================
    // Handlers - Systems CRUD
    // ========================================================================

    const handleCreateSystem = () => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden crear sistemas");
            return;
        }

        openModal(
            <TasksSystemForm onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Crear Sistema Constructivo",
                description: "Definí un nuevo sistema constructivo (ej: Estructura, Mampostería, Revestimientos).",
                size: "md"
            }
        );
    };

    const handleEditSystem = (system: TaskConstructionSystem) => {
        if (!isAdminMode) return;

        openModal(
            <TasksSystemForm initialData={system} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Editar Sistema Constructivo",
                description: `Modificando "${system.name}"`,
                size: "md"
            }
        );
    };

    // ========================================================================
    // Toggle parameter association
    // ========================================================================

    const handleToggleParameter = async (systemId: string, parameterId: string, isLinked: boolean) => {
        if (!isAdminMode) return;

        const result = await toggleSystemParameter(systemId, parameterId, !isLinked);
        if (result.error) {
            toast.error(result.error);
        }
    };

    // ========================================================================
    // Delete handlers
    // ========================================================================

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
            {/* Toolbar */}
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

            {/* Systems List */}
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
                        featureDescription="Los sistemas constructivos agrupan elementos según su función (Estructura, Mampostería, Instalaciones, Revestimientos, etc.) y definen qué parámetros son necesarios."
                        onAction={isAdminMode ? handleCreateSystem : undefined}
                        actionLabel={isAdminMode ? "Nuevo Sistema" : undefined}
                    />
                )
            ) : (
                <div className="space-y-3">
                    {sortedSystems.map((system) => {
                        const isExpanded = expandedSystems.has(system.id);
                        const linkedParamIds = parametersBySystem[system.id] || new Set();
                        const paramCount = linkedParamIds.size;

                        return (
                            <Card key={system.id} className="overflow-hidden">
                                {/* System Header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Expand button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => toggleExpand(system.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>

                                        {/* Icon */}
                                        <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                            <Wrench className="h-4 w-4" />
                                        </div>

                                        {/* Name and metadata */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{system.name}</h3>
                                                {system.code && (
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {system.code}
                                                    </Badge>
                                                )}
                                                {system.category && (
                                                    <Badge variant="secondary" className="text-xs gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        {system.category}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {paramCount} parámetro{paramCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {system.description && (
                                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                                    {system.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isAdminMode && (
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEditSystem(system)}
                                            >
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
                                </div>

                                {/* Parameters list (collapsible) */}
                                {isExpanded && (
                                    <div className="border-t p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Parámetros Asociados</span>
                                        </div>

                                        {parameters.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No hay parámetros disponibles
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {sortedParametersList.map((param) => {
                                                    const isLinked = linkedParamIds.has(param.id);
                                                    return (
                                                        <label
                                                            key={param.id}
                                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isLinked
                                                                ? 'bg-primary/10 border border-primary/30'
                                                                : 'bg-muted/30 hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <Checkbox
                                                                checked={isLinked}
                                                                disabled={!isAdminMode}
                                                                onCheckedChange={() => handleToggleParameter(system.id, param.id, isLinked)}
                                                            />
                                                            <span className="text-sm truncate">{param.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Sistema Constructivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que querés eliminar &quot;{itemToDelete?.name}&quot;?
                            Esta acción desvinculará el sistema de todos sus parámetros y elementos.
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
