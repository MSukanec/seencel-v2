"use client";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";

export function SubcontractsOverviewView() {
    return (
        <ViewEmptyState
            mode="empty"
            icon={BarChart3}
            viewName="Visión General"
            featureDescription="Próximamente métricas y resumen de subcontratos"
            comingSoon
        />
    );
}
