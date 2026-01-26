import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Building2, ArrowLeft } from "lucide-react";

import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { getSubcontractById, getSubcontractPayments } from "@/features/subcontracts/queries";
import { getOrganizationFinancialData } from "@/features/organization/queries"; // For currency if needed
import { getProjectById } from "@/features/projects/queries";

import { SubcontractDetailOverviewView } from "@/features/subcontracts/components/views/subcontract-detail-overview-view";
import { SubcontractTasksView } from "@/features/subcontracts/components/views/subcontract-tasks-view";
import { SubcontractsPaymentsView } from "@/features/subcontracts/components/views/subcontracts-payments-view";

interface SubcontractDetailPageProps {
    params: Promise<{
        projectId: string;
        subcontractId: string;
        locale: string;
    }>;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'Subcontracts' });
    return {
        title: `${t('detailTitle', { default: 'Detalle de Subcontrato' })} | SEENCEL`,
        description: t('subtitle', { default: 'Gestión de Subcontratos' }),
        robots: "noindex, nofollow",
    };
}

export default async function SubcontractDetailPage({ params }: SubcontractDetailPageProps) {
    const { projectId, subcontractId } = await params;
    const t = await getTranslations('Subcontracts');

    try {
        const [project, subcontract, allPayments, financialData] = await Promise.all([
            getProjectById(projectId),
            getSubcontractById(subcontractId),
            getSubcontractPayments(projectId),
            getProjectById(projectId).then(p => p ? getOrganizationFinancialData(p.organization_id) : null)
        ]);

        if (!project || !subcontract) {
            return notFound();
        }

        // Filter payments for this subcontract
        const subcontractPayments = allPayments.filter((p: any) => p.subcontract_id === subcontractId);

        // Organization ID needed for forms
        const organizationId = project.organization_id;

        const subcontractTitle = subcontract.contact?.full_name || subcontract.contact?.company_name || "Subcontrato";

        return (
            <Tabs defaultValue="overview" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={subcontractTitle}
                    icon={<Building2 />}
                    backButton={
                        <Button variant="ghost" size="sm" asChild className="gap-2">
                            <Link href={`/project/${projectId}/subcontracts`}>
                                <ArrowLeft className="h-4 w-4" />
                                {t('back', { default: 'Volver' })}
                            </Link>
                        </Button>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="tasks">Tareas</TabsTrigger>
                            <TabsTrigger value="payments">Pagos</TabsTrigger>
                        </TabsList>
                    }
                    className="h-full"
                >
                    {/* TAB: OVERVIEW */}
                    <TabsContent
                        value="overview"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractDetailOverviewView
                                subcontract={subcontract}
                                payments={subcontractPayments}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: TASKS */}
                    <TabsContent
                        value="tasks"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractTasksView />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent
                        value="payments"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractsPaymentsView
                                data={subcontractPayments}
                                subcontracts={[subcontract]} // Pass only this subcontract for reference if needed
                                financialData={financialData || {}}
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
