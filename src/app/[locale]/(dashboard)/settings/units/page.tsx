import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getUnitsForOrganization } from "@/features/units/queries";
import { UnitsSettingsView } from "@/features/units/views/units-settings-view";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Unidades | Espacio de Trabajo | Seencel",
    description: "Unidades de medida de tu espacio de trabajo",
    robots: "noindex, nofollow",
};

export default async function CatalogUnitsPage() {
    try {
        const { orgId } = await requireAuthContext();

        const catalogUnits = await getUnitsForOrganization(orgId);

        return (
            <ContentLayout variant="narrow">
                <UnitsSettingsView
                    units={catalogUnits}
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
