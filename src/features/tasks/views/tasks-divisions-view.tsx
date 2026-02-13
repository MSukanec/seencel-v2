"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CategoryTree, CategoryItem } from "@/components/shared/category-tree";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { TasksDivisionForm } from "../forms";
import { deleteTaskDivision, reorderTaskDivisions } from "../actions";
import { TaskDivision } from "@/features/tasks/types";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { Plus, FolderTree, Building2, User } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, revertImportBatch, importDivisionsBatch, ImportConfig } from "@/lib/import";
import { useRouter } from "@/i18n/routing";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

type DivisionViewFilter = "own" | "system";

interface DivisionsCatalogViewProps {
    divisions: TaskDivision[];
    isAdminMode?: boolean;
    /** Map of division ID to task count */
    taskCounts?: Record<string, number>;
    /** Organization ID for import */
    organizationId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TasksDivisionsView({
    divisions,
    isAdminMode = false,
    taskCounts = {},
    organizationId,
}: DivisionsCatalogViewProps) {
    const { openModal } = useModal();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewFilter, setViewFilter] = useState<DivisionViewFilter>("own");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState<TaskDivision | null>(null);

    // Optimistic state: temporary items shown before server confirms
    const [optimisticAdds, setOptimisticAdds] = useState<TaskDivision[]>([]);
    const [optimisticUpdates, setOptimisticUpdates] = useState<TaskDivision[]>([]);
    const [optimisticDeletes, setOptimisticDeletes] = useState<Set<string>>(new Set());

    // Clear optimistic state when server data changes (means server refreshed)
    const prevDivisionsRef = useRef(divisions);
    useEffect(() => {
        if (prevDivisionsRef.current !== divisions) {
            setOptimisticAdds([]);
            setOptimisticUpdates([]);
            setOptimisticDeletes(new Set());
            prevDivisionsRef.current = divisions;
        }
    }, [divisions]);

    // Merge server data with optimistic state
    const allDivisions = useMemo(() => {
        let merged = divisions
            .filter(d => !optimisticDeletes.has(d.id))
            .map(d => {
                const updated = optimisticUpdates.find(u => u.id === d.id);
                return updated ?? d;
            });
        return [...merged, ...optimisticAdds];
    }, [divisions, optimisticAdds, optimisticUpdates, optimisticDeletes]);

    // In admin mode, everything is system — no filter needed
    const isViewingOwn = !isAdminMode && viewFilter === "own";

    // Check if a division can be mutated by the current user
    const canMutate = (division: TaskDivision) => {
        if (isAdminMode) return true;
        return division.is_system === false;
    };

    // Filter divisions by type (own vs system) and search query
    const filteredDivisions = useMemo(() => {
        let filtered = allDivisions;

        // Filter by type (only in non-admin mode)
        if (!isAdminMode) {
            if (viewFilter === "own") {
                filtered = filtered.filter(d => d.is_system === false);
            } else {
                filtered = filtered.filter(d => d.is_system === true);
            }
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(query) ||
                (d.description && d.description.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [allDivisions, searchQuery, viewFilter, isAdminMode]);

    // Transform divisions to CategoryItem format
    const items: CategoryItem[] = filteredDivisions.map(d => ({
        id: d.id,
        name: d.name,
        parent_id: d.parent_id ?? null,
        order: d.order ?? null,
        description: d.description ?? null,
        code: d.code ?? null
    }));

    // Get replacement options (all divisions except the one being deleted)
    const replacementOptions = useMemo(() => {
        if (!divisionToDelete) return [];
        return allDivisions
            .filter(d => d.id !== divisionToDelete.id)
            .map(d => ({ id: d.id, name: d.name }));
    }, [allDivisions, divisionToDelete]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleCreateClick = (parentId: string | null = null) => {
        // Find parent if specified
        const parentDivision = parentId ? allDivisions.find(d => d.id === parentId) : null;

        openModal(
            <TasksDivisionForm
                divisions={allDivisions}
                defaultParentId={parentId}
                isAdminMode={isAdminMode}
                onOptimisticCreate={(item) => setOptimisticAdds(prev => [...prev, item])}
            />,
            {
                title: parentDivision
                    ? `Crear Sub-rubro de "${parentDivision.name}"`
                    : "Crear Rubro",
                description: "Completá los campos para crear un nuevo rubro.",
                size: "md"
            }
        );
    };

    const handleEditClick = (item: CategoryItem) => {
        const division = allDivisions.find(d => d.id === item.id);
        if (!division) return;

        if (!canMutate(division)) {
            toast.info("Los rubros del sistema no se pueden editar");
            return;
        }

        openModal(
            <TasksDivisionForm
                initialData={division}
                divisions={allDivisions}
                isAdminMode={isAdminMode}
                onOptimisticUpdate={(updated) => setOptimisticUpdates(prev => [...prev.filter(u => u.id !== updated.id), updated])}
            />,
            {
                title: "Editar Rubro",
                description: `Modificando "${division.name}"`,
                size: "md"
            }
        );
    };

    const handleDeleteClick = (item: CategoryItem) => {
        const division = allDivisions.find(d => d.id === item.id);
        if (!division) return;

        if (!canMutate(division)) {
            toast.info("Los rubros del sistema no se pueden eliminar");
            return;
        }

        setDivisionToDelete(division);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async (replacementId: string | null, deleteChildren?: boolean) => {
        if (!divisionToDelete) return;

        const deletedId = divisionToDelete.id;
        const childIds = deleteChildren
            ? divisions.filter(d => d.parent_id === deletedId).map(d => d.id)
            : [];

        // Optimistic: remove immediately from UI
        setOptimisticDeletes(prev => {
            const next = new Set(prev);
            next.add(deletedId);
            childIds.forEach(id => next.add(id));
            return next;
        });
        setDeleteModalOpen(false);
        setDivisionToDelete(null);

        try {
            const result = await deleteTaskDivision(deletedId, replacementId, deleteChildren ?? false);

            if (result.error) {
                // Rollback: restore deleted items
                setOptimisticDeletes(prev => {
                    const next = new Set(prev);
                    next.delete(deletedId);
                    childIds.forEach(id => next.delete(id));
                    return next;
                });
                toast.error(result.error);
            } else {
                toast.success(
                    deleteChildren
                        ? "Rubro y sub-rubros eliminados"
                        : replacementId
                            ? "Rubro eliminado y tareas reasignadas"
                            : "Rubro eliminado"
                );
            }
        } catch {
            // Rollback on exception
            setOptimisticDeletes(prev => {
                const next = new Set(prev);
                next.delete(deletedId);
                childIds.forEach(id => next.delete(id));
                return next;
            });
            toast.error("Error al eliminar el rubro");
        }
    };

    // Render task count badge
    const renderTaskCount = (item: CategoryItem) => {
        const count = taskCounts[item.id] ?? 0;
        if (count === 0) return null;
        return (
            <Badge variant="secondary" className="text-xs">
                {count} {count === 1 ? 'tarea' : 'tareas'}
            </Badge>
        );
    };

    // Handle reorder (optimistic - CategoryTree handles local state)
    const handleReorder = async (orderedIds: string[]) => {
        const result = await reorderTaskDivisions(orderedIds);
        if (result.error) {
            toast.error(result.error);
        }
    };

    // ========================================================================
    // Computed
    // ========================================================================

    // Show create button only when viewing own divisions (or admin)
    const showCreateAction = isAdminMode || isViewingOwn;
    // Enable drag-drop/reorder only when viewing own divisions (or admin)
    const canReorder = isAdminMode || isViewingOwn;

    // Determine if there are no divisions AT ALL (before search filter)
    const hasNoDivisions = useMemo(() => {
        if (isAdminMode) return allDivisions.length === 0;
        if (viewFilter === "own") return allDivisions.filter(d => !d.is_system).length === 0;
        return allDivisions.filter(d => d.is_system).length === 0;
    }, [allDivisions, viewFilter, isAdminMode]);

    const hasActiveFilters = searchQuery.trim().length > 0;

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Toolbar with portal to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar rubros por nombre o descripción..."
                leftActions={!isAdminMode ? (
                    <ToolbarTabs
                        value={viewFilter}
                        onValueChange={(v) => setViewFilter(v as DivisionViewFilter)}
                        options={[
                            { label: "Propios", value: "own", icon: User },
                            { label: "Sistema", value: "system", icon: Building2 },
                        ]}
                    />
                ) : undefined}
                actions={showCreateAction ? [
                    {
                        label: "Nuevo Rubro",
                        icon: Plus,
                        onClick: () => handleCreateClick(null),
                    },
                    ...getStandardToolbarActions({
                        onImport: organizationId ? () => {
                            openModal(
                                <BulkImportModal
                                    config={{
                                        entityLabel: "Rubros",
                                        entityId: "rubros",
                                        columns: [
                                            { id: "code", label: "Código", required: false, example: "01" },
                                            { id: "name", label: "Nombre", required: true, example: "Albañilería" },
                                            { id: "description", label: "Descripción", required: false, example: "Trabajos de albañilería general" },
                                        ],
                                        onImport: async (data) => {
                                            const batch = await createImportBatch(organizationId, "task_divisions", data.length);
                                            const result = await importDivisionsBatch(organizationId, data, batch.id);
                                            return { success: result.success, errors: result.errors ?? [], batchId: batch.id };
                                        },
                                        onRevert: async (batchId) => {
                                            await revertImportBatch(batchId, "task_divisions");
                                        },
                                    } as ImportConfig<any>}
                                    organizationId={organizationId}
                                />,
                                {
                                    size: "2xl",
                                    title: "Importar Rubros",
                                    description: "Importa rubros masivamente desde Excel o CSV."
                                }
                            );
                        } : undefined,
                        onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                        onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                    }),
                ] : [
                    ...getStandardToolbarActions({
                        onImport: organizationId ? () => {
                            openModal(
                                <BulkImportModal
                                    config={{
                                        entityLabel: "Rubros",
                                        entityId: "rubros",
                                        columns: [
                                            { id: "code", label: "Código", required: false, example: "01" },
                                            { id: "name", label: "Nombre", required: true, example: "Albañilería" },
                                            { id: "description", label: "Descripción", required: false, example: "Trabajos de albañilería general" },
                                        ],
                                        onImport: async (data) => {
                                            const batch = await createImportBatch(organizationId, "task_divisions", data.length);
                                            const result = await importDivisionsBatch(organizationId, data, batch.id);
                                            return { success: result.success, errors: result.errors ?? [], batchId: batch.id };
                                        },
                                        onRevert: async (batchId) => {
                                            await revertImportBatch(batchId, "task_divisions");
                                        },
                                    } as ImportConfig<any>}
                                    organizationId={organizationId}
                                />,
                                {
                                    size: "2xl",
                                    title: "Importar Rubros",
                                    description: "Importa rubros masivamente desde Excel o CSV."
                                }
                            );
                        } : undefined,
                        onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                        onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                    }),
                ]}
            />

            {/* Content */}
            {filteredDivisions.length === 0 ? (
                hasActiveFilters ? (
                    <ViewEmptyState
                        mode="no-results"
                        icon={FolderTree}
                        viewName="rubros"
                        filterContext="con esa búsqueda"
                        onResetFilters={() => setSearchQuery("")}
                    />
                ) : (
                    <ViewEmptyState
                        mode="empty"
                        icon={FolderTree}
                        viewName="Rubros"
                        featureDescription={
                            isViewingOwn
                                ? "Los rubros organizan tus tareas de construcción en categorías jerárquicas. Creá rubros propios para personalizar la estructura de tu organización, o usá los rubros del sistema como base."
                                : "Los rubros del sistema son categorías predefinidas disponibles para todas las organizaciones. No se pueden modificar, pero podés usarlos como referencia para crear tus propios rubros."
                        }
                        onAction={showCreateAction ? () => handleCreateClick(null) : undefined}
                        actionLabel="Nuevo Rubro"
                        docsPath="/docs/rubros/introduccion"
                    />
                )
            ) : (
                <CategoryTree
                    items={items}
                    onAddClick={isViewingOwn || isAdminMode ? handleCreateClick : undefined}
                    onEditClick={isViewingOwn || isAdminMode ? handleEditClick : undefined}
                    onDeleteClick={isViewingOwn || isAdminMode ? handleDeleteClick : undefined}
                    onReorder={canReorder ? handleReorder : undefined}
                    enableDragDrop={canReorder}
                    showNumbering={true}
                    renderEndContent={renderTaskCount}
                />
            )}

            {/* Delete Modal with Replacement */}
            <DeleteReplacementModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDivisionToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                itemToDelete={divisionToDelete ? { id: divisionToDelete.id, name: divisionToDelete.name } : null}
                replacementOptions={replacementOptions}
                entityLabel="rubro"
                title="Eliminar Rubro"
                description={`Estás a punto de eliminar "${divisionToDelete?.name}". ¿Qué deseas hacer con las tareas asociadas?`}
                showDeleteWithChildren={divisionToDelete ? allDivisions.some(d => d.parent_id === divisionToDelete.id) : false}
                childrenLabel="sub-rubros"
            />
        </>
    );
}
