"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";

interface CreateProjectButtonProps {
    organizationId: string;
}

export function CreateProjectButton({ organizationId }: CreateProjectButtonProps) {
    const t = useTranslations('Project');
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
                description: tForm('description')
            }
        );
    };

    return (
        <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
        </Button>
    );
}
