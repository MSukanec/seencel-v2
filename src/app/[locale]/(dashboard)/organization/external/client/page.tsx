import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { LayoutDashboard } from "lucide-react";
import { ClientOverviewView } from "@/features/clients/views/external/client-overview-view";

// ✅ METADATA OBLIGATORIA
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: `Portal de Cliente | SEENCEL`,
        description: "Vista general del portal de cliente",
        robots: "noindex, nofollow",
    };
}

export default async function ExternalClientPage() {
    try {
        // Future: Fetch client-specific data here
        // const clientData = await getExternalClientData(orgId, userId);

        return (
            <PageWrapper
                type="page"
                title="Portal de Cliente"
                icon={<LayoutDashboard className="h-5 w-5" />}
            >
                <ClientOverviewView />
            </PageWrapper>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Recargar"
                />
            </div>
        );
    }
}
