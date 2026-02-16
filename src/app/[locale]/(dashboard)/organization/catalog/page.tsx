import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskActions, getTaskElements, getTaskCosts, getTaskUsageCounts } from "@/features/tasks/queries";
import { getMaterialsForOrganization, getMaterialCategoriesForCatalog, getUnitsForMaterialCatalog, getMaterialCategoryHierarchy, getProvidersForProject } from "@/features/materials/queries";
import { getUnitsForOrganization, getUnitCategories } from "@/features/units/queries";
import { getLaborTypesWithPrices } from "@/features/labor/actions";
import { getCurrencies } from "@/features/billing/queries";
import { getOrganizationContacts } from "@/features/clients/queries";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { TasksDivisionsView } from "@/features/tasks/views/tasks-divisions-view";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { LaborTypesView } from "@/features/labor/views/labor-types-view";
import { UnitsCatalogView } from "@/features/units/views/units-catalog-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Wrench, ClipboardList, Package, HardHat, Ruler, FolderTree } from "lucide-react";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
        title: `Catálogo Técnico | Seencel`,
        description: t('subtitle'),
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface CatalogPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

// ============================================================================
// Page Component
// ============================================================================

export default async function TechnicalCatalogPage({ params, searchParams }: CatalogPageProps) {
    try {
        const { activeOrgId } = await getUserOrganizations();
        const resolvedSearchParams = await searchParams;

        if (!activeOrgId) {
            redirect("/");
        }

        // Fetch all data in parallel
        const [
            groupedTasks,
            taskUnitsResult,
            divisionsResult,
            actionsResult,
            elementsResult,
            materials,
            materialCategories,
            materialUnits,
            categoryHierarchy,
            laborTypesWithPrices,
            currencies,
            providers,
            catalogUnits,
            unitCategories,
            taskCostsMap,
            taskUsageMap,
            { data: contacts },
        ] = await Promise.all([
            getTasksGroupedByDivision(activeOrgId),
            getUnits(),
            getTaskDivisions(activeOrgId),
            getTaskActions(),
            getTaskElements(),
            getMaterialsForOrganization(activeOrgId),
            getMaterialCategoriesForCatalog(),
            getUnitsForMaterialCatalog(),
            getMaterialCategoryHierarchy(),
            getLaborTypesWithPrices(activeOrgId),
            getCurrencies(),
            getProvidersForProject(activeOrgId),
            getUnitsForOrganization(activeOrgId),
            getUnitCategories(),
            getTaskCosts(activeOrgId),
            getTaskUsageCounts(activeOrgId),
            getOrganizationContacts(activeOrgId),
        ]);

        // Get default currency (first one or USD)
        const defaultCurrencyId = currencies[0]?.id || '';

        // Calculate task counts by division for the Rubros view
        const taskCounts: Record<string, number> = {};
        groupedTasks.forEach(group => {
            if (group.division) {
                taskCounts[group.division.id] = group.tasks.length;
            }
        });

        // Enrich tasks with cost data from task_costs_view
        const enrichedGroupedTasks = groupedTasks.map(group => ({
            ...group,
            tasks: group.tasks.map(task => {
                const cost = taskCostsMap.get(task.id);
                const usage = taskUsageMap.get(task.id);
                return {
                    ...task,
                    total_price: cost?.unit_cost ?? null,
                    price_valid_from: cost?.oldest_price_date ?? null,
                    recipe_count: cost?.recipe_count ?? 0,
                    usage_count: usage?.total ?? 0,
                    quote_usage_count: usage?.quote_count ?? 0,
                    construction_usage_count: usage?.construction_count ?? 0,
                };
            }),
        }));

        const activeTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'tasks';

        return (
            <Tabs defaultValue={activeTab} syncUrl="tab" className="h-full flex flex-col">
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
                            <TabsTrigger value="divisions" className={tabTriggerClass}>
                                <FolderTree className="h-4 w-4 mr-2" />
                                Rubros
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
                                groupedTasks={enrichedGroupedTasks}
                                orgId={activeOrgId}
                                units={taskUnitsResult.data}
                                divisions={divisionsResult.data}
                                kinds={actionsResult.data}
                                elements={elementsResult.data}
                            />
                        </ContentLayout>
                    </TabsContent>
                    <TabsContent value="divisions" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <TasksDivisionsView
                                divisions={divisionsResult.data}
                                taskCounts={taskCounts}
                                organizationId={activeOrgId}
                            />
                        </ContentLayout>
                    </TabsContent>
                    <TabsContent value="materials" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsCatalogView
                            materials={materials}
                            units={materialUnits}
                            categories={materialCategories}
                            categoryHierarchy={categoryHierarchy}
                            orgId={activeOrgId}
                            isAdminMode={false}
                            providers={providers}
                        />
                    </TabsContent>
                    <TabsContent value="labor" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <LaborTypesView
                            laborTypes={laborTypesWithPrices}
                            currencies={currencies}
                            orgId={activeOrgId}
                            defaultCurrencyId={defaultCurrencyId}
                        />
                    </TabsContent>
                    <TabsContent value="units" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UnitsCatalogView
                                units={catalogUnits}
                                categories={unitCategories}
                                orgId={activeOrgId}
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
