"use client";

import { useState, useMemo } from "react";
import { TaskParameter, TaskParameterOption, ParameterType, TaskElement } from "@/features/tasks/types";
import { TasksParameterForm, TasksOptionForm } from "../forms";
import { ElementsSidebar } from "../components/elements-sidebar";
import { deleteTaskParameter, deleteParameterOption } from "../actions";
import { useModal } from "@/providers/modal-store";
import { ContextSidebar } from "@/providers/context-sidebar-provider";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Hash, Type, ToggleLeft, List, Package, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";

// ============================================================================
// Types
// ============================================================================

interface ElementParameterLink {
    element_id: string;
    parameter_id: string;
}

interface Material {
    id: string;
    name: string;
    code?: string | null;
}

interface ParametersCatalogViewProps {
    parameters: TaskParameter[];
    elements?: TaskElement[];
    elementParameterLinks?: ElementParameterLink[];
    materials?: Material[];
    isAdminMode?: boolean;
}

const TYPE_CONFIG: Record<ParameterType, { icon: React.ElementType; label: string; color: string }> = {
    text: { icon: Type, label: "Texto", color: "bg-blue-500/10 text-blue-500" },
    number: { icon: Hash, label: "Número", color: "bg-green-500/10 text-green-500" },
    select: { icon: List, label: "Selección", color: "bg-purple-500/10 text-purple-500" },
    boolean: { icon: ToggleLeft, label: "Sí/No", color: "bg-orange-500/10 text-orange-500" },
    material: { icon: Package, label: "Material", color: "bg-pink-500/10 text-pink-500" },
};

// ============================================================================
// Component
// ============================================================================

export function TasksParametersView({
    parameters,
    elements = [],
    elementParameterLinks = [],
    materials = [],
    isAdminMode = false,
}: ParametersCatalogViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: "parameter" | "option"; item: any } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    // Build parameter IDs set for the selected element
    const parameterIdsForElement = useMemo(() => {
        if (!selectedElementId) return null; // null means show all
        return new Set(
            elementParameterLinks
                .filter(link => link.element_id === selectedElementId)
                .map(link => link.parameter_id)
        );
    }, [selectedElementId, elementParameterLinks]);

    // Calculate parameter counts per element
    const parameterCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        elementParameterLinks.forEach(link => {
            counts[link.element_id] = (counts[link.element_id] || 0) + 1;
        });
        return counts;
    }, [elementParameterLinks]);

    // Filter parameters by element and search query
    const filteredParameters = useMemo(() => {
        let result = parameters;

        // Filter by element
        if (parameterIdsForElement) {
            result = result.filter(p => parameterIdsForElement.has(p.id));
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.label.toLowerCase().includes(query) ||
                p.slug.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        return result;
    }, [parameters, parameterIdsForElement, searchQuery]);

    // Sort alphabetically by label
    const sortedParameters = useMemo(() => {
        return [...filteredParameters].sort((a, b) => a.label.localeCompare(b.label));
    }, [filteredParameters]);

    // ========================================================================
    // Toggle expand (only one at a time)
    // ========================================================================

    const toggleExpand = (paramId: string) => {
        setExpandedParams(prev => {
            if (prev.has(paramId)) {
                return new Set();
            }
            return new Set([paramId]);
        });
    };

    // ========================================================================
    // Handlers - Parameters
    // ========================================================================

    const handleCreateParameter = () => {
        if (!isAdminMode) {
            toast.info("Solo administradores pueden crear parámetros");
            return;
        }

        openModal(
            <TasksParameterForm onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Crear Parámetro",
                description: "Definí un nuevo parámetro reutilizable para tareas.",
                size: "md"
            }
        );
    };

    const handleEditParameter = (param: TaskParameter) => {
        if (!isAdminMode) return;

        openModal(
            <TasksParameterForm initialData={param} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Editar Parámetro",
                description: `Modificando "${param.label}"`,
                size: "md"
            }
        );
    };

    // ========================================================================
    // Handlers - Options
    // ========================================================================

    const handleCreateOption = (param: TaskParameter) => {
        if (!isAdminMode) return;

        openModal(
            <TasksOptionForm parameterId={param.id} materials={materials} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Nueva Opción",
                description: `Agregando opción a "${param.label}"`,
                size: "md"
            }
        );
    };

    const handleEditOption = (param: TaskParameter, option: TaskParameterOption) => {
        if (!isAdminMode) return;

        openModal(
            <TasksOptionForm parameterId={param.id} initialData={option} materials={materials} onSuccess={closeModal} onCancel={closeModal} />,
            {
                title: "Editar Opción",
                description: `Modificando "${option.label}"`,
                size: "md"
            }
        );
    };

    // ========================================================================
    // Delete handlers
    // ========================================================================

    const handleDeleteClick = (type: "parameter" | "option", item: any) => {
        if (!isAdminMode) return;
        setItemToDelete({ type, item });
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);

        const result = itemToDelete.type === "parameter"
            ? await deleteTaskParameter(itemToDelete.item.id)
            : await deleteParameterOption(itemToDelete.item.id);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(itemToDelete.type === "parameter" ? "Parámetro eliminado" : "Opción eliminada");
        }

        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // ========================================================================
    // Sidebar
    // ========================================================================

    const sidebarContent = (
        <ElementsSidebar
            elements={elements}
            parameterCounts={parameterCounts}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            totalParameters={parameters.length}
        />
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Context Sidebar with Elements */}
            <ContextSidebar title="Elementos">
                {sidebarContent}
            </ContextSidebar>

            {/* Toolbar */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar parámetros..."
                actions={isAdminMode ? [{
                    label: "Nuevo Parámetro",
                    icon: Plus,
                    onClick: handleCreateParameter,
                }] : []}
            />

            {/* Parameters List */}
            {sortedParameters.length === 0 ? (
                <EmptyState
                    icon={Settings}
                    title={searchQuery || selectedElementId ? "No se encontraron parámetros" : "No hay parámetros definidos"}
                    description={searchQuery || selectedElementId
                        ? "Probá con otros filtros o términos de búsqueda"
                        : "Los parámetros permiten configurar valores variables en tareas"
                    }
                    action={isAdminMode && !searchQuery && !selectedElementId ? (
                        <Button onClick={handleCreateParameter}>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear primer parámetro
                        </Button>
                    ) : undefined}
                />
            ) : (
                <div className="space-y-3">
                    {sortedParameters.map((param) => {
                        const typeConfig = TYPE_CONFIG[param.type] || TYPE_CONFIG.text;
                        const TypeIcon = typeConfig.icon;
                        const isExpanded = expandedParams.has(param.id);
                        const hasOptions = param.type === "select" || param.type === "material";
                        const options = param.options || [];

                        return (
                            <Card key={param.id} className="overflow-hidden">
                                {/* Parameter Header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Expand button (only for select/material) */}
                                        {hasOptions ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => toggleExpand(param.id)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="w-8" />
                                        )}

                                        {/* Type icon */}
                                        <div className={`p-2 rounded-md ${typeConfig.color} shrink-0`}>
                                            <TypeIcon className="h-4 w-4" />
                                        </div>

                                        {/* Name and metadata */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium">{param.label}</h3>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                                    {param.slug}
                                                </code>
                                                <Badge variant="outline" className="text-xs">
                                                    {typeConfig.label}
                                                </Badge>
                                                {param.is_required && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Requerido
                                                    </Badge>
                                                )}
                                                {hasOptions && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {options.length} opciones
                                                    </span>
                                                )}
                                            </div>
                                            {param.description && (
                                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                                    {param.description}
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
                                                onClick={() => handleEditParameter(param)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick("parameter", param)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Options list (collapsible) */}
                                {hasOptions && isExpanded && (
                                    <div className="border-t">
                                        <div className="p-3 space-y-2">
                                            {options.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Sin opciones definidas
                                                </p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {options.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-medium">{option.label}</span>
                                                                <code className="text-xs text-muted-foreground font-mono">
                                                                    {option.value}
                                                                </code>
                                                                {option.short_code && (
                                                                    <Badge variant="outline" className="text-xs font-mono">
                                                                        {option.short_code}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {isAdminMode && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => handleEditOption(param, option)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                                        onClick={() => handleDeleteClick("option", option)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add option button */}
                                            {isAdminMode && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => handleCreateOption(param)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Nueva Opción
                                                </Button>
                                            )}
                                        </div>
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
                        <AlertDialogTitle>
                            Eliminar {itemToDelete?.type === "parameter" ? "Parámetro" : "Opción"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete?.type === "parameter"
                                ? `¿Estás seguro de que querés eliminar "${itemToDelete?.item?.label}"? Esta acción desvinculará el parámetro de todas las tareas.`
                                : `¿Estás seguro de que querés eliminar la opción "${itemToDelete?.item?.label}"?`
                            }
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
