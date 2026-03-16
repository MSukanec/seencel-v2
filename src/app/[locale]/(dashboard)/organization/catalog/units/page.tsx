import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getUnitsForOrganization, getUnitCategories } from "@/features/units/queries";
import { UnitsCatalogView } from "@/features/units/views/units-catalog-view";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Unidades | Catálogo Técnico | Seencel",
    description: "Unidades de medida del catálogo técnico",
    robots: "noindex, nofollow",
};

export default async function CatalogUnitsPage() {
    try {
        const { orgId } = await requireAuthContext();

        const [catalogUnits, unitCategories] = await Promise.all([
            getUnitsForOrganization(orgId),
            getUnitCategories(),
        ]);

        return (
            <ContentLayout variant="wide">
                <UnitsCatalogView
                    units={catalogUnits}
                    categories={unitCategories}
                    orgId={orgId}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar unidades"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
