"use client";

import { PieChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Admin Finance Plans View
 * Placeholder - pricing tiers configuration
 */
export function AdminFinancePlansView() {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={PieChart}
                title="Planes de Precios"
                description="Configuración de Tiers (Free, Pro, Enterprise). Próximamente."
            />
        </div>
    );
}
