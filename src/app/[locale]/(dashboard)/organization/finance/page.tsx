import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getFinancialMovements } from "@/features/organization/queries";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getClientsByOrganization } from "@/features/clients/queries";
import { DollarSign } from "lucide-react";
import { redirect } from "next/navigation";

// Views - imported directly without intermediary
import { FinancesOverviewView } from "@/features/finance/views/finances-overview-view";
import { FinancesMovementsView } from "@/features/finance/views/finances-movements-view";
import { FinancesSettingsView } from "@/features/finance/views/finances-settings-view";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

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
        <Tabs defaultValue="overview" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={t('title')}
                icon={<DollarSign />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="overview" className={tabTriggerClass}>
                            {t('items.overview')}
                        </TabsTrigger>
                        <TabsTrigger value="payments" className={tabTriggerClass}>
                            Movimientos
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={tabTriggerClass}>
                            Configuración
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ContentLayout variant="wide">
                    {/* Overview Tab - View directly without intermediary */}
                    <TabsContent value="overview" className="m-0 h-full focus-visible:outline-none">
                        <FinancesOverviewView
                            movements={movements}
                            wallets={wallets}
                        />
                    </TabsContent>

                    {/* Payments/Movements Tab */}
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <FinancesMovementsView
                            movements={movements}
                            wallets={wallets}
                            projects={projects}
                            showProjectColumn={true}
                            organizationId={orgId}
                            currencies={orgCurrencies}
                            clients={clients}
                            financialData={financialData}
                        />
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="m-0 h-full focus-visible:outline-none">
                        <FinancesSettingsView
                            organizationId={orgId}
                            preferences={settingsData.preferences}
                            orgCurrencies={settingsData.contactCurrencies}
                            orgWallets={settingsData.contactWallets}
                            availableCurrencies={settingsData.availableCurrencies}
                            availableWallets={settingsData.availableWallets}
                            subscription={settingsData.subscription}
                        />
                    </TabsContent>
                </ContentLayout>
            </PageWrapper>
        </Tabs>
    );
}
