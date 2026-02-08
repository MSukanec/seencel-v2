"use client";

import { Plus, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/stores/modal-store";
import { OrganizationCreateForm } from "@/features/organization/forms/organization-create-form";

export function CreateOrganizationButton() {
    const { openModal } = useModal();

    const handleCreate = () => {
        openModal(
            <OrganizationCreateForm />,
            {
                title: "Crear nueva organización",
                description: "Creá una nueva organización para gestionar proyectos independientes con su propio equipo y configuración.",
                size: "md",
            }
        );
    };

    return (
        <Button
            variant="default"
            size="sm"
            onClick={handleCreate}
            className="gap-2"
        >
            <Plus className="h-4 w-4" />
            Crear Organización
        </Button>
    );
}
