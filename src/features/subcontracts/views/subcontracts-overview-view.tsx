"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

export function SubcontractsOverviewView() {
    return (
        <EmptyState
            icon={BarChart3}
            title="Visión General"
            description="Próximamente métricas y resumen de subcontratos"
        />
    );
}
