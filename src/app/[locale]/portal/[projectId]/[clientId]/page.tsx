import { getClientPortalData } from "@/features/clients/queries";
import { PortalShell } from "@/features/clients/components/portal/portal-shell";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        projectId: string;
        clientId: string;
    }>;
}

// Default branding values
const DEFAULT_BRANDING = {
    portal_name: null,
    welcome_message: 'Bienvenido a tu portal',
    primary_color: '#83cc16',
    background_color: '#09090b',
    show_hero: true,
    show_footer: true,
    footer_text: null,
    show_powered_by: true,
};

export default async function PublicClientPortalPage({ params }: PageProps) {
    const { projectId, clientId } = await params;

    const data = await getClientPortalData(projectId, clientId);

    if (!data.project || !data.client || data.error) {
        notFound();
    }

    // Default settings if none exist
    const settings = data.settings || {
        show_dashboard: true,
        show_installments: false,
        show_payments: false,
        show_logs: false,
        show_amounts: true,
        show_progress: true,
        allow_comments: false,
    };

    // Merge branding with defaults
    const branding = data.branding
        ? { ...DEFAULT_BRANDING, ...data.branding }
        : DEFAULT_BRANDING;

    return (
        <PortalShell
            mode="live"
            project={data.project}
            client={data.client}
            settings={settings}
            branding={branding}
            data={{
                payments: data.payments,
                schedules: data.schedules,
                summary: data.summary,
                logs: data.logs || []
            }}
        />
    );
}
