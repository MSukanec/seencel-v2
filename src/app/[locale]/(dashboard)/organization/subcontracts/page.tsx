import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubcontractsOverviewView } from "@/features/subcontracts/views/subcontracts-overview-view";
import { SubcontractsListView } from "@/features/subcontracts/views/subcontracts-list-view";
import { SubcontractsPaymentsView } from "@/features/subcontracts/views/subcontracts-payments-view";
import { getOrganizationFinancialData, getUserOrganizations } from "@/features/organization/queries";
import { getSubcontractsByOrganization, getSubcontractPaymentsByOrganization } from "@/features/subcontracts/queries";
import { getIndexTypes } from "@/features/advanced/queries";
import { getOrganizationContacts } from "@/actions/contacts";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Subcontracts' });
    return {
        title: `${t('title', { default: 'Subcontratos' })} | Seencel`,
        description: t('subtitle', { default: 'Gestión de Subcontratos' }),
        robots: "noindex, nofollow",
    };
}

export default async function SubcontractsPage({ params }: { params: Promise<{ locale: string }> }) {
    await params;
    const t = await getTranslations('Subcontracts');

    try {
        const { activeOrgId } = await getUserOrganizations();

        if (!activeOrgId) {
            redirect("/");
        }

        // Fetch Data in Parallel
        const [financialData, providers, subcontracts, payments, indexTypes] = await Promise.all([
            getOrganizationFinancialData(activeOrgId),
            getOrganizationContacts(activeOrgId),
            getSubcontractsByOrganization(activeOrgId),
            getSubcontractPaymentsByOrganization(activeOrgId),
            getIndexTypes(activeOrgId)
        ]);

        return (
            <Tabs defaultValue="list" syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={t('title', { default: 'Subcontratos' })}
                    icon={<Handshake />}
                    className="h-full"
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="list">Subcontratos</TabsTrigger>
                            <TabsTrigger value="payments">Pagos</TabsTrigger>
                        </TabsList>
                    }
                >
                    {/* TAB: OVERVIEW */}
                    <TabsContent
                        value="overview"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsOverviewView />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: LIST */}
                    <TabsContent
                        value="list"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsListView
                                organizationId={activeOrgId}
                                initialSubcontracts={subcontracts}
                                payments={payments}
                                providers={providers.map((p: any) => ({
                                    id: p.id,
                                    name: p.full_name || p.company_name || "Sin Nombre",
                                    image: p.resolved_avatar_url || p.image_url,
                                    fallback: (p.first_name?.[0] || "") + (p.last_name?.[0] || "")
                                }))}
                                currencies={financialData.currencies}
                                defaultCurrencyId={financialData.defaultCurrencyId}
                                indexTypes={indexTypes.map(idx => ({
                                    id: idx.id,
                                    name: idx.name,
                                    periodicity: idx.periodicity
                                }))}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent
                        value="payments"
                        className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsPaymentsView
                                data={payments}
                                subcontracts={subcontracts}
                                financialData={financialData}
                                orgId={activeOrgId}
                            />
                        </ContentLayout>
                    </TabsContent>

                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title={t('errors.unableToLoad', { default: 'Error al cargar' })}
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel={t('errors.retry', { default: 'Reintentar' })}
                />
            </div>
        );
    }
}
