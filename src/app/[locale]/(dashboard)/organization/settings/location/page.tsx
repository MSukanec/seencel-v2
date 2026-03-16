import type { Metadata } from "next";
import { getDashboardData } from "@/features/organization/queries";
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
        const data = await getDashboardData();
        const organization = data.organization;

        if (!organization) {
            return <div className="p-8">Organization not found.</div>;
        }

        return <OrganizationLocationManager organization={organization} />;
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
