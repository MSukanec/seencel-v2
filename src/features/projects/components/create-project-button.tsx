"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectForm } from "@/features/projects/components/project-form";
import { useTranslations } from "next-intl";
import { useModal } from "@/providers/modal-store";
import { motion } from "framer-motion";

interface CreateProjectButtonProps {
    organizationId: string;
}

export function CreateProjectButton({ organizationId }: CreateProjectButtonProps) {
    const t = useTranslations('Project');
    const tForm = useTranslations('Project.form');
    const { openModal, closeModal } = useModal();
    const layoutId = "create-project-morph-id";

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
                // morphLayoutId: layoutId
            }
        );
    };

    return (
        <motion.div layoutId={layoutId} className="inline-block">
            <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('create')}
            </Button>
        </motion.div>
    );
}
