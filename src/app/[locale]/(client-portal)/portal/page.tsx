import { redirect } from "next/navigation";
import { getMyClientPortals, getClientPortalData } from "@/features/clients/queries";
import { PortalShell } from "@/features/clients/components/portal/portal-shell";
import { ClientPortalSelector } from "@/features/clients/components/portal/client-portal-selector";
import { preparePortalProps } from "@/features/clients/components/portal/portal-constants";

export default async function AuthenticatedPortalPage() {
    // Get all client portals for the current user
    const { data: portals, error } = await getMyClientPortals();

    // If user has no portals, show empty state
    if (error || !portals || portals.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Sin acceso a portales</h1>
                    <p className="text-muted-foreground">
                        Tu cuenta no está asociada a ningún portal de cliente.
                        Si creés que esto es un error, contactá al administrador del proyecto.
                    </p>
                </div>
            </div>
        );
    }

    // Count total clients across all projects
    const totalClients = portals.reduce((sum, p) => sum + p.clients.length, 0);

    // If user has exactly one client, go directly to their portal
    if (totalClients === 1) {
        const singleProject = portals[0];
        const singleClient = singleProject.clients[0];

        // Fetch portal data for this client
        const rawData = await getClientPortalData(
            singleProject.project_id,
            singleClient.client_id
        );

        if (!rawData.project || !rawData.client || rawData.error) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">Error</h1>
                        <p className="text-muted-foreground">No se pudo cargar el portal.</p>
                    </div>
                </div>
            );
        }

        const { settings, branding, data } = preparePortalProps(rawData);

        return (
            <PortalShell
                mode="live"
                project={rawData.project}
                client={rawData.client}
                settings={settings}
                branding={branding}
                data={data}
                isAuthenticated={true}
            />
        );
    }

    // Multiple clients - show selector
    return <ClientPortalSelector portals={portals} />;
}
