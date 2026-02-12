"use client";

import { useState } from "react";
import { Project } from "@/types/project";
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
    Building,
} from "lucide-react";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectListItem } from "@/components/shared/list-item/items/project-list-item";
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

type ViewMode = "grid" | "list";

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

    // === VIEW TOGGLE ===

    const viewToggle = (
        <ToolbarTabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "list")}
            options={[
                { value: "grid", label: "Tarjetas", icon: LayoutGrid },
                { value: "list", label: "Lista", icon: List },
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
            ) : viewMode === "list" ? (
                /* List View — ProjectListItem */
                <div className="space-y-2 px-4 md:px-0 overflow-y-auto">
                    {filteredProjects.map(project => (
                        <ProjectListItem
                            key={project.id}
                            project={project}
                            onClick={() => handleNavigateToProject(project)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                /* Grid View — ProjectCard */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
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
