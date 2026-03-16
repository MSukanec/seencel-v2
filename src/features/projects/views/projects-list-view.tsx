"use client";

/**
 * Projects — List View
 * 
 * Renders organization projects in grid or table mode.
 * - Grid: ProjectCard cards with right-click context menu
 * - Table: DataTable with column factories, inline editing and context menu
 */

import { useState, useMemo } from "react";
import { Project } from "@/types/project";
import { useRouter } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTableFilters } from "@/hooks/use-table-filters";
import { toast } from "sonner";

import {
    LayoutGrid,
    Table2,
    Plus,
    Building,
    CircleDot,
    Layers,
    FolderCog,
    MapPin,
} from "lucide-react";

import { EntityContextMenu, type EntityParameter, type EntityCustomAction } from "@/components/shared/entity-context-menu";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { PageHeaderActionPortal } from "@/components/layout";
import { SearchButton, FilterPopover, ToolbarCard, DisplayButton } from "@/components/shared/toolbar-controls";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ProjectCard } from "@/features/projects/components/project-card";
import { getProjectColumns, PROJECT_STATUS_CONFIG } from "@/features/projects/tables/projects-columns";
import { StatusDot } from "@/components/shared/popovers";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

import { ProjectType, ProjectModality } from "@/types/project";
import { deleteProject, updateProjectInline } from "@/features/projects/actions";

interface ProjectsListViewProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    maxActiveProjects?: number;
    projectTypes?: ProjectType[];
    projectModalities?: ProjectModality[];
}

type ViewMode = "grid" | "table";

const VIEW_OPTIONS = [
    { value: "grid", icon: LayoutGrid, label: "Tarjetas" },
    { value: "table", icon: Table2, label: "Tabla" },
];

export function ProjectsListView({ projects, organizationId, lastActiveProjectId, maxActiveProjects = -1, projectTypes = [], projectModalities = [] }: ProjectsListViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const { openPanel } = usePanel();

    // Search + Faceted filters
    const statusOptions = useMemo(() => [
        { label: "Planificación", value: "planning" },
        { label: "Activo", value: "active" },
        { label: "Inactivo", value: "inactive" },
        { label: "Completado", value: "completed" },
    ], []);

    const typeOptions = useMemo(() =>
        projectTypes.map(t => ({ label: t.name, value: t.name })),
        [projectTypes]
    );

    const modalityOptions = useMemo(() =>
        projectModalities.map(m => ({ label: m.name, value: m.name })),
        [projectModalities]
    );

    const filters = useTableFilters({
        facets: [
            { key: "status", title: "Estado", icon: CircleDot, options: statusOptions },
            ...(typeOptions.length > 0 ? [{ key: "type", title: "Tipo", icon: Layers, options: typeOptions }] : []),
            ...(modalityOptions.length > 0 ? [{ key: "modality", title: "Modalidad", icon: FolderCog, options: modalityOptions }] : []),
        ],
    });

    // 🚀 OPTIMISTIC UI
    const {
        optimisticItems: optimisticProjects,
        addItem,
        updateItem,
        removeItem,
    } = useOptimisticList({
        items: projects,
        getItemId: (project) => project.id,
    });

    // Plan limits
    const activeProjectsCount = projects.filter(p => p.status === 'active' || p.status === 'planning').length;

    // === HANDLERS ===

    const handleCreateProject = () => {
        const activeProjectsList = projects
            .filter(p => p.status === 'active' || p.status === 'planning')
            .map(p => ({ id: p.id, name: p.name, color: p.color, image_url: p.image_url }));

        openPanel('projects-project-form', {
            mode: 'create',
            organizationId,
            types: projectTypes,
            modalities: projectModalities,
            activeProjects: activeProjectsList,
            maxActiveProjects,
            onSuccess: (project: any) => {
                if (project) addItem(project);
            },
        });
    };

    const handleEdit = (project: Project) => {
        const activeProjectsList = projects
            .filter(p => (p.status === 'active' || p.status === 'planning') && p.id !== project.id)
            .map(p => ({ id: p.id, name: p.name, color: p.color, image_url: p.image_url }));

        openPanel('projects-project-form', {
            mode: 'edit',
            initialData: project,
            organizationId,
            types: projectTypes,
            modalities: projectModalities,
            activeProjects: activeProjectsList,
            maxActiveProjects,
            onSuccess: (updatedProject: any) => {
                if (updatedProject) updateItem(updatedProject.id, updatedProject);
            },
        });
    };

    const handleNavigateToProject = (project: Project) => {
        router.push(`/organization/projects/${project.id}` as any);
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        const deletedProject = projectToDelete;

        removeItem(deletedProject.id);
        setProjectToDelete(null);
        toast.success("Proyecto eliminado correctamente");

        try {
            const result = await deleteProject(deletedProject.id);
            if (!result.success) {
                addItem(deletedProject);
                toast.error(result.error || "Error al eliminar el proyecto");
            }
        } catch (error) {
            addItem(deletedProject);
            toast.error("Error inesperado al eliminar");
        }
    };

    // === Inline Update Handler (for DataTable + Cards) ===
    const handleInlineUpdate = async (row: Project, updates: Record<string, any>) => {
        // Optimistic update
        updateItem(row.id, updates);

        try {
            const result = await updateProjectInline(row.id, updates);
            if (!result.success) {
                updateItem(row.id, row); // Rollback
                toast.error(result.error || "Error al actualizar");
            }
        } catch (error) {
            updateItem(row.id, row); // Rollback
            toast.error("Error inesperado al actualizar");
        }
    };

    // === Card inline update handler (takes projectId + updates) ===
    const handleCardInlineUpdate = async (projectId: string, updates: Record<string, any>) => {
        const project = optimisticProjects.find(p => p.id === projectId);
        if (project) {
            await handleInlineUpdate(project, updates);
        }
    };

    // === Columns (memoized) ===
    const columns = useMemo(() => getProjectColumns({
        onInlineUpdate: handleInlineUpdate,
        typeOptions: projectTypes.map(t => ({ value: t.id, label: t.name })),
        modalityOptions: projectModalities.map(m => ({ value: m.id, label: m.name })),
        onNavigateToProject: handleNavigateToProject,
    }), [projectTypes, projectModalities]);

    // === Entity Parameters (Zone 2 — submenus for Estado, Tipo, Modalidad) ===
    const projectParameters: EntityParameter<Project>[] = useMemo(() => [
        {
            label: "Estado",
            icon: CircleDot,
            options: PROJECT_STATUS_CONFIG.map(opt => ({
                value: opt.value,
                label: opt.label,
                icon: <StatusDot variant={opt.variant} />,
            })),
            currentValueKey: "status",
            onSelect: (project, value) => handleCardInlineUpdate(project.id, { status: value }),
        },
        ...(projectTypes.length > 0 ? [{
            label: "Tipo",
            icon: Layers,
            options: projectTypes.map(t => ({ value: t.name, label: t.name })),
            currentValueKey: "project_type_name",
            onSelect: (project: Project, value: string) => handleCardInlineUpdate(project.id, { project_type_name: value }),
        }] : []),
        ...(projectModalities.length > 0 ? [{
            label: "Modalidad",
            icon: FolderCog,
            options: projectModalities.map(m => ({ value: m.name, label: m.name })),
            currentValueKey: "project_modality_name",
            onSelect: (project: Project, value: string) => handleCardInlineUpdate(project.id, { project_modality_name: value }),
        }] : []),
    ], [projectTypes, projectModalities]);

    // === Custom Actions (Zone 3) ===
    const projectCustomActions: EntityCustomAction<Project>[] = useMemo(() => [
        {
            label: "Dirección",
            icon: <MapPin className="h-3.5 w-3.5" />,
            onClick: (project) => handleEdit(project),
        },
    ], []);

    // === Header action (only primary button) ===
    const headerAction = (
        <PageHeaderActionPortal>
            <button
                onClick={handleCreateProject}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
                <Plus className="h-4 w-4" />
                <span>Nuevo Proyecto</span>
            </button>
        </PageHeaderActionPortal>
    );

    // Filtered items (search + facets) — must be ABOVE any early return (Rules of Hooks)
    const STATUS_ORDER: Record<string, number> = { planning: 0, active: 1, inactive: 2, completed: 3 };

    const filteredProjects = useMemo(() => {
        return optimisticProjects
            .filter((p) => {
                if (filters.searchQuery && !p.name?.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                    return false;
                }
                const statusFilter = filters.facetValues["status"];
                if (statusFilter?.size > 0 && !statusFilter.has(p.status)) {
                    return false;
                }
                const typeFilter = filters.facetValues["type"];
                if (typeFilter?.size > 0 && !typeFilter.has(p.project_type_name || "")) {
                    return false;
                }
                const modalityFilter = filters.facetValues["modality"];
                if (modalityFilter?.size > 0 && !modalityFilter.has(p.project_modality_name || "")) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
    }, [optimisticProjects, filters.searchQuery, filters.facetValues]);

    // === EARLY RETURN: Empty State ===
    if (optimisticProjects.length === 0) {
        return (
            <>
                {headerAction}
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Building}
                        viewName="Proyectos"
                        featureDescription="Un proyecto representa una obra o construcción que estás gestionando. Cada proyecto tiene su propio presupuesto, tareas, materiales y equipo asignado. Creá tu primer proyecto para empezar."
                        onAction={handleCreateProject}
                        actionLabel="Nuevo Proyecto"
                        docsPath="/docs/proyectos/introduccion"
                    />
                </div>
            </>
        );
    }

    // === No-results ===
    if (filters.hasActiveFilters && filteredProjects.length === 0) {
        return (
            <>
                {headerAction}
                <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    <ToolbarCard
                        right={
                            <>
                                <SearchButton filters={filters} placeholder="Buscar proyectos..." />
                                <FilterPopover filters={filters} />
                                <DisplayButton
                                    viewMode={viewMode}
                                    onViewModeChange={(v) => setViewMode(v as ViewMode)}
                                    viewModeOptions={VIEW_OPTIONS}
                                />
                            </>
                        }
                    />
                    <ViewEmptyState
                        mode="no-results"
                        icon={Building}
                        viewName="proyectos"
                        filterContext="con esa búsqueda"
                        onResetFilters={filters.clearAll}
                    />
                </div>
            </>
        );
    }

    // === RENDER ===
    return (
        <>
            {headerAction}

            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                {/* Toolbar Card — search + view toggle */}
                <ToolbarCard
                    right={
                        <>
                            <SearchButton filters={filters} placeholder="Buscar proyectos..." />
                            <FilterPopover filters={filters} />
                            <DisplayButton
                                viewMode={viewMode}
                                onViewModeChange={(v) => setViewMode(v as ViewMode)}
                                viewModeOptions={VIEW_OPTIONS}
                            />
                        </>
                    }
                />

                {/* Content */}
                {viewMode === "table" ? (
                    <DataTable
                        columns={columns}
                        data={filteredProjects}
                        enableContextMenu
                        enableRowSelection
                        onBulkDelete={(rows, reset) => {
                            // For now, delete one by one
                            rows.forEach(r => handleDelete(r as Project));
                            reset();
                        }}
                        groupBy="status"
                        getGroupValue={(row) => (row as Project).status}
                        renderGroupHeader={(groupValue, groupRows) => {
                            const config = PROJECT_STATUS_CONFIG.find(o => o.value === groupValue);
                            const label = config?.label || groupValue;
                            const variant = config?.variant || "neutral";
                            return (
                                <div className="flex items-center gap-2">
                                    <StatusDot variant={variant} />
                                    <span className="text-xs font-[450] text-foreground">{label}</span>
                                    <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                                </div>
                            );
                        }}
                        onRowClick={handleNavigateToProject}
                        onView={handleNavigateToProject}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        parameters={projectParameters}
                        customActions={projectCustomActions}
                    />
                ) : (
                    <Card variant="inset">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProjects.map(project => (
                                <EntityContextMenu
                                    key={project.id}
                                    data={project}
                                    onView={handleNavigateToProject}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    parameters={projectParameters}
                                    customActions={projectCustomActions}
                                >
                                    <div>
                                        <ProjectCard
                                            project={project}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onUpdateProject={handleCardInlineUpdate}
                                            typeOptions={projectTypes?.map(t => ({ value: t.name, label: t.name })) || []}
                                            modalityOptions={projectModalities?.map(m => ({ value: m.name, label: m.name })) || []}
                                        />
                                    </div>
                                </EntityContextMenu>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation */}
            <DeleteConfirmationDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar proyecto permanentemente?"
                description={
                    <div className="space-y-3">
                        <p>
                            Estás a punto de eliminar el proyecto <span className="font-semibold text-foreground">"{projectToDelete?.name}"</span>.
                        </p>
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                            <p className="font-medium text-destructive mb-2">⚠️ Esta acción es irreversible</p>
                            <p className="text-muted-foreground">
                                Se eliminarán permanentemente todos los datos asociados: tareas, archivos,
                                registros de bitácora, finanzas, materiales y configuraciones del proyecto.
                            </p>
                        </div>
                    </div>
                }
                validationText={projectToDelete?.name}
                validationPrompt="Para confirmar, escribí el nombre del proyecto:"
                confirmLabel="Eliminar permanentemente"
                deletingLabel="Eliminando..."
                isDeleting={isDeleting}
            />
        </>
    );
}

