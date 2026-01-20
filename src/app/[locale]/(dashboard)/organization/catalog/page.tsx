import { getUserOrganizations } from "@/features/organization/queries";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions } from "@/features/tasks/queries";
import { TaskCatalog } from "@/features/tasks/components/catalog/task-catalog";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { Wrench, ClipboardList, Package } from "lucide-react";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function TechnicalCatalogPage() {
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        redirect("/");
    }

    const [groupedTasks, unitsResult, divisionsResult] = await Promise.all([
        getTasksGroupedByDivision(activeOrgId),
        getUnits(),
        getTaskDivisions(activeOrgId)
    ]);

    return (
        <Tabs defaultValue="tasks" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Catálogo Técnico"
                icon={<Wrench />}
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
                <ContentLayout variant="wide" className="pb-6">
                    <TabsContent value="tasks" className="mt-0">
                        <TaskCatalog
                            groupedTasks={groupedTasks}
                            orgId={activeOrgId}
                            units={unitsResult.data}
                            divisions={divisionsResult.data}
                        />
                    </TabsContent>

                    <TabsContent value="materials" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Catálogo de Materiales</CardTitle>
                                <CardDescription>
                                    Gestiona los materiales disponibles para tus presupuestos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Próximamente</p>
                                    <p className="text-sm">
                                        El catálogo de materiales estará disponible pronto
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
