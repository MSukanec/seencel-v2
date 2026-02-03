import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { getFinancialMovements } from "@/features/organization/queries";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getClientsByOrganization } from "@/features/clients/queries";
import { FinancePageClient } from "@/features/finance/views/finances-page";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });
    return {
        title: `${t('title')} | Seencel`,
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

    const [movementsData, settingsData, clientsData] = await Promise.all([
        getFinancialMovements(),
        getOrganizationSettingsData(orgId),
        getClientsByOrganization(orgId)
    ]);

    const { movements, wallets, projects, error } = movementsData;
    const clients = clientsData.data || [];

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

    // Build financialData object for client payment form
    // IMPORTANT: Use org-specific data, NOT global lists
    // - wallets: org wallets from movements query
    // - currencies: contactCurrencies (org-specific), NOT availableCurrencies (global)
    const orgCurrencies = (settingsData.contactCurrencies || []).map((c: any) => ({
        id: c.currency_id || c.id,
        code: c.currency_code || c.code,
        symbol: c.currency_symbol || c.symbol,
        name: c.currency_name || c.name,
    }));

    const financialData = {
        wallets: wallets || [],
        currencies: orgCurrencies,
        defaultWalletId: wallets?.[0]?.id || null,
        defaultCurrencyId: orgCurrencies[0]?.id || null,
    };

    return (
        <FinancePageClient
            title={t('title')}
            movements={movements}
            wallets={wallets}
            projects={projects}
            organizationId={orgId}
            clients={clients}
            financialData={financialData}
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

