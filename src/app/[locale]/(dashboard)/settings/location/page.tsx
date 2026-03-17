import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationSettingsData } from "@/features/organization/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { OrganizationLocationManager } from "@/features/organization/components/location-manager";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Ubicación | Seencel",
        description: "Ubicación de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function LocationPage() {
    try {
        const { orgId } = await requireAuthContext();
        const data = await getOrganizationSettingsData(orgId);

        if ('error' in data || !data.organization) {
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar ubicación"
                        message="Organización no encontrada."
                        retryLabel="Reintentar"
                    />
                </div>
            );
        }

        return (
            <ContentLayout variant="narrow">
                <OrganizationLocationManager organization={data.organization} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar ubicación"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
