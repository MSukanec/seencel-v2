"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";

export function CreateOrganizationButton() {
    const router = useRouter();

    const handleCreate = () => {
        router.push({ pathname: "/workspace-setup", query: { new: "true" } } as any);
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
