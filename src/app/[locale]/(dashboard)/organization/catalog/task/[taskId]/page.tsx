import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Settings, Package } from "lucide-react";
import { getUserOrganizations } from "@/features/organization/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksDetailGeneralView } from "@/features/tasks/views/tasks-detail-general-view";
import { TasksDetailRecipeView } from "@/features/tasks/views/tasks-detail-recipe-view";
import { getTaskById, getTaskMaterials, getAvailableMaterials, getTaskDivisions, getTaskLabor, getAvailableLaborTypes } from "@/features/tasks/queries";

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
        title: `${displayName} | Catálogo | Seencel`,
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

export default async function TaskDetailPage({ params, searchParams }: TaskDetailPageProps) {
    try {
        const { taskId } = await params;
        const { view = "general" } = await searchParams;

        // Get current user's org using the standard helper
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) redirect("/");

        // Fetch task data
        const task = await getTaskById(taskId);
        if (!task) notFound();

        // Fetch related data in parallel
        const [taskMaterials, taskLabor, availableMaterials, availableLaborTypes, { data: divisions }] = await Promise.all([
            getTaskMaterials(taskId),
            getTaskLabor(taskId),
            getAvailableMaterials(task.is_system, activeOrgId),
            getAvailableLaborTypes(task.is_system, activeOrgId),
            getTaskDivisions(),
        ]);

        const displayName = task.name || task.custom_name || "Tarea";
        // Truncar título largo para el header
        const truncatedName = displayName.length > 60
            ? displayName.slice(0, 57) + "..."
            : displayName;

        // Total de items en la receta (materiales + mano de obra)
        const recipeItemCount = taskMaterials.length + taskLabor.length;

        return (
            <Tabs defaultValue={view} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={truncatedName}
                    backButton={
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href="/organization/catalog">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="recipe" className="gap-2">
                                <Package className="h-4 w-4" />
                                Receta
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {recipeItemCount}
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
                                divisions={divisions}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Recipe Tab */}
                    <TabsContent value="recipe" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDetailRecipeView
                                task={task}
                                taskMaterials={taskMaterials}
                                taskLabor={taskLabor}
                                availableMaterials={availableMaterials}
                                availableLaborTypes={availableLaborTypes}
                                isAdminMode={false}
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
