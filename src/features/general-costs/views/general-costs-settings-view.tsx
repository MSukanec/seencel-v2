"use client";

/**
 * General Costs — Settings View
 *
 * Placeholder — las categorías ahora se gestionan desde la tab Conceptos.
 * Esta tab queda reservada para configuraciones futuras.
 */

import { Settings } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { ContentLayout, PageIntro } from "@/components/layout";

// ─── Component ───────────────────────────────────────────

export function GeneralCostsSettingsView() {
    return (
        <ContentLayout variant="narrow">
            <div className="space-y-6">
                <PageIntro
                    icon={Settings}
                    title="Ajustes de Gastos Generales"
                    description="Configuración avanzada para la gestión de costos operativos de la empresa."
                />
                <ViewEmptyState
                    mode="empty"
                    icon={Settings}
                    viewName="Ajustes"
                    featureDescription="Próximamente: configuraciones avanzadas para gastos generales."
                />
            </div>
        </ContentLayout>
    );
}
