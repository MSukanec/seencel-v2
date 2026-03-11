"use client";

/**
 * General Costs — Settings View
 *
 * Placeholder — las categorías ahora se gestionan desde la tab Conceptos.
 * Esta tab queda reservada para configuraciones futuras.
 */

import { Settings } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";

// ─── Component ───────────────────────────────────────────

export function GeneralCostsSettingsView() {
    return (
        <ViewEmptyState
            mode="empty"
            icon={Settings}
            viewName="Ajustes"
            featureDescription="Próximamente: configuraciones avanzadas para gastos generales."
        />
    );
}
