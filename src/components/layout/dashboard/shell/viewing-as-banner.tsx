"use client";

import { useViewingAs, useIsViewingAs } from "@/stores/access-context-store";
import { useAccessContextStore } from "@/stores/access-context-store";
import { useOrganizationStore } from "@/stores/organization-store";
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

    return (
        <div className={`fixed ${isImpersonating ? 'top-9' : 'top-0'} left-0 right-0 z-[99] bg-blue-500 dark:bg-blue-600 text-white px-4 py-1.5 flex items-center justify-center gap-3 text-sm font-medium shadow-md`}>
            <Eye className="h-4 w-4 shrink-0" />
            <span>
                Viendo como: <strong>{viewingAs.userName}</strong>
                <span className="opacity-80 ml-1">({actorLabel})</span>
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExit}
                className="h-7 bg-blue-400/50 border-blue-300/30 text-white hover:bg-blue-400/80 hover:text-white text-xs"
            >
                <X className="h-3 w-3 mr-1" />
                Salir
            </Button>
        </div>
    );
}
