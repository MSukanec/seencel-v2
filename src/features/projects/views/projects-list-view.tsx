"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/types/project";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseDateFromDB } from "@/lib/timezone-data";
import { useRouter } from "@/i18n/routing";
import { useLayoutStore } from "@/stores/layout-store";
import { useModal } from "@/stores/modal-store";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
    LayoutGrid,
    List,
    Plus,
    FolderSearch,
    Building,
    Activity,
    CheckCircle,
    Clock,
    CircleOff
} from "lucide-react";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectsProjectForm } from "../forms/projects-project-form";
import { ProjectType, ProjectModality } from "@/types/project";
import { deleteProject } from "@/features/projects/actions";

interface ProjectsListViewProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    /** Max projects allowed by plan (-1 = unlimited) */
    maxActiveProjects?: number;
    /** Project types for form selects */
    projectTypes?: ProjectType[];
    /** Project modalities for form selects */
    projectModalities?: ProjectModality[];
}

type ViewMode = "grid" | "table";

export function ProjectsListView({ projects, organizationId, lastActiveProjectId, maxActiveProjects = -1, projectTypes = [], projectModalities = [] }: ProjectsListViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const { actions } = useLayoutStore();
    const { openModal } = useModal();
    const tForm = useTranslations('Project.form');

    // 🚀 OPTIMISTIC UI: Instant visual updates
    const {
        optimisticItems: optimisticProjects,
        addItem,
        updateItem,
        removeItem,
    } = useOptimisticList({
        items: projects,
        getItemId: (project) => project.id,
    });

    // Plan limits: count only ACTIVE projects
    const activeProjectsCount = projects.filter(p => p.status === 'active').length;
    const isUnlimited = maxActiveProjects === -1;
    const canCreateProject = isUnlimited || activeProjectsCount < maxActiveProjects;

    // === HANDLERS ===

    const handleCreateProject = () => {
        openModal(
            <ProjectsProjectForm
                mode="create"
                organizationId={organizationId}
                types={projectTypes}
                modalities={projectModalities}
                onSuccess={(project) => {
                    if (project) addItem(project);
                }}
            />,
            {
                title: tForm('createTitle'),
                description: tForm('description'),
                key: 'create-project',
            }
        );
    };

    const handleEdit = (project: Project) => {
        // Build active projects list for swap modal (exclude the project being edited)
        const activeProjectsList = projects
            .filter(p => p.status === 'active' && p.id !== project.id)
            .map(p => ({ id: p.id, name: p.name, color: p.color, image_url: p.image_url }));

        openModal(
            <ProjectsProjectForm
                mode="edit"
                organizationId={organizationId}
                initialData={project}
                types={projectTypes}
                modalities={projectModalities}
                maxActiveProjects={maxActiveProjects}
                activeProjectsCount={activeProjectsCount}
                activeProjects={activeProjectsList}
                onSuccess={(updatedData) => {
                    if (updatedData?.id) updateItem(updatedData.id, updatedData);
                }}
            />,
            {
                title: "Editar Proyecto",
                description: `Modificando "${project.name}"`,
                key: `edit-project-${project.id}`
            }
        );
    };

    const handleNavigateToProject = (project: Project) => {
        actions.setActiveProjectId(project.id);
        actions.setActiveContext('project');
        router.push(`/project/${project.id}` as any);
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        const deletedProject = projectToDelete;

        // 🚀 Optimistic: remove immediately
        removeItem(deletedProject.id);
        setProjectToDelete(null);
        toast.success("Proyecto eliminado correctamente");

        try {
            const result = await deleteProject(deletedProject.id);
            if (!result.success) {
                // Rollback: re-add the project
                addItem(deletedProject);
                toast.error(result.error || "Error al eliminar el proyecto");
            }
        } catch (error) {
            // Rollback
            addItem(deletedProject);
            toast.error("Error inesperado al eliminar");
        }
    };

    // === STATUS BADGE HELPER ===

    const getStatusBadgeProps = (status: string) => {
        const statusKey = status?.toLowerCase() || 'active';
        const statusConfig: Record<string, { variant: "success" | "info" | "warning" | "system" | "secondary"; icon: typeof Activity; label: string }> = {
            active: { variant: "success", icon: Activity, label: "Activo" },
            completed: { variant: "info", icon: CheckCircle, label: "Completado" },
            planning: { variant: "warning", icon: Clock, label: "Planificación" },
            inactive: { variant: "system", icon: CircleOff, label: "Inactivo" },
        };
        return statusConfig[statusKey] || { variant: "secondary" as const, icon: Activity, label: status };
    };

    // === COLUMNS ===

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Proyecto" />
            ),
            cell: ({ row }) => {
                const project = row.original;
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 rounded-lg shrink-0">
                            <AvatarImage src={project.image_url || undefined} />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                                {project.name?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{project.name}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => {
                const { variant, icon: Icon, label } = getStatusBadgeProps(row.original.status);
                return <Badge variant={variant} icon={<Icon className="h-3.5 w-3.5" />}>{label}</Badge>;
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "project_type_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tipo" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {row.original.project_type_name || "Sin tipo"}
                </Badge>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "project_modality_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Modalidad" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.project_modality_name || "-"}
                </span>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Creado" />
            ),
            cell: ({ row }) => {
                const date = row.original.created_at;
                if (!date) return "-";
                const parsed = parseDateFromDB(date);
                if (!parsed) return "-";
                return (
                    <span className="text-muted-foreground text-sm">
                        {format(parsed, "dd MMM yyyy", { locale: es })}
                    </span>
                );
            },
        },
    ];

    // === VIEW TOGGLE ===

    const viewToggle = (
        <ToolbarTabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "table")}
            options={[
                { value: "grid", label: "Tarjetas", icon: LayoutGrid },
                { value: "table", label: "Tabla", icon: List },
            ]}
        />
    );

    // === EARLY RETURN: Empty State (alto completo) ===
    if (projects.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={viewToggle}
                    actions={[{
                        label: "Nuevo Proyecto",
                        icon: Plus,
                        onClick: handleCreateProject,
                        featureGuard: {
                            isEnabled: canCreateProject,
                            featureName: "Crear más proyectos",
                            requiredPlan: "PRO",
                            customMessage: `Alcanzaste el límite de ${maxActiveProjects} proyecto${maxActiveProjects !== 1 ? 's' : ''} activo${maxActiveProjects !== 1 ? 's' : ''} de tu plan actual (${activeProjectsCount}/${maxActiveProjects}). Completá o archivá un proyecto para crear uno nuevo, o actualizá a PRO.`
                        }
                    }]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Building}
                        viewName="Proyectos"
                        featureDescription="Los proyectos son el centro de tu operación en Seencel. Desde aquí podés gestionar obras, asignar tareas, controlar presupuestos, y hacer seguimiento del avance de cada construcción. Creá tu primer proyecto para comenzar a organizar tu empresa."
                        onAction={handleCreateProject}
                        actionLabel="Nuevo Proyecto"
                        docsPath="/docs/proyectos/introduccion"
                    />
                </div>
            </>
        );
    }

    // === RENDER ===

    // Filtered items for no-results detection
    const filteredProjects = optimisticProjects.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Toolbar - Portals to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar proyectos..."
                leftActions={viewToggle}
                actions={[{
                    label: "Nuevo Proyecto",
                    icon: Plus,
                    onClick: handleCreateProject,
                    featureGuard: {
                        isEnabled: canCreateProject,
                        featureName: "Crear más proyectos",
                        requiredPlan: "PRO",
                        customMessage: `Alcanzaste el límite de ${maxActiveProjects} proyecto${maxActiveProjects !== 1 ? 's' : ''} activo${maxActiveProjects !== 1 ? 's' : ''} de tu plan actual (${activeProjectsCount}/${maxActiveProjects}). Completá o archivá un proyecto para crear uno nuevo, o actualizá a PRO.`
                    }
                }]}
            />

            {/* No-results empty state */}
            {searchQuery && filteredProjects.length === 0 ? (
                <div className="h-full flex items-center justify-center py-20">
                    <ViewEmptyState
                        mode="no-results"
                        icon={Building}
                        viewName="proyectos"
                        filterContext="con esa búsqueda"
                        onResetFilters={() => setSearchQuery("")}
                    />
                </div>
            ) : (
                /* DataTable */
                <DataTable
                    columns={columns}
                    data={optimisticProjects}
                    onRowClick={handleNavigateToProject}
                    pageSize={50}
                    viewMode={viewMode}
                    enableRowActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    globalFilter={searchQuery}
                    onGlobalFilterChange={setSearchQuery}
                    renderGridItem={(project: Project) => (
                        <ProjectCard
                            project={project}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                />
            )}

            {/* Delete Confirmation Dialog */}
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
        </div>
    );
}
