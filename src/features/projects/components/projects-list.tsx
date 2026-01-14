"use client";

import { useState } from "react";
import { Project } from "@/types/project";
import { ProjectsDataTable } from "./projects-data-table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/features/projects/actions";
import { ProjectForm } from "./project-form";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { toast } from "sonner";

interface ProjectsListProps {
    projects: Project[];
    organizationId: string;
    lastActiveProjectId?: string | null;
}

type ViewMode = "grid" | "table";

export function ProjectsList({ projects, organizationId, lastActiveProjectId }: ProjectsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleEdit = (project: { id: string; name: string }) => {
        // Find the full project data from the projects array
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
                router.refresh(); // Refresh the list after successful deletion
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

    return (
        <div className="space-y-4">
            <ProjectsDataTable
                projects={projects}
                organizationId={organizationId}
                lastActiveProjectId={lastActiveProjectId}
                viewMode={viewMode}
                viewToggle={
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
                }
            />

            <DeleteConfirmationDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Proyecto"
                description={
                    <span>
                        ¿Estás seguro de que deseas eliminar el proyecto <span className="font-medium text-foreground">"{projectToDelete?.name}"</span>?
                        <br />
                        Esta acción moverá el proyecto a la papelera.
                    </span>
                }
                validationText={projectToDelete?.name}
                confirmLabel="Eliminar Proyecto"
                deletingLabel="Eliminando..."
                isDeleting={isDeleting}
            />
        </div>
    );
}
