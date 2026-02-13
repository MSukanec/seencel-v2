import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Settings, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BackButton } from "@/components/shared/back-button";
import { TasksDetailGeneralView } from "@/features/tasks/views/detail/tasks-detail-general-view";
import { TasksDetailRecipeView } from "@/features/tasks/views/detail/tasks-detail-recipe-view";
import { getTaskById, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { getTaskRecipes, getRecipeResources } from "@/features/tasks/actions";
import { getAdminOrganizations } from "@/features/admin/queries";
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
        title: `${displayName} | Admin Catálogo | Seencel`,
        description: `Detalle de tarea: ${displayName}`,
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface TaskDetailPageProps {
    params: Promise<{ taskId: string }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component
// ============================================================================

export default async function AdminTaskDetailPage({ params, searchParams }: TaskDetailPageProps) {
    try {
        const { taskId } = await params;
        const { view = "general" } = await searchParams;

        // Fetch all data in parallel
        const [task, unitsRes, divisionsRes, organizations] = await Promise.all([
            getTaskById(taskId),
            getUnits(),
            getTaskDivisions(),
            getAdminOrganizations()
        ]);

        if (!task) {
            notFound();
        }

        // Fetch all recipes for this task + catalog data
        const taskOrgId = task.organization_id || "";
        const [recipes, catalogMaterials, catalogLaborTypes] = await Promise.all([
            getTaskRecipes(taskId),
            taskOrgId ? getMaterialsForOrganization(taskOrgId) : Promise.resolve([]),
            taskOrgId ? getLaborTypesWithPrices(taskOrgId) : Promise.resolve([]),
        ]);

        // Load resources for each recipe in parallel
        const resourcesEntries = await Promise.all(
            recipes.map(async (r) => {
                const resources = await getRecipeResources(r.id);
                return [r.id, resources] as const;
            })
        );
        const recipeResourcesMap = Object.fromEntries(resourcesEntries);

        const displayName = task.name || task.custom_name || "Tarea";
        const truncatedName = displayName.length > 60
            ? displayName.slice(0, 57) + "..."
            : displayName;

        const recipeCount = recipes.length;

        return (
            <Tabs defaultValue={view} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={truncatedName}
                    backButton={
                        <BackButton fallbackHref="/admin/catalog" />
                    }

                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="recipe" className="gap-2">
                                <Package className="h-4 w-4" />
                                Recetas
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {recipeCount}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* General Tab */}
                    <TabsContent value="general" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDetailGeneralView
                                task={task}
                                divisions={divisionsRes.data}
                                units={unitsRes.data}
                                organizationId={task.organization_id || ""}
                                isAdminMode={true}
                                organizations={organizations.map(org => ({ id: org.id, name: org.name }))}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Recipe Tab */}
                    <TabsContent value="recipe" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDetailRecipeView
                                task={task}
                                recipes={recipes}
                                recipeResourcesMap={recipeResourcesMap}
                                organizationId={task.organization_id || ""}
                                isAdminMode={true}
                                catalogMaterials={catalogMaterials}
                                catalogLaborTypes={catalogLaborTypes}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar la tarea"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
