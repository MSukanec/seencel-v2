"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { ConstructionTaskView, ConstructionTaskStatus, STATUS_CONFIG } from "../types";
import { ConstructionTaskCard } from "../components/construction-task-card";
import type { UnitOption, CatalogTaskOption } from "@/components/shared/forms/fields";
import { deleteConstructionTask } from "../actions";
import { ConstructionDependencyRow } from "../queries";
import { ToolbarCard } from "@/components/shared/toolbar-controls/toolbar-card";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table/data-table";
import { getConstructionTaskColumns, STATUS_FILTER_OPTIONS } from "../tables/construction-tasks-columns";
import { useConstructionGantt } from "../hooks/use-construction-gantt";
import { PageHeaderActionPortal } from "@/components/layout/dashboard/header/page-header";

import { usePanel } from "@/stores/panel-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { ClipboardList, Plus, GanttChartSquare, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

// Lazy load Gantt (heavy component)
const GanttChart = dynamic(
    () => import("@/components/shared/gantt").then(m => ({ default: m.GanttChart })),
    { ssr: false }
);

// ============================================================================
// Types
// ============================================================================

type ViewMode = "gantt" | "table" | "cards";

const VIEW_OPTIONS = [
    { value: "gantt", icon: GanttChartSquare, label: "Gantt" },
    { value: "table", icon: Table2, label: "Tabla" },
    { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
];

interface ConstructionTasksViewProps {
    projectId?: string;
    organizationId: string;
    tasks: ConstructionTaskView[];
    initialDependencies: ConstructionDependencyRow[];
    catalogTasks: CatalogTaskOption[];
    units: UnitOption[];
    workDays?: number[];
}

// ============================================================================
// Component
// ============================================================================

export function ConstructionTasksView({
    projectId: propProjectId,
    organizationId,
    tasks: initialTasks,
    initialDependencies,
    catalogTasks,
    units,
    workDays = [1, 2, 3, 4, 5],
}: ConstructionTasksViewProps) {
    const { openPanel } = usePanel();
    const storeProjectId = useActiveProjectId();
    const activeProjectId = storeProjectId ?? propProjectId ?? null;
    const [viewMode, setViewMode] = useState<ViewMode>("gantt");

    // --- Filters (standard hook) ---
    const filters = useTableFilters({
        facets: [{
            key: "status",
            title: "Estado",
            options: STATUS_FILTER_OPTIONS,
        }],
    });

    // --- Pre-filter by project + search + facets ---
    const projectFilteredTasks = useMemo(() => {
        return initialTasks.filter(task => {
            if (activeProjectId && task.project_id !== activeProjectId) return false;

            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const match = [task.task_name || task.custom_name || "", task.recipe_name || ""]
                    .join(" ").toLowerCase().includes(q);
                if (!match) return false;
            }

            const statusFacet = filters.facetValues["status"];
            if (statusFacet && statusFacet.size > 0 && !statusFacet.has(task.status)) return false;

            return true;
        });
    }, [initialTasks, activeProjectId, filters]);

    // --- Gantt logic (extracted hook) ---
    const gantt = useConstructionGantt({
        organizationId,
        initialTasks,
        initialDependencies,
        filteredTasks: projectFilteredTasks,
        workDays,
    });

    // --- Delete (standard hook) ---
    const { handleDelete, DeleteConfirmDialog } = useTableActions<ConstructionTaskView>({
        onDelete: async (task) => deleteConstructionTask(task.id, task.project_id),
        entityName: "tarea",
        entityNamePlural: "tareas",
    });

    // --- Panel handlers ---
    const handleCreate = () => {
        if (!activeProjectId) {
            toast.error("Seleccioná un proyecto en el header para crear una tarea.");
            return;
        }
        openPanel("construction-task-form", {
            projectId: activeProjectId,
            organizationId,
            catalogTasks,
            units,
        });
    };

    const handleEdit = (task: ConstructionTaskView) => {
        openPanel("construction-task-form", {
            projectId: task.project_id,
            organizationId,
            catalogTasks,
            units,
            initialData: task,
        });
    };

    // --- Columns ---
    const tableColumns = useMemo(() => getConstructionTaskColumns(), []);

    // --- Gantt click ---
    const handleGanttClick = (id: string) => {
        const task = gantt.handleGanttItemClick(id);
        if (task) handleEdit(task);
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Header action (portaled) */}
            <PageHeaderActionPortal>
                <Button onClick={handleCreate} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tarea
                </Button>
            </PageHeaderActionPortal>

            <div className="h-full flex flex-col">
                {/* Toolbar — display controla Gantt/Tabla/Tarjetas */}
                <div className="mb-4">
                    <ToolbarCard
                        filters={filters}
                        searchPlaceholder="Buscar tareas..."
                        display={{
                            viewMode,
                            onViewModeChange: (v) => setViewMode(v as ViewMode),
                            viewModeOptions: VIEW_OPTIONS,
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Empty states */}
                    {projectFilteredTasks.length === 0 ? (
                        initialTasks.length === 0 ? (
                            <ViewEmptyState
                                mode="empty"
                                icon={ClipboardList}
                                viewName="Ejecución de Obra"
                                featureDescription="La ejecución de obra es donde las tareas del catálogo cobran vida. Desde aquí podés asignar tareas a tu proyecto, planificar fechas, hacer seguimiento de avance y controlar desvíos de cantidad, costo y tiempo. Usá el Gantt interactivo para programar tu obra visualmente."
                                onAction={handleCreate}
                                actionLabel="Agregar Tarea"
                                docsPath="/docs/construccion/ejecucion-de-tareas"
                                totalCount={initialTasks.length}
                            />
                        ) : (
                            <ViewEmptyState
                                mode="no-results"
                                icon={ClipboardList}
                                viewName="tareas de construcción"
                                filterContext="con los filtros aplicados"
                                onResetFilters={filters.clearAll}
                                totalCount={initialTasks.length}
                            />
                        )
                    ) : (
                        <>
                            {/* Gantt */}
                            {viewMode === "gantt" && (
                                gantt.ganttItems.length > 0 ? (
                                    <GanttChart
                                        items={gantt.ganttItems}
                                        dependencies={gantt.ganttDependencies}
                                        groups={gantt.ganttGroups}
                                        onGroupToggle={gantt.handleGroupToggle}
                                        onItemClick={handleGanttClick}
                                        onItemMove={gantt.handleGanttItemMove}
                                        onItemResize={gantt.handleGanttItemResize}
                                        onDependencyCreate={gantt.handleDependencyCreate}
                                        onDependencyDelete={gantt.handleDependencyDelete}
                                        todayLine
                                        nonWorkDays={gantt.nonWorkDays}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        Las tareas necesitan fechas planificadas para mostrarse en el Gantt.
                                    </div>
                                )
                            )}

                            {/* Table + Cards (unified DataTable) */}
                            {(viewMode === "table" || viewMode === "cards") && (
                                <DataTable
                                    columns={tableColumns}
                                    data={projectFilteredTasks}
                                    viewMode={viewMode === "cards" ? "grid" : "table"}
                                    gridClassName="flex flex-col gap-2 pb-8"
                                    renderGridItem={(row) => (
                                        <ConstructionTaskCard
                                            task={row}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onStatusChange={gantt.handleStatusChange}
                                        />
                                    )}
                                    onRowClick={handleEdit}
                                    pageSize={20}
                                    showPagination={projectFilteredTasks.length > 20}
                                    stickyHeader
                                    enableContextMenu
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete dialog (from useTableActions) */}
            <DeleteConfirmDialog />
        </>
    );
}
