import { getClientPortalData } from "@/features/clients/queries";
import { PortalShell } from "@/features/clients/components/portal/portal-shell";
import { preparePortalProps } from "@/features/clients/components/portal/portal-constants";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        projectId: string;
        clientId: string;
    }>;
}

export default async function PublicClientPortalPage({ params }: PageProps) {
    const { projectId, clientId } = await params;

    const rawData = await getClientPortalData(projectId, clientId);

    if (!rawData.project || !rawData.client || rawData.error) {
        notFound();
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
        />
    );
}
