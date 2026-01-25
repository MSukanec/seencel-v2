"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare } from "lucide-react";

export function SubcontractTasksView() {
    return (
        <EmptyState
            icon={CheckSquare}
            title="Tareas del Subcontrato"
            description="Próximamente podrás asignar y gestionar tareas vinculadas a este subcontrato."
        />
    );
}
