import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProjectFinancialMovements, getProjectById } from "@/features/projects/queries";
import { getActiveOrganizationId } from "@/actions/general-costs";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { FinancesOverviewView } from "@/features/finance/components/views/finances-overview-view";
import { FinancesMovementsView } from "@/features/finance/components/views/finances-movements-view";
import { FinancesSettingsView } from "@/features/finance/components/views/finances-settings-view";
import { DollarSign } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });
    return {
        title: `${t('title')} | SEENCEL`,
        description: t('description'),
        robots: "noindex, nofollow",
    };
}

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

export default async function ProjectFinancePage({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
    const { locale, projectId } = await params;
    const t = await getTranslations({ locale, namespace: 'MegaMenu.Finance' });

    // Validate Project Existence
    const project = await getProjectById(projectId);
    if (!project) return notFound();

    const orgId = await getActiveOrganizationId();
    if (!orgId) {
        redirect('/');
    }

    const [movementsData, settingsData] = await Promise.all([
        getProjectFinancialMovements(projectId),
        getOrganizationSettingsData(orgId)
    ]);

    const { movements, error } = movementsData;

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
                <ContentLayout variant="wide" className="pb-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none">
                        <FinancesOverviewView movements={movements} wallets={settingsData.contactWallets?.map(w => ({ id: w.wallet_id, wallet_name: w.wallet_name || '' })) || []} />
                    </TabsContent>
                    <TabsContent value="payments" className="m-0 h-full focus-visible:outline-none">
                        <FinancesMovementsView movements={movements} wallets={settingsData.contactWallets?.map(w => ({ id: w.wallet_id, wallet_name: w.wallet_name || '' })) || []} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 focus-visible:outline-none">
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
