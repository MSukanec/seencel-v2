import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskParameters, getTaskKinds, getAllElements, getElementParameterLinks } from "@/features/tasks/queries";
import { getSystemMaterials, getMaterialCategories, getUnitsForMaterials, getMaterialCategoriesHierarchy, getSystemLaborCategories, getSystemLaborLevels, getSystemLaborRoles, getSystemLaborTypes, getUnitsForLabor, getSystemUnits, getSystemUnitCategories } from "@/features/admin/queries";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { TasksDivisionsView } from "@/features/tasks/views/tasks-divisions-view";
import { TasksParametersView } from "@/features/tasks/views/tasks-parameters-view";
import { TasksElementsView } from "@/features/tasks/views/tasks-elements-view";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { LaborCatalogView } from "@/features/labor/views/labor-catalog-view";
import { UnitsCatalogView } from "@/features/units/views/units-catalog-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Wrench, ClipboardList, Package, Shield, FolderTree, Settings2, Boxes, HardHat, Ruler } from "lucide-react";
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
        title: `Admin - ${t('title')} | Seencel`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// ============================================================================
// Page Component
// ============================================================================

/**
 * Admin Technical Catalog Page
 * Uses the SAME views as organization catalog but with isAdminMode=true:
 * - Tasks: can edit/delete ALL tasks including system tasks
 * - Materials: can create/edit/delete system materials
 */
export default async function AdminCatalogPage() {
    try {
        // Fetch all data in parallel
        const [
            groupedTasks,
            taskUnitsResult,
            divisionsResult,
            parametersResult,
            kindsResult,
            elementsResult,
            elementParameterLinksResult,
            systemMaterials,
            materialCategories,
            materialUnits,
            categoryHierarchy,
            systemLaborCategories,
            systemLaborLevels,
            systemLaborRoles,
            systemLaborTypes,
            laborUnits,
            systemUnits,
            systemUnitCategories
        ] = await Promise.all([
            getTasksGroupedByDivision("__SYSTEM__"), // Special flag for system-only tasks
            getUnits(),
            getTaskDivisions(), // No org filter - get all divisions
            getTaskParameters(), // Get all parameters with options
            getTaskKinds(), // Get all kinds for parametric tasks
            getAllElements(), // Get all elements for sidebar
            getElementParameterLinks(), // Get element-parameter links for filtering
            getSystemMaterials(),
            getMaterialCategories(),
            getUnitsForMaterials(),
            getMaterialCategoriesHierarchy(),
            getSystemLaborCategories(),
            getSystemLaborLevels(),
            getSystemLaborRoles(),
            getSystemLaborTypes(),
            getUnitsForLabor(),
            getSystemUnits(),
            getSystemUnitCategories()
        ]);

        // Transform system materials to match MaterialsCatalogView expected type
        const materialsForView = systemMaterials.map(m => ({
            ...m,
            organization_id: null as string | null
        }));

        // Transform categories to include parent_id
        const categoriesForView = materialCategories.map(c => ({
            ...c,
            name: c.name || '',
            parent_id: null as string | null
        }));

        // Transform units with abbreviation
        const unitsForView = materialUnits.map(u => ({
            id: u.id,
            name: u.name,
            abbreviation: ''
        }));


        // Transform category hierarchy to ensure name is string
        const categoryHierarchyForView = categoryHierarchy.map(c => ({
            ...c,
            name: c.name || ''
        }));

        // Calculate task counts by division for the Rubros view
        const taskCounts: Record<string, number> = {};
        groupedTasks.forEach(group => {
            if (group.division) {
                taskCounts[group.division.id] = group.tasks.length;
            }
        });

        return (
            <Tabs defaultValue="tasks" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Catálogo Técnico"
                    icon={<Wrench />}
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
                            <TabsTrigger value="tasks" className={tabTriggerClass}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Tareas
                            </TabsTrigger>
                            <TabsTrigger value="elements" className={tabTriggerClass}>
                                <Boxes className="h-4 w-4 mr-2" />
                                Elementos
                            </TabsTrigger>
                            <TabsTrigger value="parameters" className={tabTriggerClass}>
                                <Settings2 className="h-4 w-4 mr-2" />
                                Parámetros
                            </TabsTrigger>
                            <TabsTrigger value="materials" className={tabTriggerClass}>
                                <Package className="h-4 w-4 mr-2" />
                                Materiales
                            </TabsTrigger>
                            <TabsTrigger value="labor" className={tabTriggerClass}>
                                <HardHat className="h-4 w-4 mr-2" />
                                Mano de Obra
                            </TabsTrigger>
                            <TabsTrigger value="units" className={tabTriggerClass}>
                                <Ruler className="h-4 w-4 mr-2" />
                                Unidades
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksCatalogView
                                groupedTasks={groupedTasks}
                                orgId="" // No org - admin mode
                                units={taskUnitsResult.data}
                                divisions={divisionsResult.data}
                                kinds={kindsResult.data}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="materials" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <MaterialsCatalogView
                                materials={materialsForView}
                                units={unitsForView}
                                categories={categoriesForView}
                                categoryHierarchy={categoryHierarchyForView}
                                orgId="" // No org - admin mode
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="divisions" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionsView
                                divisions={divisionsResult.data}
                                isAdminMode={true}
                                taskCounts={taskCounts}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="elements" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksElementsView
                                elements={elementsResult.data}
                                parameters={parametersResult.data}
                                elementParameterLinks={elementParameterLinksResult.data}
                                units={taskUnitsResult.data}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="parameters" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksParametersView
                                parameters={parametersResult.data}
                                elements={elementsResult.data}
                                elementParameterLinks={elementParameterLinksResult.data}
                                materials={systemMaterials}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="labor" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <LaborCatalogView
                                laborCategories={systemLaborCategories}
                                laborLevels={systemLaborLevels}
                                laborRoles={systemLaborRoles}
                                laborTypes={systemLaborTypes}
                                units={laborUnits}
                                isAdminMode={true}
                            />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="units" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UnitsCatalogView
                                units={systemUnits}
                                categories={systemUnitCategories}
                                orgId=""
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
                    title="Error al cargar el catálogo"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
