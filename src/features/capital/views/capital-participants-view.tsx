"use client";

import { EmptyState } from "@/components/ui/empty-state";
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
                <EmptyState
                    icon={Users}
                    title="Participantes"
                    description="Esta sección permitirá gestionar los socios y participantes del capital. Próximamente."
                />
            </div>
        </>
    );
}
