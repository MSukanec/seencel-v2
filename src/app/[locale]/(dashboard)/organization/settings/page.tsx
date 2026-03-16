import type { Metadata } from "next";
import { getOrganizationSettingsData } from "@/features/organization/queries";
import { ErrorDisplay } from "@/components/ui/error-display";
import { OrganizationDetailsForm } from "@/features/organization/components/forms/organization-details-form";
import { ContentLayout } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Configuración | Seencel",
        description: "Configuración de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function SettingsPage() {
    try {
        const { orgId } = await requireAuthContext();
        const data = await getOrganizationSettingsData(orgId);
        const organization = data.organization;

        if (!organization) {
            return (
                <ContentLayout variant="settings">
                    <div className="p-8">Organization not found.</div>
                </ContentLayout>
            );
        }

        return (
            <ContentLayout variant="settings">
                <OrganizationDetailsForm organization={organization} />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <ContentLayout variant="settings">
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Error al cargar configuración"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Reintentar"
                    />
                </div>
            </ContentLayout>
        );
    }
}
