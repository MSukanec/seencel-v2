"use client";

import { ContentLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings } from "lucide-react";

interface MaterialsSettingsViewProps {
    projectId: string;
    orgId: string;
}

export function MaterialsSettingsView({ projectId, orgId }: MaterialsSettingsViewProps) {
    return (
        <ContentLayout variant="wide" className="pb-6">
            <EmptyState
                icon={Settings}
                title="Configuración de Materiales"
                description="Configura categorías, proveedores y preferencias de materiales."
            />
        </ContentLayout>
    );
}

