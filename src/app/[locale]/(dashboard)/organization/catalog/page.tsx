import { getUserOrganizations } from "@/features/organization/queries";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskKinds } from "@/features/tasks/queries";
import { getMaterialsForOrganization, getMaterialCategoriesForCatalog, getUnitsForMaterialCatalog, getMaterialCategoryHierarchy } from "@/features/materials/queries";
import { TasksCatalogView, DivisionsCatalogView } from "@/features/tasks/views";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Wrench, ClipboardList, Package, FolderTree } from "lucide-react";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface CatalogPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function TechnicalCatalogPage({ searchParams }: CatalogPageProps) {
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    // Fetch all data in parallel
    const [
        groupedTasks,
        taskUnitsResult,
        divisionsResult,
        kindsResult,
        materials,
        materialCategories,
        materialUnits,
        categoryHierarchy
    ] = await Promise.all([
        getTasksGroupedByDivision(activeOrgId),
        getUnits(),
        getTaskDivisions(),
        getTaskKinds(),
        getMaterialsForOrganization(activeOrgId),
        getMaterialCategoriesForCatalog(),
        getUnitsForMaterialCatalog(),
        getMaterialCategoryHierarchy()
    ]);

    const activeTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'tasks';

    return (
        <Tabs defaultValue={activeTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Catálogo Técnico"
                icon={<Wrench />}
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
                        <TabsTrigger value="materials" className={tabTriggerClass}>
                            <Package className="h-4 w-4 mr-2" />
                            Materiales
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="tasks" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <TasksCatalogView
                            groupedTasks={groupedTasks}
                            orgId={activeOrgId}
                            units={taskUnitsResult.data}
                            divisions={divisionsResult.data}
                            kinds={kindsResult.data}
                        />
                    </ContentLayout>
                </TabsContent>
                <TabsContent value="materials" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <MaterialsCatalogView
                            materials={materials}
                            units={materialUnits}
                            categories={materialCategories}
                            categoryHierarchy={categoryHierarchy}
                            orgId={activeOrgId}
                            isAdminMode={false}
                        />
                    </ContentLayout>
                </TabsContent>
                <TabsContent value="divisions" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <DivisionsCatalogView
                            divisions={divisionsResult.data}
                            isAdminMode={false}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}

