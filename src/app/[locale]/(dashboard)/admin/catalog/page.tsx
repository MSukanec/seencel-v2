import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskParameters, getTaskActions, getAllElements, getAllConstructionSystems, getTaskTemplates, getTemplateParameterLinks, getElementSystemLinks, getElementActionLinks, getSystemParameterLinks, getSystemParameterOptionLinks } from "@/features/tasks/queries";
import { getSystemMaterials } from "@/features/admin/queries";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { TasksDivisionsView } from "@/features/tasks/views/tasks-divisions-view";
import { TasksParametersView } from "@/features/tasks/views/tasks-parameters-view";
import { TasksElementsView } from "@/features/tasks/views/tasks-elements-view";
import { TasksSistemasView } from "@/features/tasks/views/tasks-sistemas-view";
import { TasksAccionesView } from "@/features/tasks/views/tasks-acciones-view";
import { TasksTemplatesView } from "@/features/tasks/views/tasks-templates-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Zap, Wrench, ClipboardList, Shield, FolderTree, Settings2, Boxes, LayoutTemplate } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Catalog' });

    return {
        title: `Admin - Tareas | Seencel`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// ============================================================================
// Page Component
// ============================================================================

/**
 * Admin Tasks Catalog Page
 * Tab order: Rubros > Acciones > Elementos > Sistemas > Plantillas > Parámetros > Tareas
 *
 * Full hierarchy:
 * Acciones → [task_element_actions] → Elementos → [task_element_systems] → Sistemas
 * Plantillas = acción + elemento + sistema + parámetros activados
 */
export default async function AdminCatalogPage() {
    try {
        const [
            groupedTasks,
            taskUnitsResult,
            divisionsResult,
            parametersResult,
            actionsResult,
            elementsResult,
            systemsResult,
            templatesResult,
            templateParameterLinksResult,
            elementSystemLinksResult,
            elementActionLinksResult,
            systemParameterLinksResult,
            systemParameterOptionLinksResult,
            systemMaterials,
        ] = await Promise.all([
            getTasksGroupedByDivision("__SYSTEM__"),
            getUnits(),
            getTaskDivisions("__SYSTEM__"),
            getTaskParameters(),
            getTaskActions(),
            getAllElements(),
            getAllConstructionSystems(),
            getTaskTemplates(),
            getTemplateParameterLinks(),
            getElementSystemLinks(),
            getElementActionLinks(),
            getSystemParameterLinks(),
            getSystemParameterOptionLinks(),
            getSystemMaterials(),
        ]);

        // Calculate task counts by division for the Rubros view
        const taskCounts: Record<string, number> = {};
        groupedTasks.forEach(group => {
            if (group.division) {
                taskCounts[group.division.id] = group.tasks.length;
            }
        });

        return (
            <Tabs defaultValue="divisions" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Tareas"
                    icon={<ClipboardList />}
                    actions={
                        <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Modo Admin
                        </Badge>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                            <TabsTrigger value="divisions" className={tabTriggerClass}>
                                <FolderTree className="h-4 w-4 mr-2" />
                                Rubros
                            </TabsTrigger>
                            <TabsTrigger value="actions" className={tabTriggerClass}>
                                <Zap className="h-4 w-4 mr-2" />
                                Acciones
                            </TabsTrigger>
                            <TabsTrigger value="elements" className={tabTriggerClass}>
                                <Boxes className="h-4 w-4 mr-2" />
                                Elementos
                            </TabsTrigger>
                            <TabsTrigger value="systems" className={tabTriggerClass}>
                                <Wrench className="h-4 w-4 mr-2" />
                                Sistemas
                            </TabsTrigger>
                            <TabsTrigger value="templates" className={tabTriggerClass}>
                                <LayoutTemplate className="h-4 w-4 mr-2" />
                                Plantillas
                            </TabsTrigger>
                            <TabsTrigger value="parameters" className={tabTriggerClass}>
                                <Settings2 className="h-4 w-4 mr-2" />
                                Parámetros
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className={tabTriggerClass}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Tareas
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="divisions" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionsView
                                divisions={divisionsResult.data}
                                isAdminMode={true}
                                taskCounts={taskCounts}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Acciones → Elementos (via task_element_actions) */}
                    <TabsContent value="actions" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksAccionesView
                                actions={actionsResult.data}
                                elements={elementsResult.data}
                                elementActionLinks={elementActionLinksResult.data}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Elementos → Sistemas (via task_element_systems) */}
                    <TabsContent value="elements" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksElementsView
                                elements={elementsResult.data}
                                systems={systemsResult.data}
                                elementSystemLinks={elementSystemLinksResult.data}
                                units={taskUnitsResult.data}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Sistemas Constructivos */}
                    <TabsContent value="systems" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksSistemasView
                                systems={systemsResult.data}
                                parameters={parametersResult.data}
                                systemParameterLinks={systemParameterLinksResult.data}
                                systemParameterOptionLinks={systemParameterOptionLinksResult.data}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* Plantillas → Parámetros (via task_template_parameters) */}
                    <TabsContent value="templates" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksTemplatesView
                                templates={templatesResult.data}
                                parameters={parametersResult.data}
                                templateParameterLinks={templateParameterLinksResult.data}
                                actions={actionsResult.data}
                                elements={elementsResult.data}
                                systems={systemsResult.data}
                                divisions={divisionsResult.data}
                                units={taskUnitsResult.data}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="parameters" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksParametersView
                                parameters={parametersResult.data}
                                elements={elementsResult.data}
                                elementParameterLinks={[]}
                                materials={systemMaterials}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksCatalogView
                                groupedTasks={groupedTasks}
                                orgId=""
                                units={taskUnitsResult.data}
                                divisions={divisionsResult.data}
                                kinds={actionsResult.data}
                                elements={elementsResult.data}
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
                    title="Error al cargar tareas"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
