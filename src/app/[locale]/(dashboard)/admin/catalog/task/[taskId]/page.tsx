import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Settings, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TasksDetailGeneralView } from "@/features/tasks/views/tasks-detail-general-view";
import { TasksDetailRecipeView } from "@/features/tasks/views/tasks-detail-recipe-view";
import { getTaskById, getTaskMaterials, getAvailableMaterials, getUnits, getTaskDivisions, getTaskLabor, getAvailableLaborTypes } from "@/features/tasks/queries";
import { getAdminOrganizations } from "@/features/admin/queries";

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
        const [task, taskMaterials, taskLabor, availableMaterials, availableLaborTypes, unitsRes, divisionsRes, organizations] = await Promise.all([
            getTaskById(taskId),
            getTaskMaterials(taskId),
            getTaskLabor(taskId),
            getAvailableMaterials(true), // System tasks only
            getAvailableLaborTypes(true), // System labor types only
            getUnits(),
            getTaskDivisions(),
            getAdminOrganizations()
        ]);

        if (!task) {
            notFound();
        }

        // Admin can view any task (system or org-specific)

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
                            <Link href="/admin/catalog">
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
                                divisions={divisionsRes.data}
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
                                taskMaterials={taskMaterials}
                                taskLabor={taskLabor}
                                availableMaterials={availableMaterials}
                                availableLaborTypes={availableLaborTypes}
                                isAdminMode={true}
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
