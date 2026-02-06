"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Monitor, Building2, ClipboardList, Upload, History } from "lucide-react";

import { TasksByDivision, Unit, TaskDivision, TaskKind } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/tasks-catalog";
import { TasksForm, TasksTypeSelector, TaskCreationType, TasksParametricForm } from "@/features/tasks/forms";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { ImportConfig, createImportBatch, importTasksCatalogBatch, revertImportBatch } from "@/lib/import";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { ImportHistoryModal } from "@/components/shared/import/import-history-modal";

// Filter type for origin
type OriginFilter = "all" | "system" | "organization";

interface TasksCatalogViewProps {
    groupedTasks: TasksByDivision[];
    orgId: string;
    units: Unit[];
    divisions: TaskDivision[];
    kinds?: TaskKind[];
    isAdminMode?: boolean;
}

export function TasksCatalogView({
    groupedTasks,
    orgId,
    units,
    divisions,
    kinds = [],
    isAdminMode = false
}: TasksCatalogViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [originFilter, setOriginFilter] = useState<Set<string>>(new Set());

    // Flatten all tasks to count total
    const allTasks = useMemo(() => {
        return groupedTasks.flatMap(g => g.tasks);
    }, [groupedTasks]);

    // Calculate facet counts for origin filter
    const originFacets = useMemo(() => {
        const facets = new Map<string, number>();
        facets.set("system", allTasks.filter(t => t.is_system).length);
        facets.set("organization", allTasks.filter(t => !t.is_system).length);
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
                    divisions={divisions}
                    units={units}
                    kinds={kinds}
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

    // ========================================================================
    // EmptyState: early return pattern (SKILL compliance)
    // ========================================================================
    if (allTasks.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader={true}
                    leftActions={
                        <FacetedFilter
                            title="Origen"
                            options={originOptions}
                            selectedValues={originFilter}
                            onSelect={handleOriginSelect}
                            onClear={handleOriginClear}
                            facets={originFacets}
                        />
                    }
                    actions={[
                        {
                            label: "Nueva Tarea",
                            icon: Plus,
                            onClick: handleCreateTask,
                        },
                        {
                            label: "Importar",
                            icon: Upload,
                            onClick: handleImport,
                        },
                        {
                            label: "Ver historial",
                            icon: History,
                            onClick: handleImportHistory,
                        },
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
                    <FacetedFilter
                        title="Origen"
                        options={originOptions}
                        selectedValues={originFilter}
                        onSelect={handleOriginSelect}
                        onClear={handleOriginClear}
                        facets={originFacets}
                    />
                }
                actions={[
                    {
                        label: "Nueva Tarea",
                        icon: Plus,
                        onClick: handleCreateTask,
                    },
                    {
                        label: "Importar",
                        icon: Upload,
                        onClick: handleImport,
                    },
                    {
                        label: "Ver historial",
                        icon: History,
                        onClick: handleImportHistory,
                    },
                ]}
            />
            <TaskCatalog
                groupedTasks={groupedTasks}
                orgId={orgId}
                units={units}
                divisions={divisions}
                isAdminMode={isAdminMode}
                searchQuery={searchQuery}
                originFilter={computedOriginFilter}
            />
        </>
    );
}
