import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskActions, getTaskElements, getTaskCosts, getTaskUsageCounts } from "@/features/tasks/queries";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Tareas | Catálogo Técnico | Seencel",
    description: "Catálogo de tareas de construcción",
    robots: "noindex, nofollow",
};

export default async function CatalogTasksPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [
            groupedTasks,
            taskUnitsResult,
            divisionsResult,
            actionsResult,
            elementsResult,
            taskCostsMap,
            taskUsageMap,
        ] = await Promise.all([
            getTasksGroupedByDivision(orgId),
            getUnits(),
            getTaskDivisions(orgId),
            getTaskActions(),
            getTaskElements(),
            getTaskCosts(orgId),
            getTaskUsageCounts(orgId),
        ]);

        // Enrich tasks with cost data from task_costs_view
        const enrichedGroupedTasks = groupedTasks.map(group => ({
            ...group,
            tasks: group.tasks.map(task => {
                const cost = taskCostsMap.get(task.id);
                const usage = taskUsageMap.get(task.id);
                return {
                    ...task,
                    total_price: cost?.unit_cost ?? null,
                    price_valid_from: cost?.oldest_price_date ?? null,
                    recipe_count: cost?.recipe_count ?? 0,
                    usage_count: usage?.total ?? 0,
                    quote_usage_count: usage?.quote_count ?? 0,
                    construction_usage_count: usage?.construction_count ?? 0,
                };
            }),
        }));

        return (
            <ContentLayout variant="wide">
                <TasksCatalogView
                    groupedTasks={enrichedGroupedTasks}
                    orgId={orgId}
                    units={taskUnitsResult.data}
                    divisions={divisionsResult.data}
                    kinds={actionsResult.data}
                    elements={elementsResult.data}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar tareas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
