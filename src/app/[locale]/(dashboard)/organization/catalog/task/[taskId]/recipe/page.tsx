import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksDetailRecipeView } from "@/features/tasks/views/detail/tasks-detail-recipe-view";
import { getTaskById } from "@/features/tasks/queries";
import { getTaskRecipes } from "@/features/tasks/actions";
import { getMaterialsForOrganization } from "@/features/materials/queries";
import { getLaborTypesWithPrices } from "@/features/labor/actions";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ taskId: string }>
}): Promise<Metadata> {
    const { taskId } = await params;
    const task = await getTaskById(taskId);
    const displayName = task?.name || task?.custom_name || "Tarea";

    return {
        title: `Recetas | ${displayName} | Catálogo | Seencel`,
        description: `Recetas de la tarea: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component — Recipe Tab (List)
// ============================================================================

interface RecipePageProps {
    params: Promise<{ taskId: string }>;
}

export default async function TaskDetailRecipePage({ params }: RecipePageProps) {
    try {
        const { taskId } = await params;
        const { orgId } = await requireAuthContext();
        if (!orgId) redirect("/");

        const [task, recipes, catalogMaterials, catalogLaborTypes] = await Promise.all([
            getTaskById(taskId),
            getTaskRecipes(taskId),
            getMaterialsForOrganization(orgId),
            getLaborTypesWithPrices(orgId),
        ]);

        if (!task) notFound();

        return (
            <ContentLayout variant="wide">
                <TasksDetailRecipeView
                    task={task}
                    recipes={recipes}
                    organizationId={orgId}
                    isAdminMode={false}
                    catalogMaterials={catalogMaterials}
                    catalogLaborTypes={catalogLaborTypes}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar las recetas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
