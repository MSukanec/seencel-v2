"use client";

import { useState, useMemo } from "react";
import { TaskElement, TaskParameter, Unit } from "@/features/tasks/types";
import { TasksElementForm } from "../forms";
import { deleteTaskElement, toggleElementParameter } from "../actions";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Boxes, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

// ============================================================================
// Types
// ============================================================================

interface ElementParameterLink {
    element_id: string;
    parameter_id: string;
}

interface ElementsCatalogViewProps {
    elements: TaskElement[];
    parameters?: TaskParameter[];
    elementParameterLinks?: ElementParameterLink[];
    units?: Unit[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksElementsView({
    elements,
    parameters = [],
    elementParameterLinks = [],
    units = [],
    isAdminMode = false,
}: ElementsCatalogViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<TaskElement | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

    // Build parameter IDs set per element
    const parametersByElement = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        elementParameterLinks.forEach(link => {
            if (!map[link.element_id]) {
                map[link.element_id] = new Set();
            }
            map[link.element_id].add(link.parameter_id);
        });
        return map;
    }, [elementParameterLinks]);

    // Filter elements by search query
    const filteredElements = useMemo(() => {
        if (!searchQuery.trim()) return elements;
        const query = searchQuery.toLowerCase();
        return elements.filter(e =>
            e.name.toLowerCase().includes(query) ||
            (e.code && e.code.toLowerCase().includes(query)) ||
            (e.description && e.description.toLowerCase().includes(query))
        );
    }, [elements, searchQuery]);

    // Sort alphabetically by name
    const sortedElements = useMemo(() => {
        return [...filteredElements].sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredElements]);

    // ========================================================================
    // Toggle expand
    // ========================================================================

    const toggleExpand = (elementId: string) => {
        setExpandedElements(prev => {
            const next = new Set(prev);
            if (next.has(elementId)) {
                next.delete(elementId);
            } else {
                next.add(elementId);
            }
            return next;
        });
    };

    // ========================================================================
    // Handlers - Elements
    // ========================================================================

    const handleCreateElement = () => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden crear elementos");
            return;
        }

        openModal(
            <TasksElementForm units={units} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Crear Elemento",
                description: "Definí un nuevo elemento constructivo para tareas.",
                size: "md"
            }
        );
    };

    const handleEditElement = (element: TaskElement) => {
        if (!isAdminMode) return;

        openModal(
            <TasksElementForm initialData={element} units={units} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Editar Elemento",
                description: `Modificando "${element.name}"`,
                size: "md"
            }
        );
    };

    // ========================================================================
    // Toggle parameter association
    // ========================================================================

    const handleToggleParameter = async (elementId: string, parameterId: string, isLinked: boolean) => {
        if (!isAdminMode) return;

        const result = await toggleElementParameter(elementId, parameterId, !isLinked);
        if (result.error) {
            toast.error(result.error);
        }
    };

    // ========================================================================
    // Delete handlers
    // ========================================================================

    const handleDeleteClick = (element: TaskElement) => {
        if (!isAdminMode) return;
        setItemToDelete(element);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        const result = await deleteTaskElement(itemToDelete.id);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Elemento eliminado");
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
                searchPlaceholder="Buscar elementos..."
                actions={isAdminMode ? [{
                    label: "Nuevo Elemento",
                    icon: Plus,
                    onClick: handleCreateElement,
                }] : []}
            />

            {/* Elements List */}
            {sortedElements.length === 0 ? (
                <EmptyState
                    icon={Boxes}
                    title={searchQuery ? "No se encontraron elementos" : "No hay elementos definidos"}
                    description={searchQuery
                        ? "Probá con otros términos de búsqueda"
                        : "Los elementos representan componentes constructivos como Contrapiso, Muro, Losa"
                    }
                />
            ) : (
                <div className="space-y-3">
                    {sortedElements.map((element) => {
                        const isExpanded = expandedElements.has(element.id);
                        const linkedParamIds = parametersByElement[element.id] || new Set();
                        const paramCount = linkedParamIds.size;

                        return (
                            <Card key={element.id} className="overflow-hidden">
                                {/* Element Header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Expand button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => toggleExpand(element.id)}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>

                                        {/* Icon */}
                                        <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                            <Boxes className="h-4 w-4" />
                                        </div>

                                        {/* Name and metadata */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{element.name}</h3>
                                                {element.code && (
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {element.code}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {paramCount} parámetro{paramCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {element.description && (
                                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                                    {element.description}
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
                                                onClick={() => handleEditElement(element)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(element)}
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
                                                {parameters.map((param) => {
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
                                                                onCheckedChange={() => handleToggleParameter(element.id, param.id, isLinked)}
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
                        <AlertDialogTitle>Eliminar Elemento</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que querés eliminar &quot;{itemToDelete?.name}&quot;?
                            Esta acción desvinculará el elemento de todas las tareas.
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
