"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare } from "lucide-react";

interface SubcontractTasksViewProps {
    subcontract: any;
    projectId: string;
}

export function SubcontractTasksView({ subcontract, projectId }: SubcontractTasksViewProps) {
    return (
        <div className="h-full flex items-center justify-center">
            <EmptyState
                icon={CheckSquare}
                title="Tareas del Subcontrato"
                description="Próximamente podrás asignar y gestionar tareas vinculadas a este subcontrato."
            />
        </div>
    );
}
