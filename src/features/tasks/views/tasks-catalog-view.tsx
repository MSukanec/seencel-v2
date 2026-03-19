"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import {
    Plus, Monitor, ClipboardList, Circle, MoreHorizontal,
    Upload, History, Download, LayoutGrid, Table2,
    Building2, Archive,
} from "lucide-react";

import { TasksByDivision, Unit, TaskDivision, TaskAction, TaskElement, TaskView } from "@/features/tasks/types";
import { TaskCatalog } from "@/features/tasks/components/tasks-catalog";
import { DivisionsSidebar } from "@/features/tasks/components/divisions-sidebar";
import { getTaskColumns, TASK_STATUS_CONFIG } from "@/features/tasks/tables/tasks-columns";

import { PageHeaderActionPortal } from "@/components/layout";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Card } from "@/components/ui/card";
import { ContextSidebar } from "@/stores/sidebar-store";
import { StatusDot } from "@/components/shared/popovers";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { usePanel } from "@/stores/panel-store";
import { useModal } from "@/stores/modal-store";
import { useTableFilters } from "@/hooks/use-table-filters";
import { deleteTask, updateTaskStatus, updateTaskInline } from "@/features/tasks/actions";
import { ImportConfig, createImportBatch, importTasksCatalogBatch, importAITasksBatch, revertImportBatch } from "@/lib/import";
import { analyzeExcelStructure } from "@/features/ai/actions";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { ImportHistoryModal } from "@/components/shared/import/import-history-modal";
import { toast } from "sonner";
import { useTableActions } from "@/hooks/use-table-actions";

// ── View mode ────────────────────────────────────────────────
type ViewMode = "table" | "cards";

const VIEW_OPTIONS = [
    { value: "table", icon: Table2, label: "Tabla" },
    { value: "cards", icon: LayoutGrid, label: "Tarjetas" },
];

// ── Props ─────────────────────────────────────────────────────
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
    isAdminMode = false,
}: TasksCatalogViewProps) {
    const router = useRouter();
    const { openPanel } = usePanel();
    const { openModal } = useModal();

    // ── Filter units applicable to tasks ───────────────────────
    const taskUnits = useMemo(() => {
        return units.filter(u => u.applicable_to?.includes("task"));
    }, [units]);

    // ── View mode state ────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // ── Division sidebar state (shared by both views) ──────────
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [sidebarOrigin, setSidebarOrigin] = useState<"system" | "own">("system");

    // Filtered divisions for the sidebar
    const filteredSidebarDivisions = useMemo(() => {
        if (isAdminMode) return divisions;
        if (sidebarOrigin === "system") return divisions.filter(d => d.is_system);
        if (sidebarOrigin === "own") return divisions.filter(d => !d.is_system);
        return divisions;
    }, [divisions, sidebarOrigin, isAdminMode]);

    // ── Flatten all tasks ──────────────────────────────────────
    const allTasks = useMemo(() => groupedTasks.flatMap(g => g.tasks), [groupedTasks]);

    // ═══════════════════════════════════════════════════════
    // Filters via useTableFilters
    // ═══════════════════════════════════════════════════════
    const filters = useTableFilters({
        facets: [
            {
                key: "origin",
                title: "Origen",
                icon: Monitor,
                options: [
                    { label: "Sistema", value: "system" },
                    { label: "Propios", value: "organization" },
                ],
            },
            {
                key: "status",
                title: "Estado",
                icon: Circle,
                options: [
                    { label: "Activa", value: "active" },
                    { label: "Borrador", value: "draft" },
                    { label: "Archivada", value: "archived" },
                ],
            },
        ],
    });

    // ── Computed filters ───────────────────────────────────────
    const originFilter = useMemo(() => {
        const originValues = filters.facetValues["origin"];
        if (!originValues || originValues.size === 0 || originValues.size === 2) return "all";
        if (originValues.has("system")) return "system";
        if (originValues.has("organization")) return "organization";
        return "all";
    }, [filters.facetValues]);

    const statusFilter = filters.facetValues["status"] || new Set<string>();

    // ── Filtered tasks (search + origin + status + division) ──
    const filteredTasks = useMemo(() => {
        let tasks = allTasks;

        // Origin
        if (originFilter === "system") tasks = tasks.filter(t => t.is_system);
        else if (originFilter === "organization") tasks = tasks.filter(t => !t.is_system);

        // Division sidebar
        if (selectedDivisionId === "sin-division") {
            tasks = tasks.filter(t => !t.task_division_id);
        } else if (selectedDivisionId !== null) {
            tasks = tasks.filter(t => t.task_division_id === selectedDivisionId);
        }

        // Search
        if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            tasks = tasks.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.custom_name?.toLowerCase().includes(q) ||
                t.code?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }

        // Status facet
        if (statusFilter.size > 0) {
            tasks = tasks.filter(t => statusFilter.has(t.status ?? "active"));
        }

        return tasks;
    }, [allTasks, originFilter, selectedDivisionId, filters.searchQuery, statusFilter]);

    // ── Task counts for sidebar ────────────────────────────────
    const taskCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        let tasksToCount = allTasks.filter(t => (t.status ?? "active") !== "archived");

        if (originFilter === "system") tasksToCount = tasksToCount.filter(t => t.is_system);
        else if (originFilter === "organization") tasksToCount = tasksToCount.filter(t => !t.is_system);

        tasksToCount.forEach(t => {
            const divId = t.task_division_id || "sin-division";
            counts[divId] = (counts[divId] || 0) + 1;
        });

        return counts;
    }, [allTasks, originFilter]);

    // Active task count for the specified sidebar origin
    const sidebarTaskCount = useMemo(() => {
        let tasksToCount = allTasks.filter(t => (t.status ?? "active") !== "archived");
        if (!isAdminMode) {
            if (sidebarOrigin === "system") tasksToCount = tasksToCount.filter(t => t.is_system);
            else if (sidebarOrigin === "own") tasksToCount = tasksToCount.filter(t => !t.is_system);
        }
        return tasksToCount.length;
    }, [allTasks, sidebarOrigin, isAdminMode]);

    // ═══════════════════════════════════════════════════════
    // Delete via useTableActions
    // ═══════════════════════════════════════════════════════
    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<TaskView>({
        onDelete: async (task) => {
            const result = await deleteTask(task.id, isAdminMode);
            return { success: !result.error };
        },
        entityName: "tarea",
        entityNamePlural: "tareas",
    });

    // ═══════════════════════════════════════════════════════
    // Status change handler (optimistic + server)
    // ═══════════════════════════════════════════════════════
    const handleStatusChange = useCallback(async (task: TaskView, status: string) => {
        const result = await updateTaskStatus(task.id, status as "draft" | "active" | "archived", isAdminMode);
        if (result.error) {
            toast.error(result.error);
        } else {
            const labels: Record<string, string> = { draft: "Borrador", active: "Activa", archived: "Archivada" };
            toast.success(`Estado cambiado a: ${labels[status] || status}`);
            router.refresh();
        }
    }, [isAdminMode, router]);

    // ═══════════════════════════════════════════════════════
    // Form Handlers
    // ═══════════════════════════════════════════════════════
    const handleCreateTask = useCallback(() => {
        openPanel('tasks-form', {
            organizationId: orgId,
            units: taskUnits,
            divisions,
            isAdminMode,
        });
    }, [openPanel, orgId, taskUnits, divisions, isAdminMode]);

    const handleEditTask = useCallback((task: TaskView) => {
        openPanel('tasks-form', {
            mode: "edit",
            initialData: task,
            organizationId: orgId,
            units: taskUnits,
            divisions,
            isAdminMode,
            directType: "own",
        });
    }, [openPanel, orgId, taskUnits, divisions, isAdminMode]);

    const handleViewTask = useCallback((task: TaskView) => {
        const pathname = isAdminMode
            ? "/admin/catalog/task/[taskId]"
            : "/organization/catalog/task/[taskId]";
        router.push({ pathname, params: { taskId: task.id } } as any);
    }, [isAdminMode, router]);

    // ═══════════════════════════════════════════════════════
    // Inline Update Handler (for DataTable)
    // ═══════════════════════════════════════════════════════
    const handleInlineUpdate = useCallback(async (task: TaskView, updates: Record<string, any>) => {
        try {
            const result = await updateTaskInline(task.id, updates, isAdminMode);
            if (!result.success) {
                toast.error(result.error || "Error al actualizar");
            } else {
                router.refresh();
            }
        } catch {
            toast.error("Error inesperado al actualizar");
        }
    }, [isAdminMode, router]);

    // ═══════════════════════════════════════════════════════
    // DataTable columns
    // ═══════════════════════════════════════════════════════
    const columns = useMemo(() => getTaskColumns({
        divisions,
        units: taskUnits,
        onStatusChange: handleStatusChange,
        onInlineUpdate: handleInlineUpdate,
    }), [divisions, taskUnits, handleStatusChange, handleInlineUpdate]);

    // ═══════════════════════════════════════════════════════
    // Import Handlers
    // ═══════════════════════════════════════════════════════
    const tasksImportConfig: ImportConfig<any> = useMemo(() => ({
        entityLabel: "Tareas",
        entityId: "tasks_catalog",
        description: "Importá tu catálogo de tareas desde un archivo Excel o CSV.",
        docsPath: "/docs/catalogo-tecnico/tareas",
        columns: [
            { id: "name", label: "Nombre", required: true, description: "Nombre de la tarea", example: "Construcción de muro de ladrillo hueco" },
            { id: "code", label: "Código", required: false, description: "Código interno", example: "MUR-001" },
            { id: "description", label: "Descripción", required: false, description: "Detalle técnico", example: "Muro de ladrillo hueco de 18cm" },
            {
                id: "unit_name", label: "Unidad de Medida", required: false, example: "m²",
                foreignKey: { table: 'units', labelField: 'name', valueField: 'id', fetchOptions: async () => taskUnits.map(u => ({ id: u.id, label: `${u.name} (${u.symbol})` })), allowCreate: true }
            },
            {
                id: "division_name", label: "Rubro", required: false, example: "Albañilería",
                foreignKey: { table: 'task_divisions', labelField: 'name', valueField: 'id', fetchOptions: async () => divisions.map(d => ({ id: d.id, label: d.name })), allowCreate: true }
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
            const batch = await createImportBatch(orgId, "tasks_catalog", records.length);
            const result = await importTasksCatalogBatch(orgId, records, batch.id);
            router.refresh();
            return { success: result.success, errors: result.errors, batchId: batch.id, created: result.created };
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'tasks');
            router.refresh();
        }
    }), [taskUnits, divisions, orgId, router]);

    const handleImport = useCallback(() => {
        openModal(
            <BulkImportModal config={tasksImportConfig} organizationId={orgId} />,
            { title: "Importar Tareas", description: "Importá tareas desde un archivo Excel o CSV", size: "xl" }
        );
    }, [openModal, tasksImportConfig, orgId]);

    const handleImportHistory = useCallback(() => {
        openModal(
            <ImportHistoryModal organizationId={orgId} entityType="tasks_catalog" entityTable="tasks" onRevert={() => router.refresh()} />,
            { title: "Historial de Importaciones", description: "Últimas 20 importaciones de tareas", size: "lg" }
        );
    }, [openModal, orgId, router]);

    // ═══════════════════════════════════════════════════════
    // State flags
    // ═══════════════════════════════════════════════════════
    const isEmpty = allTasks.length === 0;

    // ═══════════════════════════════════════════════════════
    // Header action portal
    // ═══════════════════════════════════════════════════════
    const headerAction = (
        <PageHeaderActionPortal>
            <div className="flex items-center">
                <button
                    onClick={handleCreateTask}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-l-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nueva Tarea</span>
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center justify-center h-8 w-8 rounded-r-lg border-l border-primary-foreground/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleImport}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleImportHistory}>
                            <History className="h-4 w-4 mr-2" />
                            Historial de Importaciones
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toast.info("Exportar CSV: próximamente")}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Exportar Excel: próximamente")}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Excel
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </PageHeaderActionPortal>
    );

    // ═══════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════

    const sidebarAction = !isAdminMode ? (
        <Select value={sidebarOrigin} onValueChange={(v) => setSidebarOrigin(v as "system" | "own")}>
            <SelectTrigger className="h-6 text-xs font-medium border-transparent bg-transparent shadow-none hover:bg-muted focus:ring-0 px-2 py-0 min-h-0 min-w-[80px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="own">Propios</SelectItem>
            </SelectContent>
        </Select>
    ) : undefined;

    return (
        <>
            {headerAction}

            {/* Context Sidebar — shared across both views */}
            <ContextSidebar 
                title={isAdminMode ? "Rubros del Sistema" : "Rubros"}
                action={sidebarAction}
            >
                <DivisionsSidebar
                    divisions={filteredSidebarDivisions}
                    taskCounts={taskCounts}
                    selectedDivisionId={selectedDivisionId}
                    onSelectDivision={setSelectedDivisionId}
                    totalTasks={sidebarTaskCount}
                />
            </ContextSidebar>

            {/* Empty state */}
            {isEmpty ? (
                <ViewEmptyState
                    mode="empty"
                    icon={ClipboardList}
                    viewName="Tareas"
                    featureDescription="Las tareas son los trabajos unitarios que componen tus proyectos de construcción. Definí tareas como 'Construcción de muro de ladrillo', 'Instalación de cañería', etc."
                    onAction={handleCreateTask}
                    actionLabel="Nueva Tarea"
                    docsPath="/docs/catalogo-tecnico/tareas"
                />
            ) : (
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    {/* Inline ToolbarCard */}
                    <ToolbarCard
                        filters={filters}
                        searchPlaceholder="Buscar tareas..."
                        display={{
                            viewMode,
                            onViewModeChange: (v) => setViewMode(v as ViewMode),
                            viewModeOptions: VIEW_OPTIONS,
                        }}
                    />

                    {/* No-results */}
                    {filters.hasActiveFilters && filteredTasks.length === 0 ? (
                        <ViewEmptyState
                            mode="no-results"
                            icon={ClipboardList}
                            viewName="tareas"
                            filterContext="con ese criterio de búsqueda"
                            onResetFilters={filters.clearAll}
                        />
                    ) : viewMode === "table" ? (
                        /* ── TABLE VIEW ───────────────── */
                        <DataTable
                            columns={columns}
                            data={filteredTasks}
                            enableContextMenu
                            enableRowSelection
                            onRowClick={handleViewTask}
                            onView={handleViewTask}
                            onEdit={handleEditTask}
                            onDelete={handleDelete}
                            onBulkDelete={handleBulkDelete}
                            groupBy="division_name"
                            getGroupValue={(row) => (row as TaskView).division_name || "Sin Rubro"}
                            renderGroupHeader={(groupValue, groupRows) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                                        {groupValue}
                                    </span>
                                    <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                                </div>
                            )}
                            globalFilter={filters.searchQuery}
                            onGlobalFilterChange={filters.setSearchQuery}
                        />
                    ) : (
                        /* ── CARDS VIEW ────────────── */
                        <Card variant="inset" className="overflow-auto">
                            <TaskCatalog
                                groupedTasks={groupedTasks}
                                orgId={orgId}
                                units={units}
                                divisions={divisions}
                                isAdminMode={isAdminMode}
                                searchQuery={filters.searchQuery}
                                originFilter={originFilter}
                                statusFilter={statusFilter}
                                selectedDivisionId={selectedDivisionId}
                            />
                        </Card>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog (from useTableActions) */}
            <DeleteConfirmDialog />
        </>
    );
}
