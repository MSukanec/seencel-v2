import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/features/organization/queries";
import { getTasksGroupedByDivision, getUnits, getTaskDivisions, getTaskKinds } from "@/features/tasks/queries";
import { getMaterialsForOrganization, getMaterialCategoriesForCatalog, getUnitsForMaterialCatalog, getMaterialCategoryHierarchy, getProvidersForProject, getUnitPresentations } from "@/features/materials/queries";
import { getUnitsForOrganization, getUnitPresentationsForOrganization } from "@/features/units/queries";
import { getLaborTypesWithPrices } from "@/features/labor/actions";
import { getCurrencies } from "@/features/billing/queries";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { LaborTypesView } from "@/features/labor/views/labor-types-view";
import { UnitsCatalogView } from "@/features/units/views/units-catalog-view";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Wrench, ClipboardList, Package, HardHat, Ruler } from "lucide-react";
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
            kindsResult,
            materials,
            materialCategories,
            materialUnits,
            categoryHierarchy,
            laborTypesWithPrices,
            currencies,
            providers,
            presentations,
            catalogUnits,
            catalogPresentations
        ] = await Promise.all([
            getTasksGroupedByDivision(activeOrgId),
            getUnits(),
            getTaskDivisions(),
            getTaskKinds(),
            getMaterialsForOrganization(activeOrgId),
            getMaterialCategoriesForCatalog(),
            getUnitsForMaterialCatalog(),
            getMaterialCategoryHierarchy(),
            getLaborTypesWithPrices(activeOrgId),
            getCurrencies(),
            getProvidersForProject(activeOrgId),
            getUnitPresentations(),
            getUnitsForOrganization(activeOrgId),
            getUnitPresentationsForOrganization(activeOrgId)
        ]);

        // Get default currency (first one or USD)
        const defaultCurrencyId = currencies[0]?.id || '';

        const activeTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'tasks';

        return (
            <Tabs defaultValue={activeTab} className="h-full flex flex-col">
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
                                orgId={activeOrgId}
                                units={taskUnitsResult.data}
                                divisions={divisionsResult.data}
                                kinds={kindsResult.data}
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
                            presentations={presentations}
                        />
                    </TabsContent>
                    <TabsContent value="labor" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <LaborTypesView
                                laborTypes={laborTypesWithPrices}
                                currencies={currencies}
                                orgId={activeOrgId}
                                defaultCurrencyId={defaultCurrencyId}
                            />
                        </ContentLayout>
                    </TabsContent>
                    <TabsContent value="units" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <UnitsCatalogView
                            units={catalogUnits}
                            presentations={catalogPresentations}
                            orgId={activeOrgId}
                        />
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
