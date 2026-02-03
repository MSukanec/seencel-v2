import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { CapitalPageView } from "@/features/capital/views/capital-page-view";
import { Landmark } from "lucide-react";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: `Capital | Seencel`,
        description: "Gestión de aportes y retiros de capital de socios",
        robots: "noindex, nofollow",
    };
}

export default async function CapitalPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
        redirect('/');
    }

    try {
        const settingsData = await getOrganizationSettingsData(orgId);

        // TODO: Fetch capital data when DB tables are ready
        const movements: any[] = [];
        const participants: any[] = [];
        const wallets = (settingsData.contactWallets || []).map(w => ({
            id: w.id,
            wallet_name: w.wallet_name || ""
        }));

        return (
            <CapitalPageView
                title="Capital"
                movements={movements}
                participants={participants}
                wallets={wallets}
                organizationId={orgId}
                financialData={{
                    currencies: settingsData.contactCurrencies,
                    wallets: settingsData.contactWallets,
                }}
            />
        );
    } catch (error) {
        return (
            <PageWrapper type="page" title="Capital" icon={<Landmark />}>
                <ContentLayout variant="wide">
                    <ErrorDisplay
                        title="Error al cargar"
                        message={error instanceof Error ? error.message : "Error desconocido"}
                        retryLabel="Recargar"
                    />
                </ContentLayout>
            </PageWrapper>
        );
    }
}
