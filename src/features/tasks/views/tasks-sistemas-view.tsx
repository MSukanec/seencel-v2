"use client";

import { useState, useMemo, useCallback } from "react";
import { TaskConstructionSystem, TaskParameter, TaskParameterOption } from "@/features/tasks/types";
import { TasksSystemForm } from "../forms";
import { deleteConstructionSystem, setSystemParameterOptions } from "../actions";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench, Tag, ChevronDown, ChevronRight, Settings2, Check, X } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SystemParameterLink {
    system_id: string;
    parameter_id: string;
}

interface SystemParameterOptionLink {
    system_id: string;
    parameter_id: string;
    option_id: string;
}

interface SystemsCatalogViewProps {
    systems: TaskConstructionSystem[];
    parameters?: TaskParameter[];
    systemParameterLinks?: SystemParameterLink[];
    systemParameterOptionLinks?: SystemParameterOptionLink[];
    isAdminMode?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TasksSistemasView({
    systems,
    parameters = [],
    systemParameterLinks = [],
    systemParameterOptionLinks = [],
    isAdminMode = false,
}: SystemsCatalogViewProps) {
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<TaskConstructionSystem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);
    const [savingParam, setSavingParam] = useState<string | null>(null);

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

    // Build a map of parameter_id → parameter (with options) for quick lookup
    const parametersMap = useMemo(() => {
        const map = new Map<string, TaskParameter>();
        parameters.forEach(p => map.set(p.id, p));
        return map;
    }, [parameters]);

    // Get parameters linked to a specific system
    const getSystemParameters = useCallback((systemId: string) => {
        const linkedParamIds = systemParameterLinks
            .filter(l => l.system_id === systemId)
            .map(l => l.parameter_id);
        return linkedParamIds
            .map(id => parametersMap.get(id))
            .filter((p): p is TaskParameter => !!p && p.type === "select");
    }, [systemParameterLinks, parametersMap]);

    // Get linked option IDs for a system-parameter pair
    const getLinkedOptionIds = useCallback((systemId: string, parameterId: string): Set<string> => {
        const ids = systemParameterOptionLinks
            .filter(l => l.system_id === systemId && l.parameter_id === parameterId)
            .map(l => l.option_id);
        return new Set(ids);
    }, [systemParameterOptionLinks]);

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

    const toggleExpanded = (systemId: string) => {
        setExpandedSystemId(prev => prev === systemId ? null : systemId);
    };

    const handleToggleOption = async (
        systemId: string,
        parameterId: string,
        optionId: string,
        currentLinkedIds: Set<string>,
        allOptions: TaskParameterOption[]
    ) => {
        const key = `${systemId}-${parameterId}`;
        setSavingParam(key);

        // Calculate new set of option IDs
        const newLinkedIds = new Set(currentLinkedIds);
        if (newLinkedIds.has(optionId)) {
            newLinkedIds.delete(optionId);
        } else {
            newLinkedIds.add(optionId);
        }

        // If all options are selected, clear the filter (= show all)
        const optionIds = newLinkedIds.size === allOptions.length
            ? []
            : Array.from(newLinkedIds);

        const result = await setSystemParameterOptions(systemId, parameterId, optionIds);
        if (result.error) {
            toast.error("Error al guardar: " + result.error);
        }
        setSavingParam(null);
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
                    {sortedSystems.map((system) => {
                        const isExpanded = expandedSystemId === system.id;
                        const systemParams = getSystemParameters(system.id);
                        const hasSelectParams = systemParams.length > 0;

                        return (
                            <Card key={system.id} className="overflow-hidden">
                                <div className="flex items-center justify-between p-4">
                                    {/* Icon + expand toggle */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {isAdminMode && hasSelectParams ? (
                                            <button
                                                onClick={() => toggleExpanded(system.id)}
                                                className="p-2 rounded-md bg-primary/10 text-primary shrink-0 hover:bg-primary/20 transition-colors cursor-pointer"
                                                title="Configurar opciones de parámetros"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </button>
                                        ) : (
                                            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                                <Wrench className="h-4 w-4" />
                                            </div>
                                        )}

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
                                                {isAdminMode && hasSelectParams && (
                                                    <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                                                        <Settings2 className="h-3 w-3" />
                                                        {systemParams.length} param. select
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
                                </div>

                                {/* Expanded: Parameter option configuration */}
                                {isAdminMode && isExpanded && hasSelectParams && (
                                    <div className="border-t bg-muted/30 px-4 py-3 space-y-4">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Opciones de parámetros para este sistema
                                        </div>
                                        <p className="text-xs text-muted-foreground -mt-2">
                                            Seleccioná qué opciones de cada parámetro aplican a este sistema.
                                            Si no seleccionás ninguna, se muestran todas.
                                        </p>

                                        {systemParams.map(param => {
                                            const linkedIds = getLinkedOptionIds(system.id, param.id);
                                            const allOptions = (param.options || []).filter((o: TaskParameterOption) => !o.is_deleted);
                                            const isSaving = savingParam === `${system.id}-${param.id}`;
                                            const isFiltered = linkedIds.size > 0;

                                            return (
                                                <div key={param.id} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{param.label}</span>
                                                        {isFiltered ? (
                                                            <Badge variant="default" className="text-xs gap-1">
                                                                <Check className="h-3 w-3" />
                                                                {linkedIds.size} de {allOptions.length}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Todas ({allOptions.length})
                                                            </Badge>
                                                        )}
                                                        {isSaving && (
                                                            <span className="text-xs text-muted-foreground animate-pulse">
                                                                Guardando...
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {allOptions.map((option: TaskParameterOption) => {
                                                            const isLinked = linkedIds.has(option.id);
                                                            const isActive = !isFiltered || isLinked;

                                                            return (
                                                                <label
                                                                    key={option.id}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all text-sm",
                                                                        isActive
                                                                            ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                                                                            : "border-border bg-background opacity-50 hover:opacity-75",
                                                                        isSaving && "pointer-events-none opacity-50",
                                                                    )}
                                                                >
                                                                    <Checkbox
                                                                        checked={isLinked}
                                                                        onCheckedChange={() =>
                                                                            handleToggleOption(system.id, param.id, option.id, linkedIds, allOptions)
                                                                        }
                                                                        disabled={isSaving}
                                                                    />
                                                                    <span className="flex-1 min-w-0 truncate">
                                                                        {option.short_code && (
                                                                            <span className="font-mono text-xs text-muted-foreground mr-1">
                                                                                {option.short_code}
                                                                            </span>
                                                                        )}
                                                                        {option.label}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>

                                                    {isFiltered && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs h-7"
                                                            disabled={isSaving}
                                                            onClick={async () => {
                                                                const key = `${system.id}-${param.id}`;
                                                                setSavingParam(key);
                                                                await setSystemParameterOptions(system.id, param.id, []);
                                                                setSavingParam(null);
                                                            }}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Limpiar filtro (mostrar todas)
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
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
