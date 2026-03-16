import type { Metadata } from "next";
import { getUserOrganizations } from "@/features/organization/queries";
import { checkIsAdmin } from "@/features/users/queries";
import { ProfileOrganizationsView } from "@/features/users/views/profile-organizations-view";
import { ErrorDisplay } from "@/components/ui/error-display";

export const metadata: Metadata = {
    title: "Organizaciones | SEENCEL",
    robots: "noindex, nofollow",
};

export default async function ProfileOrganizationsPage() {
    try {
        const [orgData, isAdmin] = await Promise.all([
            getUserOrganizations(),
            checkIsAdmin(),
        ]);

        const { organizations, activeOrgId, currentUserId } = orgData;

        return (
            <ProfileOrganizationsView
                organizations={organizations}
                activeOrgId={activeOrgId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar organizaciones"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
