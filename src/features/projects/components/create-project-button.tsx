"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectForm } from "@/features/projects/components/project-form";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";
import { FeatureGuard } from "@/components/ui/feature-guard";

interface CreateProjectButtonProps {
    organizationId: string;
    /** Current number of projects in the organization */
    currentProjectCount?: number;
    /** Maximum projects allowed by the plan (-1 = unlimited) */
    maxProjects?: number;
}

/**
 * Hook to get the create project handler
 * Can be used by DataTable actions
 */
export function useCreateProjectAction(organizationId: string) {
    const tForm = useTranslations('Project.form');
    const { openModal, closeModal } = useModal();

    const handleCreate = () => {
        openModal(
            <ProjectForm
                mode="create"
                organizationId={organizationId}
                onCancel={closeModal}
                onSuccess={closeModal}
            />,
            {
                title: tForm('createTitle'),
                description: tForm('description'),
                key: 'create-project',
            }
        );
    };

    return handleCreate;
}

/**
 * Button component with FeatureGuard for plan limits
 * For use in desktop toolbar
 */
export function CreateProjectButton({
    organizationId,
    currentProjectCount = 0,
    maxProjects = -1
}: CreateProjectButtonProps) {
    const t = useTranslations('Project');
    const handleCreate = useCreateProjectAction(organizationId);

    // Check if limit is reached (-1 means unlimited)
    const isUnlimited = maxProjects === -1;
    const canCreateProject = isUnlimited || currentProjectCount < maxProjects;

    return (
        <FeatureGuard
            isEnabled={canCreateProject}
            featureName="Crear más proyectos"
            requiredPlan="PRO"
            customMessage={`Has alcanzado el límite de ${maxProjects} proyecto${maxProjects !== 1 ? 's' : ''} de tu plan actual (${currentProjectCount}/${maxProjects}). Actualiza a PRO para crear proyectos ilimitados.`}
        >
            <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('create')}
            </Button>
        </FeatureGuard>
    );
}
