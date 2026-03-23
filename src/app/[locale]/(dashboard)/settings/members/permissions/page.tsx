import type { Metadata } from "next";
import { ContentLayout } from "@/components/layout";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TeamPermissionsView } from "@/features/team/views/team-permissions-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Permisos | Seencel",
        description: "Gestión de permisos de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function PermissionsPage() {
    try {
        const { orgId } = await requireAuthContext();
        const data = await getOrganizationSettingsData(orgId);

        return (
            <ContentLayout variant="narrow">
                <TeamPermissionsView
                    organizationId={orgId}
                    roles={data.roles}
                    permissions={data.permissions}
                    rolePermissions={data.rolePermissions}
                />
            </ContentLayout>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar permisos"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
