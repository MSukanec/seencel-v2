import type { Metadata } from "next";
import { MaterialsPageView } from "@/features/materials/views/materials-page";
import { getUserOrganizations, getOrganizationFinancialData } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import {
    getMaterialPayments,
    getProjectMaterialRequirements,
    getPurchaseOrders,
    getProvidersForProject
} from "@/features/materials/queries";
import { getMaterialPurchasesAction, getMaterialTypes } from "@/features/materials/actions";
import { getSystemMaterials, getMaterialCategories, getUnitsForMaterials, getMaterialCategoriesHierarchy } from "@/features/admin/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { notFound } from "next/navigation";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: Promise<{ projectId: string; locale: string }>
}): Promise<Metadata> {
    const { projectId } = await params;
    const project = await getProjectById(projectId);

    return {
        title: project ? `Materiales - ${project.name} | Seencel` : "Materiales | Seencel",
        description: "Gestión de materiales, órdenes y pagos del proyecto",
        robots: "noindex, nofollow", // Private dashboard
    };
}

// ============================================
// PAGE PROPS
// ============================================
interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{ view?: string }>;
}

// ============================================
// PAGE COMPONENT (Server Component)
// ============================================
export default async function MaterialsPage({ params, searchParams }: PageProps) {
    const { projectId } = await params;
    const resolvedSearchParams = await searchParams;
    const defaultTab = resolvedSearchParams.view || "overview";

    // Get active organization
    const { activeOrgId } = await getUserOrganizations();

    if (!activeOrgId) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Sin organización activa"
                    message="No se pudo determinar la organización activa."
                    retryLabel="Reintentar"
                />
            </div>
        );
    }

    // Validate project exists
    const project = await getProjectById(projectId);

    if (!project) {
        notFound();
    }

    // Validate project belongs to active org
    if (project.organization_id !== activeOrgId) {
        notFound();
    }

    // Fetch data for all tabs - payments are used for dashboard KPIs via useMoney().sum()
    const [
        payments,
        purchases,
        financialData,
        requirements,
        orders,
        providers,
        materialTypes,
        // Catalog data
        catalogMaterials,
        catalogUnits,
        catalogCategories,
        catalogCategoryHierarchy
    ] = await Promise.all([
        getMaterialPayments(projectId),
        getMaterialPurchasesAction(projectId),
        getOrganizationFinancialData(activeOrgId),
        getProjectMaterialRequirements(projectId),
        getPurchaseOrders(projectId),
        getProvidersForProject(activeOrgId),
        getMaterialTypes(activeOrgId),
        // Catalog queries
        getSystemMaterials(),
        getUnitsForMaterials(),
        getMaterialCategories(),
        getMaterialCategoriesHierarchy()
    ]);

    return (
        <MaterialsPageView
            projectId={projectId}
            orgId={activeOrgId}
            defaultTab={defaultTab}
            payments={payments}
            purchases={purchases}
            financialData={financialData}
            requirements={requirements}
            orders={orders}
            providers={providers}
            materialTypes={materialTypes}
            // Catalog props - using type assertions since admin queries return compatible structures
            catalogMaterials={catalogMaterials as any}
            catalogUnits={catalogUnits as any}
            catalogCategories={catalogCategories as any}
            catalogCategoryHierarchy={catalogCategoryHierarchy as any}
        />
    );
}

