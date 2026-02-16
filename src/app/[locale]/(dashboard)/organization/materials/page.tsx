import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

import { MaterialsOverviewView } from "@/features/materials/views/materials-overview-view";
import { MaterialsRequirementsView } from "@/features/materials/views/materials-requirements-view";
import { MaterialsOrdersView } from "@/features/materials/views/materials-orders-view";
import { MaterialsPaymentsView } from "@/features/materials/views/materials-payments-view";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { MaterialsSettingsView } from "@/features/materials/views/materials-settings-view";

import { getUserOrganizations } from "@/features/organization/queries";
import {
    getOrgMaterialPayments,
    getOrgMaterialRequirements,
    getOrgPurchaseOrders,
    getProvidersForProject,
    getOrganizationFinancialData,
    getMaterialsForOrganization,
    getUnitsForMaterialCatalog,
    getMaterialCategoriesForCatalog,
    getMaterialCategoryHierarchy,
} from "@/features/materials/queries";
import { getOrgMaterialPurchasesAction, getMaterialTypes } from "@/features/materials/actions";

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    return {
        title: `Materiales | SEENCEL`,
        description: "Gestión de materiales, órdenes y pagos",
        robots: "noindex, nofollow",
    };
}

// ============================================================================
// Types
// ============================================================================

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================================================
// Page Component (Pattern A: Server → Views directas)
// ============================================================================

export default async function OrganizationMaterialsPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    try {
        const resolvedSearchParams = await searchParams;
        const defaultTab = resolvedSearchParams.view || "overview";

        const { activeOrgId } = await getUserOrganizations();

        if (!activeOrgId) {
            redirect("/");
        }

        // Fetch ALL org data in parallel (no project filter)
        const [
            payments,
            purchases,
            financialData,
            requirements,
            orders,
            providers,
            materialTypes,
            catalogMaterials,
            catalogUnits,
            catalogCategories,
            catalogCategoryHierarchy,
        ] = await Promise.all([
            getOrgMaterialPayments(activeOrgId),
            getOrgMaterialPurchasesAction(activeOrgId),
            getOrganizationFinancialData(activeOrgId),
            getOrgMaterialRequirements(activeOrgId),
            getOrgPurchaseOrders(activeOrgId),
            getProvidersForProject(activeOrgId),
            getMaterialTypes(activeOrgId),
            getMaterialsForOrganization(activeOrgId),
            getUnitsForMaterialCatalog(),
            getMaterialCategoriesForCatalog(),
            getMaterialCategoryHierarchy(),
        ]);

        // Check if catalog data is available
        const hasCatalogData = (catalogMaterials as any[]).length > 0 || (catalogCategories as any[]).length > 0;

        return (
            <Tabs defaultValue={defaultTab} syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Materiales"
                    icon={<Package />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="requirements">Necesidades</TabsTrigger>
                            <TabsTrigger value="orders">Órdenes de Compra</TabsTrigger>
                            <TabsTrigger value="payments">Pagos</TabsTrigger>
                            {hasCatalogData && (
                                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                            )}
                            <TabsTrigger value="settings">Ajustes</TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsOverviewView orgId={activeOrgId} payments={payments} />
                    </TabsContent>

                    <TabsContent value="requirements" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsRequirementsView orgId={activeOrgId} requirements={requirements} />
                    </TabsContent>

                    <TabsContent value="orders" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsOrdersView
                            orgId={activeOrgId}
                            orders={orders}
                            providers={providers}
                            financialData={financialData}
                            requirements={requirements}
                        />
                    </TabsContent>

                    <TabsContent value="payments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsPaymentsView
                            orgId={activeOrgId}
                            payments={payments}
                            purchases={purchases}
                            financialData={financialData}
                            materialTypes={materialTypes}
                        />
                    </TabsContent>

                    {hasCatalogData && (
                        <TabsContent value="catalog" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                            <MaterialsCatalogView
                                materials={catalogMaterials as any}
                                units={catalogUnits as any}
                                categories={catalogCategories as any}
                                categoryHierarchy={catalogCategoryHierarchy as any}
                                orgId={activeOrgId}
                                isAdminMode={false}
                                providers={providers}
                            />
                        </TabsContent>
                    )}

                    <TabsContent value="settings" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <MaterialsSettingsView materialTypes={materialTypes} organizationId={activeOrgId} />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar materiales"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
