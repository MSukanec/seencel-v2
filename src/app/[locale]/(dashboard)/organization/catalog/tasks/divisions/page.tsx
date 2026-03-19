import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getTaskDivisions, getTasksGroupedByDivision } from "@/features/tasks/queries";
import { TasksDivisionsView } from "@/features/tasks/views/tasks-divisions-view";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Rubros | Tareas | Catálogo Técnico | Seencel",
    description: "Gestión de rubros de tareas de construcción",
    robots: "noindex, nofollow",
};

export default async function CatalogTasksDivisionsPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [divisionsResult, groupedTasks] = await Promise.all([
            getTaskDivisions(orgId),
            getTasksGroupedByDivision(orgId),
        ]);

        // Calculate task counts by division
        const taskCounts: Record<string, number> = {};
        groupedTasks.forEach(group => {
            if (group.division) {
                taskCounts[group.division.id] = group.tasks.length;
            }
        });

        return (
            <ContentLayout variant="wide">
                <TasksDivisionsView
                    divisions={divisionsResult.data}
                    taskCounts={taskCounts}
                    organizationId={orgId}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar rubros"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
