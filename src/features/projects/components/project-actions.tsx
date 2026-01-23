"use client";

import { ProjectForm } from "@/features/projects/components/project-form";
import { Project } from "@/types/project";
import { MoreHorizontal } from "lucide-react";
import { deleteProject } from "@/features/projects/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";

interface ProjectActionsProps {
    project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const t = useTranslations('Project.actions');
    const tForm = useTranslations('Project.form');

    const { openModal, closeModal } = useModal();

    const handleEdit = () => {
        openModal(
            <ProjectForm
                mode="edit"
                initialData={project}
                organizationId={project.organization_id}
                onCancel={closeModal}
                onSuccess={closeModal}
            />,
            {
                title: `${tForm('editTitle')}: ${project.name}`,
                description: tForm('description')
            }
        );
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteProject(project.id);
            if (result.success) {
                setShowDeleteAlert(false);
            } else {
                console.error("Failed to delete project:", result.error);
                // Aquí podríamos añadir un toast de error
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { }}>
                        {t('open')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEdit}>
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-destructive focus:text-destructive">
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirmationDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title="¿Eliminar Proyecto?"
                description={
                    <>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente al proyecto
                        <span className="font-semibold text-foreground"> {project.name}</span> y todos sus datos asociados.
                    </>
                }
                validationText={project.name} // ACTIVATING DANGEROUS MODE
                confirmLabel="Eliminar Proyecto"
            />
        </>
    );
}

