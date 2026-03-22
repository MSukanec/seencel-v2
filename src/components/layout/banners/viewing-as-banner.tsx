"use client";

import { useViewingAs, useIsViewingAs } from "@/stores/access-context-store";
import { useAccessContextStore } from "@/stores/access-context-store";
import { useOrganizationStore } from "@/stores/organization-store";
import { GlobalBanner } from "./global-banner";
import { EXTERNAL_ACTOR_TYPE_LABELS } from "@/features/team/types";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

/**
 * Banner "Viendo como" — aparece cuando un admin usa "Ver como este usuario"
 * desde la vista de equipo. El sidebar cambia temporalmente a los nav groups
 * del actor externo seleccionado.
 * 
 * Patrón idéntico a ImpersonationBanner pero con color diferente (blue vs amber).
 * Se posiciona debajo del ImpersonationBanner si ambos están activos.
 */
export function ViewingAsBanner() {
    const viewingAs = useViewingAs();
    const isViewingAs = useIsViewingAs();
    const isImpersonating = useOrganizationStore(state => state.isImpersonating);

    if (!isViewingAs || !viewingAs) return null;

    const actorLabel = EXTERNAL_ACTOR_TYPE_LABELS[viewingAs.actorType]?.label || viewingAs.actorType;

    const handleExit = () => {
        useAccessContextStore.getState().clearViewingAs();
    };

    const title = viewingAs.isSimulation
        ? `Simulador: Portal de ${viewingAs.actorType}`
        : `Viendo como: ${viewingAs.userName}`;
        
    const description = viewingAs.isSimulation
        ? `Estás previsualizando genéricamente lo que ve un ${viewingAs.actorType} en este proyecto.`
        : `Estás navegando la plataforma exactamente como lo hace este usuario externo.`;

    return (
        <GlobalBanner
            variant="context"
            icon={Eye}
            action={
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExit}
                    className="h-7 bg-blue-400/50 border-blue-300/30 text-white hover:bg-blue-400/80 hover:text-white text-xs shadow-none"
                >
                    <X className="h-3 w-3 mr-1" />
                    Salir
                </Button>
            }
        >
            <span>
                Viendo como: <strong>{viewingAs.userName}</strong>
                <span className="opacity-80 ml-1">({actorLabel})</span>
            </span>
        </GlobalBanner>
    );
}
