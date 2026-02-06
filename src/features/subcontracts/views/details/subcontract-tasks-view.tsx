"use client";

import { ViewEmptyState } from "@/components/shared/empty-state";
import { CheckSquare } from "lucide-react";

interface SubcontractTasksViewProps {
    subcontract: any;
    projectId: string;
}

export function SubcontractTasksView({ subcontract, projectId }: SubcontractTasksViewProps) {
    return (
        <div className="h-full flex items-center justify-center">
            <ViewEmptyState
                mode="empty"
                icon={CheckSquare}
                viewName="Tareas del Subcontrato"
                featureDescription="Próximamente podrás asignar y gestionar tareas vinculadas a este subcontrato."
                comingSoon
            />
        </div>
    );
}
