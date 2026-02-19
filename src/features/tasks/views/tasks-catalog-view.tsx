"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Plus, Monitor, Building2, ClipboardList, Trash2, Pencil, Circle } from "lucide-react";

import { TasksByDivision, Unit, TaskDivision, TaskAction, TaskElement } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/tasks-catalog";
import { TasksForm, TasksTypeSelector, TaskCreationType, TasksParametricForm } from "@/features/tasks/forms";
import { TasksBulkEditForm } from "@/features/tasks/forms/tasks-bulk-edit-form";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { getStandardToolbarActions } from "@/lib/toolbar-actions";
import { Button } from "@/components/ui/button";
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
import { useModal } from "@/stores/modal-store";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { deleteTasksBulk } from "@/features/tasks/actions";
import { ImportConfig, createImportBatch, importTasksCatalogBatch, importAITasksBatch, revertImportBatch } from "@/lib/import";
import { analyzeExcelStructure } from "@/features/ai/actions";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { ImportHistoryModal } from "@/components/shared/import/import-history-modal";
import { toast } from "sonner";

// Filter type for origin
type OriginFilter = "all" | "system" | "organization";

interface TasksCatalogViewProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    kinds?: TaskAction[];
    elements?: TaskElement[];
    isAdminMode?: boolean;
}

export function TasksCatalogView({
    groupedTasks,
    orgId,
    units,
    divisions,
    kinds = [],
    elements = [],
    isAdminMode = false
}: TasksCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [originFilter, setOriginFilter] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

    // Flatten all tasks for filtering / counting
    const serverTasks = useMemo(() => {
        return groupedTasks.flatMap(g => g.tasks);
    }, [groupedTasks]);

    // Optimistic deletes tracking
    const [optimisticDeleteIds, setOptimisticDeleteIds] = useState<Set<string>>(new Set());
    const allTasks = useMemo(() => {
        if (optimisticDeleteIds.size === 0) return serverTasks;
        return serverTasks.filter(t => !optimisticDeleteIds.has(t.id));
    }, [serverTasks, optimisticDeleteIds]);

    // Calculate facet counts for origin filter
    const originFacets = useMemo(() => {
        const facets = new Map<string, number>();
        facets.set("system", allTasks.filter(t => t.is_system).length);
        facets.set("organization", allTasks.filter(t => !t.is_system).length);
        return facets;
    }, [allTasks]);

    // Calculate facet counts for status filter
    const statusFacets = useMemo(() => {
        const facets = new Map<string, number>();
        facets.set("active", allTasks.filter(t => (t.status ?? "active") === "active").length);
        facets.set("draft", allTasks.filter(t => t.status === "draft").length);
        facets.set("archived", allTasks.filter(t => t.status === "archived").length);
        return facets;
    }, [allTasks]);

    // Convert Set filter to the legacy filter format for TaskCatalog
    const computedOriginFilter: OriginFilter = useMemo(() => {
        if (originFilter.size === 0) return "all";
        if (originFilter.size === 2) return "all"; // Both selected = all
        if (originFilter.has("system")) return "system";
        if (originFilter.has("organization")) return "organization";
        return "all";
    }, [originFilter]);

    // ========================================================================
    // Filter handlers
    // ========================================================================
    const handleOriginSelect = (value: string) => {
        const newSet = new Set(originFilter);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        setOriginFilter(newSet);
    };

    const handleOriginClear = () => {
        setOriginFilter(new Set());
    };

    const handleStatusSelect = (value: string) => {
        const newSet = new Set(statusFilter);
        if (newSet.has(value)) newSet.delete(value);
        else newSet.add(value);
        setStatusFilter(newSet);
    };

    const handleStatusClear = () => setStatusFilter(new Set());

    // ========================================================================
    // Multi-select for bulk actions
    // ========================================================================
    const multiSelect = useMultiSelect({
        items: allTasks,
        getItemId: (t) => t.id,
    });

    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    const handleBulkDelete = async () => {
        const ids = Array.from(multiSelect.selectedIds);
        const count = ids.length;

        // Optimistic: remove immediately from UI
        setOptimisticDeleteIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });
        multiSelect.clearSelection();
        setBulkDeleteModalOpen(false);

        try {
            const result = await deleteTasksBulk(ids, isAdminMode);
            if (result.error) {
                // Rollback
                setOptimisticDeleteIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
                toast.error(result.error);
            } else {
                toast.success(`${count} tarea${count > 1 ? 's' : ''} eliminada${count > 1 ? 's' : ''}`);
            }
        } catch (error) {
            // Rollback
            setOptimisticDeleteIds(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.delete(id));
                return next;
            });
            toast.error("Error al eliminar tareas");
        }
    };

    const handleBulkEdit = () => {
        const ids = Array.from(multiSelect.selectedIds);
        openModal(
            <TasksBulkEditForm
                taskIds={ids}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
            />,
            {
                title: `Editar ${ids.length} tarea${ids.length > 1 ? "s" : ""} en masa`,
                description: "Solo los campos que modifiques se aplicarán a todas las tareas seleccionadas.",
                size: "md"
            }
        );
    };

    const bulkActionsContent = (
        <>
            <Button variant="outline" size="sm" onClick={multiSelect.selectAll} className="gap-2">
                Seleccionar todo ({allTasks.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar en Masa
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteModalOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar
            </Button>
        </>
    );

    // ========================================================================
    // Import Configuration
    // ========================================================================

    const tasksImportConfig: ImportConfig<any> = {
        entityLabel: "Tareas",
        entityId: "tasks_catalog",
        description: "Importá tu catálogo de tareas desde un archivo Excel o CSV. El sistema detectará automáticamente las columnas y te permitirá mapearlas a los campos correspondientes. Las tareas duplicadas se identificarán por nombre o código para evitar registros repetidos.",
        docsPath: "/es/docs/tareas/importar",
        columns: [
            {
                id: "name",
                label: "Nombre",
                required: true,
                description: "Nombre de la tarea de construcción",
                example: "Construcción de muro de ladrillo hueco"
            },
            {
                id: "code",
                label: "Código",
                required: false,
                description: "Código interno o identificador",
                example: "MUR-001"
            },
            {
                id: "description",
                label: "Descripción",
                required: false,
                description: "Detalle o especificación técnica de la tarea",
                example: "Muro de ladrillo hueco de 18cm con mezcla 1:3"
            },
            {
                id: "unit_name",
                label: "Unidad de Medida",
                required: false,
                description: "Unidad para medir esta tarea (m², ml, u, etc.)",
                example: "m²",
                foreignKey: {
                    table: 'units',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => units.map(u => ({
                        id: u.id,
                        label: `${u.name} (${u.symbol})`
                    })),
                    allowCreate: true,
                }
            },
            {
                id: "division_name",
                label: "Rubro",
                required: false,
                description: "Rubro o categoría de la tarea (Albañilería, Electricidad, etc.)",
                example: "Albañilería",
                foreignKey: {
                    table: 'task_divisions',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async () => divisions.map(d => ({
                        id: d.id,
                        label: d.name
                    })),
                    allowCreate: true,
                }
            },
        ],
        aiAnalyzer: {
            analyzeAction: analyzeExcelStructure,
            onImportAI: async (result) => {
                const importResult = await importAITasksBatch(orgId, result);
                router.refresh();
                return importResult;
            },
        },
        onImport: async (records) => {
            try {
                const batch = await createImportBatch(orgId, "tasks_catalog", records.length);
                const result = await importTasksCatalogBatch(orgId, records, batch.id);
                router.refresh();
                return {
                    success: result.success,
                    errors: result.errors,
                    batchId: batch.id,
                    created: result.created,
                };
            } catch (error: any) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'tasks');
            router.refresh();
        }
    };

    // ========================================================================
    // Import Handlers
    // ========================================================================

    const handleImport = () => {
        openModal(
            <BulkImportModal
                config={tasksImportConfig}
                organizationId={orgId}
            />,
            {
                title: "Importar Tareas",
                description: "Importa tareas desde un archivo Excel o CSV",
                size: "xl"
            }
        );
    };

    const handleImportHistory = () => {
        openModal(
            <ImportHistoryModal
                organizationId={orgId}
                entityType="tasks_catalog"
                entityTable="tasks"
                onRevert={() => {
                    router.refresh();
                }}
            />,
            {
                title: "Historial de Importaciones",
                description: "Últimas 20 importaciones de tareas",
                size: "lg"
            }
        );
    };

    // ========================================================================
    // Modal Handlers
    // ========================================================================

    const handleOpenTypeSelector = () => {
        openModal(
            <TasksTypeSelector
                onSelect={handleTypeSelected}
                onCancel={closeModal}
                isAdmin={isAdminMode}
            />,
            {
                title: "Crear Nueva Tarea",
                description: "Elegí el tipo de tarea que querés crear",
                size: "lg"
            }
        );
    };

    const handleTypeSelected = (type: TaskCreationType) => {
        closeModal();

        if (type === "own") {
            // Open regular task form
            openModal(
                <TasksForm
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
                    title: "Nueva Tarea Propia",
                    description: "Crear una tarea personalizada para tu organización",
                    size: "lg"
                }
            );
        } else {
            // Open parametric task wizard
            openModal(
                <TasksParametricForm
                    elements={elements}
                    units={units}
                    onCancel={closeModal}
                    onSuccess={() => {
                        closeModal();
                        router.refresh();
                    }}
                    onBack={handleOpenTypeSelector}
                />,
                {
                    title: "Nueva Tarea Paramétrica",
                    description: "Crear una tarea estandarizada para el catálogo global",
                    size: "lg"
                }
            );
        }
    };

    // For admin mode, go directly to parametric form (or show selector)
    const handleCreateTask = () => {
        if (isAdminMode && kinds.length > 0) {
            // Admin mode with kinds available: show selector
            handleOpenTypeSelector();
        } else if (isAdminMode) {
            // Admin mode but no kinds: use regular form
            openModal(
                <TasksForm
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
                    title: "Nueva Tarea de Sistema",
                    description: "Crear una tarea del sistema disponible para todas las organizaciones",
                    size: "lg"
                }
            );
        } else {
            // Organization mode: show type selector
            handleOpenTypeSelector();
        }
    };

    // Origin filter options
    const originOptions = [
        { label: "Sistema", value: "system", icon: Monitor },
        { label: "Propios", value: "organization", icon: Building2 },
    ];

    // Status filter options
    const statusOptions = [
        { label: "Activa", value: "active", icon: Circle },
        { label: "Borrador", value: "draft", icon: Circle },
        { label: "Archivada", value: "archived", icon: Circle },
    ];

    // ========================================================================
    // EmptyState: early return pattern (SKILL compliance)
    // ========================================================================
    if (allTasks.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader={true}
                    leftActions={
                        <>
                            <FacetedFilter
                                title="Origen"
                                options={originOptions}
                                selectedValues={originFilter}
                                onSelect={handleOriginSelect}
                                onClear={handleOriginClear}
                                facets={originFacets}
                            />
                            <FacetedFilter
                                title="Estado"
                                options={statusOptions}
                                selectedValues={statusFilter}
                                onSelect={handleStatusSelect}
                                onClear={handleStatusClear}
                                facets={statusFacets}
                            />
                        </>
                    }
                    actions={[
                        {
                            label: "Nueva Tarea",
                            icon: Plus,
                            onClick: handleCreateTask,
                        },
                        ...getStandardToolbarActions({
                            onImport: handleImport,
                            onImportHistory: handleImportHistory,
                            onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                            onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                        }),
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={ClipboardList}
                        viewName="Tareas"
                        featureDescription="Las tareas son los trabajos unitarios que componen tus proyectos de construcción. Definí tareas como 'Construcción de muro de ladrillo', 'Instalación de cañería', etc. Cada tarea puede tener materiales, mano de obra y rendimientos asociados."
                        onAction={handleCreateTask}
                        actionLabel="Nueva Tarea"
                        docsPath="/docs/tareas"
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar tareas por nombre, código o descripción..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                leftActions={
                    <>
                        <FacetedFilter
                            title="Origen"
                            options={originOptions}
                            selectedValues={originFilter}
                            onSelect={handleOriginSelect}
                            onClear={handleOriginClear}
                            facets={originFacets}
                        />
                        <FacetedFilter
                            title="Estado"
                            options={statusOptions}
                            selectedValues={statusFilter}
                            onSelect={handleStatusSelect}
                            onClear={handleStatusClear}
                            facets={statusFacets}
                        />
                    </>
                }
                actions={[
                    {
                        label: "Nueva Tarea",
                        icon: Plus,
                        onClick: handleCreateTask,
                    },
                    ...getStandardToolbarActions({
                        onImport: handleImport,
                        onImportHistory: handleImportHistory,
                        onExportCSV: () => toast.info("Exportar CSV: próximamente"),
                        onExportExcel: () => toast.info("Exportar Excel: próximamente"),
                    }),
                ]}
                selectedCount={multiSelect.selectedCount}
                onClearSelection={multiSelect.clearSelection}
                bulkActions={bulkActionsContent}
            />
            <TaskCatalog
                groupedTasks={groupedTasks}
                orgId={orgId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                searchQuery={searchQuery}
                originFilter={computedOriginFilter}
                statusFilter={statusFilter}
                isSelected={multiSelect.isSelected}
                onToggleSelect={multiSelect.toggle}
            />

            {/* Bulk Delete Confirmation */}
            <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {multiSelect.selectedCount} tarea{multiSelect.selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Las tareas seleccionadas serán eliminadas permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
