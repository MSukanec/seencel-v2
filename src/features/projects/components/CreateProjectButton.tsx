"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDrawer } from "@/providers/drawer-store";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { useTranslations } from "next-intl";

export function CreateProjectButton() {
    const { openDrawer } = useDrawer();
    const t = useTranslations('Project');
    const tForm = useTranslations('Project.form');

    const handleCreate = () => {
        openDrawer({
            title: tForm('createTitle'),
            description: tForm('description'),
            children: <ProjectForm mode="create" />
        });
    };

    return (
        <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
        </Button>
    );
}
