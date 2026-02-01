"use client";

import { useState } from "react";
import { Project } from "@/types/project";
import { ProjectsDataTable } from "./projects-data-table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Plus, Circle, Timer, CheckCircle2, Ban } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/features/projects/actions";
import { ProjectForm } from "./project-form";
import { DeleteConfirmationDialog } from "@/components/shared/forms/general/delete-confirmation-dialog";
import { toast } from "sonner";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useCreateProjectAction } from "./create-project-button";

interface ProjectsListProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
    /** Max projects allowed by plan (-1 = unlimited) */
    maxProjects?: number;
}

type ViewMode = "grid" | "table";

export function ProjectsList({ projects, organizationId, lastActiveProjectId, maxProjects = -1 }: ProjectsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create project action
    const handleCreateProject = useCreateProjectAction(organizationId);

    // Check if limit is reached (-1 means unlimited)
    const isUnlimited = maxProjects === -1;
    const canCreateProject = isUnlimited || projects.length < maxProjects;

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleEdit = (project: { id: string; name: string }) => {
        const fullProject = projects.find(p => p.id === project.id);
        if (!fullProject) return;

        openModal(
            <ProjectForm
                mode="edit"
                organizationId={organizationId}
                initialData={fullProject}
                onSuccess={handleSuccess}
                onCancel={closeModal}
            />,
            {
                title: "Editar Proyecto",
                description: `Modificando "${project.name}"`,
                key: `edit-project-${project.id}`
            }
        );
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteProject(projectToDelete.id);
            if (result.success) {
                toast.success("Proyecto eliminado correctamente");
                setProjectToDelete(null);
                router.refresh();
            } else {
                toast.error(result.error || "Error al eliminar el proyecto");
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    // Status filter options
    const statusOptions = [
        { value: "active", label: "Activo", icon: Circle },
        { value: "planning", label: "En Planificación", icon: Timer },
        { value: "completed", label: "Completado", icon: CheckCircle2 },
        { value: "inactive", label: "Inactivo", icon: Ban },
    ];

    // Dynamic type options from projects
    const typeOptions = Array.from(new Set(projects.map(p => p.project_type_name).filter(Boolean)))
        .map(type => ({ label: type!, value: type! }));

    // Dynamic modality options from projects
    const modalityOptions = Array.from(new Set(projects.map(p => p.project_modality_name).filter(Boolean)))
        .map(modality => ({ label: modality!, value: modality! }));

    // View toggle component
    const viewToggle = (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("grid")}
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("table")}
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
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
                        customMessage: `Has alcanzado el límite de ${maxProjects} proyecto${maxProjects !== 1 ? 's' : ''} de tu plan actual (${projects.length}/${maxProjects}). Actualiza a PRO para crear proyectos ilimitados.`
                    }
                }]}
            />

            <ProjectsDataTable
                projects={projects}
                organizationId={organizationId}
                lastActiveProjectId={lastActiveProjectId}
                viewMode={viewMode}
                maxProjects={maxProjects}
                globalFilter={searchQuery}
                onGlobalFilterChange={setSearchQuery}
                onDelete={handleDelete}
            />

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
