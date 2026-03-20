import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getMaterialsForOrganization, getMaterialCategoriesForCatalog, getUnitsForMaterialCatalog, getMaterialCategoryHierarchy, getProvidersForProject } from "@/features/materials/queries";
import { MaterialsCatalogView } from "@/features/materials/views/materials-catalog-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ContentLayout } from "@/components/layout";

export const metadata: Metadata = {
    title: "Materiales | Catálogo Técnico | Seencel",
    description: "Catálogo de materiales de construcción",
    robots: "noindex, nofollow",
};

export default async function CatalogMaterialsPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [
            materials,
            materialCategories,
            materialUnits,
            categoryHierarchy,
            providers,
        ] = await Promise.all([
            getMaterialsForOrganization(orgId),
            getMaterialCategoriesForCatalog(),
            getUnitsForMaterialCatalog(),
            getMaterialCategoryHierarchy(),
            getProvidersForProject(orgId),
        ]);

        return (
            <ContentLayout variant="wide">
                <MaterialsCatalogView
                    materials={materials}
                    units={materialUnits}
                    categories={materialCategories}
                    categoryHierarchy={categoryHierarchy}
                    orgId={orgId}
                    isAdminMode={false}
                    providers={providers}
                />
            </ContentLayout>
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
