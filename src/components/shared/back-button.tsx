"use client";

import { useRouter } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { PageHeaderButton } from "@/components/layout/dashboard/header/page-header-button";

/**
 * BackButton — Botón que navega al historial anterior del browser.
 * 
 * Uso: como `backButton` prop en PageWrapper para páginas de detalle
 * donde el usuario puede llegar desde múltiples orígenes.
 * 
 * Si no hay historial previo (acceso directo), usa `fallbackHref` como destino.
 */
export function BackButton({ fallbackHref }: { fallbackHref?: string }) {
    const router = useRouter();

    const handleBack = () => {
        // Si hay historial, volver atrás
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else if (fallbackHref) {
            // Si no hay historial (acceso directo), ir al fallback
            router.push(fallbackHref as any);
        }
    };

    return (
        <PageHeaderButton
            className="mr-2 -ml-1 cursor-pointer"
            onClick={handleBack}
            title="Volver atrás"
        >
            <ArrowLeft className="h-4 w-4" />
        </PageHeaderButton>
    );
}
