import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { BackButton } from "@/components/shared/back-button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksRecipeDetailView } from "@/features/tasks/views/detail/tasks-recipe-detail-view";
import { getTaskById } from "@/features/tasks/queries";
import { getRecipeById, getRecipeResources } from "@/features/tasks/actions";
import { getMaterialsForOrganization } from "@/features/materials/queries";
import { getLaborTypesWithPrices } from "@/features/labor/actions";
import { getCurrencies } from "@/features/billing/queries";
import { getOrganizationContacts } from "@/features/clients/queries";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ taskId: string; recipeId: string }>;
}): Promise<Metadata> {
    const { taskId, recipeId } = await params;
    const [task, recipe] = await Promise.all([
        getTaskById(taskId),
        getRecipeById(recipeId),
    ]);
    const taskName = task?.name || task?.custom_name || "Tarea";
    const recipeName = recipe?.name || "Receta";

    return {
        title: `${recipeName} | ${taskName} | Catálogo | Seencel`,
        description: `Detalle de receta: ${recipeName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Page Component — Recipe Detail
// ============================================================================

interface RecipeDetailPageProps {
    params: Promise<{ taskId: string; recipeId: string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
    try {
        const { taskId, recipeId } = await params;
        const { orgId } = await requireAuthContext();
        if (!orgId) redirect("/");

        const [task, recipe, catalogMaterials, catalogLaborTypes, currencies, { data: contacts }] =
            await Promise.all([
                getTaskById(taskId),
                getRecipeById(recipeId),
                getMaterialsForOrganization(orgId),
                getLaborTypesWithPrices(orgId),
                getCurrencies(),
                getOrganizationContacts(orgId),
            ]);

        if (!task || !recipe) notFound();

        // Load recipe resources
        const resources = await getRecipeResources(recipeId);

        const recipeName = recipe.name || "Receta";
        const taskName = task.name || task.custom_name || "Tarea";

        return (
            <PageWrapper
                title={recipeName}
                backButton={
                    <BackButton
                        fallbackHref={`/organization/catalog/task/${taskId}/recipe`}
                    />
                }
                parentLabel={taskName}
            >
                <ContentLayout variant="wide">
                    <TasksRecipeDetailView
                        task={task}
                        recipe={recipe}
                        resources={resources}
                        organizationId={orgId}
                        catalogMaterials={catalogMaterials}
                        catalogLaborTypes={catalogLaborTypes}
                        currencies={currencies}
                        contacts={contacts}
                    />
                </ContentLayout>
            </PageWrapper>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar la receta"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
