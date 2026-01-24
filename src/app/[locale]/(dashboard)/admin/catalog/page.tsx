import { getTasksGroupedByDivision, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { getSystemMaterials, getMaterialCategories, getUnitsForMaterials, getMaterialCategoriesHierarchy } from "@/features/admin/queries";
import { TasksCatalogView } from "@/features/tasks/views";
import { MaterialsCatalogView } from "@/features/materials/views";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Wrench, ClipboardList, Package, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

/**
 * Admin Technical Catalog Page
 * Uses the SAME views as organization catalog but with isAdminMode=true:
 * - Tasks: can edit/delete ALL tasks including system tasks
 * - Materials: can create/edit/delete system materials
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
                <TabsContent value="tasks" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <TasksCatalogView
                            groupedTasks={groupedTasks}
                            orgId="" // No org - admin mode
                            units={taskUnitsResult.data}
                            divisions={divisionsResult.data}
                            isAdminMode={true}
                        />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="materials" className="m-0 h-full focus-visible:outline-none">
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
            </PageWrapper>
        </Tabs>
    );
}
