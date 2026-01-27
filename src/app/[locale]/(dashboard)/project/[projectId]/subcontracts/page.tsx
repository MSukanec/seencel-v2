import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Handshake } from "lucide-react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubcontractsOverviewView } from "@/features/subcontracts/components/views/subcontracts-overview-view";
import { SubcontractsListView } from "@/features/subcontracts/components/views/subcontracts-list-view";
import { SubcontractsPaymentsView } from "@/features/subcontracts/components/views/subcontracts-payments-view";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import { getSubcontractsByProject, getSubcontractPayments } from "@/features/subcontracts/queries";

interface SubcontractsPageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

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
        title: `${t('title', { default: 'Subcontratos' })} | SEENCEL`,
        description: t('subtitle', { default: 'Gestión de Subcontratos' }),
        robots: "noindex, nofollow", // Private dashboard
    };
}

import { getOrganizationContacts } from "@/actions/contacts";

export default async function SubcontractsPage({ params }: SubcontractsPageProps) {
    const { projectId } = await params;
    const t = await getTranslations('Subcontracts');

    try {
        // 1. Fetch Project to get Organization ID
        const project = await getProjectById(projectId);

        if (!project) {
            return notFound();
        }

        const organizationId = project.organization_id;

        // 2. Fetch Data in Parallel
        const [financialData, providers, subcontracts, payments] = await Promise.all([
            getOrganizationFinancialData(organizationId),
            getOrganizationContacts(organizationId),
            getSubcontractsByProject(projectId),
            getSubcontractPayments(projectId)
        ]);

        return (
            <Tabs defaultValue="list" className="h-full flex flex-col">
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
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsOverviewView />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: LIST */}
                    <TabsContent
                        value="list"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsListView
                                projectId={projectId}
                                organizationId={organizationId}
                                initialSubcontracts={subcontracts}
                                providers={providers.map((p: any) => ({
                                    id: p.id,
                                    name: p.full_name || p.company_name || "Sin Nombre",
                                    image: p.resolved_avatar_url || p.image_url,
                                    fallback: (p.first_name?.[0] || "") + (p.last_name?.[0] || "")
                                }))}
                                currencies={financialData.currencies}
                                defaultCurrencyId={financialData.defaultCurrencyId}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent
                        value="payments"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsPaymentsView
                                data={payments}
                                subcontracts={subcontracts}
                                financialData={financialData}
                                projectId={projectId}
                                orgId={organizationId}
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
