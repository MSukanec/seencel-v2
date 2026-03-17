"use client";

/**
 * General Costs — Settings View
 *
 * Placeholder — las categorías ahora se gestionan desde la tab Conceptos.
 * Esta tab queda reservada para configuraciones futuras.
 */

import { Settings } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentLayout } from "@/components/layout";

// ─── Component ───────────────────────────────────────────

export function GeneralCostsSettingsView() {
    return (
        <ContentLayout variant="narrow">
            <ViewEmptyState
                mode="empty"
                icon={Settings}
                viewName="Ajustes"
                featureDescription="Próximamente: configuraciones avanzadas para gastos generales."
            />
        </ContentLayout>
    );
}
