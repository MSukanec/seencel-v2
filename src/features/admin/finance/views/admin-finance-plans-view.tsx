"use client";

import { PieChart } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";

/**
 * Admin Finance Plans View
 * Placeholder - pricing tiers configuration
 */
export function AdminFinancePlansView() {
    return (
        <div className="h-full flex items-center justify-center">
            <ViewEmptyState
                mode="empty"
                icon={PieChart}
                viewName="Planes de Precios"
                featureDescription="Configuración de Tiers (Free, Pro, Enterprise)."
                comingSoon
            />
        </div>
    );
}
