"use client";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Plus, Users } from "lucide-react";

interface CapitalParticipantsViewProps {
    participants: any[];
    organizationId: string;
}

export function CapitalParticipantsView({
    participants,
    organizationId,
}: CapitalParticipantsViewProps) {
    const handleCreate = () => {
        // TODO: Implementar modal de creación de participante
        console.log("Crear participante");
    };

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    {
                        label: "Nuevo Participante",
                        icon: Plus,
                        onClick: handleCreate,
                        variant: "default"
                    }
                ]}
            />
            <div className="h-full flex items-center justify-center">
                <ViewEmptyState
                    mode="empty"
                    icon={Users}
                    viewName="Participantes"
                    featureDescription="Esta sección permitirá gestionar los socios y participantes del capital."
                    onAction={handleCreate}
                    actionLabel="Nuevo Participante"
                />
            </div>
        </>
    );
}
