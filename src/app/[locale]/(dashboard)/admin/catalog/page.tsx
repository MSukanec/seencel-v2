import { getTasksGroupedByDivision, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { getSystemMaterials, getMaterialCategories, getUnitsForMaterials, getMaterialCategoriesHierarchy } from "@/features/admin/queries";
import { TaskCatalog } from "@/features/tasks/components/catalog/task-catalog";
import { MaterialCatalogView } from "@/features/materials/views";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Wrench, ClipboardList, Package, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

/**
 * Admin Technical Catalog Page
 * IDENTICAL to organization catalog but with full admin permissions:
 * - Can edit/delete ALL tasks (including system tasks)
 * - New tasks are created with is_system=true and NO organization_id
 */
export default async function AdminCatalogPage() {
    // Fetch all data in parallel
    const [
        groupedTasks,
        taskUnitsResult,
        divisionsResult,
        systemMaterials,
        materialCategories,
        materialUnits,
        categoryHierarchy
    ] = await Promise.all([
        getTasksGroupedByDivision("__SYSTEM__"), // Special flag for system-only tasks
        getUnits(),
        getTaskDivisions(), // No org filter - get all divisions
        getSystemMaterials(),
        getMaterialCategories(),
        getUnitsForMaterials(),
        getMaterialCategoriesHierarchy()
    ]);

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
                <ContentLayout variant="narrow" className="pb-6">
                    <TabsContent value="tasks" className="mt-0">
                        <TaskCatalog
                            groupedTasks={groupedTasks}
                            orgId="" // No org - admin mode
                            units={taskUnitsResult.data}
                            divisions={divisionsResult.data}
                            isAdminMode={true}
                        />
                    </TabsContent>

                    <TabsContent value="materials" className="mt-0">
                        <MaterialCatalogView
                            materials={systemMaterials}
                            units={materialUnits}
                            categories={materialCategories}
                            categoryHierarchy={categoryHierarchy}
                        />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
