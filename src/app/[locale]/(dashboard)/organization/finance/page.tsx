import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { getFinancialMovements } from "@/features/organization/queries";
import { getActiveOrganizationId } from "@/actions/general-costs";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { FinancePageClient } from "@/features/finance/components/views/finance-page-client";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

export default async function FinancePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
        redirect('/');
    }

    const [movementsData, settingsData] = await Promise.all([
        getFinancialMovements(),
        getOrganizationSettingsData(orgId)
    ]);

    const { movements, wallets, projects, error } = movementsData;

    if (error || !movements) {
        return (
            <PageWrapper type="page" title={t('title')} icon={<DollarSign />}>
                <ContentLayout variant="wide">
                    <ErrorDisplay
                        title="Error al cargar contenidos"
                        message={typeof error === 'string' ? error : "Error desconocido"}
                        retryLabel="Recargar"
                    />
                </ContentLayout>
            </PageWrapper>
        );
    }

    return (
        <FinancePageClient
            title={t('title')}
            movements={movements}
            wallets={wallets}
            projects={projects}
            organizationId={orgId}
            settingsData={{
                preferences: settingsData.preferences,
                contactCurrencies: settingsData.contactCurrencies,
                contactWallets: settingsData.contactWallets,
                availableCurrencies: settingsData.availableCurrencies,
                availableWallets: settingsData.availableWallets,
                subscription: settingsData.subscription,
            }}
            tabLabels={{
                overview: t('items.overview'),
                movements: "Movimientos",
                settings: "Configuración"
            }}
        />
    );
}
