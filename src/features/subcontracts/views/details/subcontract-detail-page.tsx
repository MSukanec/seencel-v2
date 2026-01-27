import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Handshake, ChevronLeft } from "lucide-react";

import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { ContentLayout } from "@/components/layout/dashboard/shared/content-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { getSubcontractById, getSubcontractPayments } from "@/features/subcontracts/queries";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { getProjectById } from "@/features/projects/queries";
import { getLatestIndexValue, getIndexType, getIndexHistory } from "@/features/advanced/queries";
import type { EconomicIndexValue } from "@/features/advanced/types";

import { SubcontractOverviewView } from "./subcontract-overview-view";
import { SubcontractPaymentsView } from "./subcontract-payments-view";
import { SubcontractTasksView } from "./subcontract-tasks-view";
import { SubcontractAdjustmentView } from "./subcontract-adjustment-view";

interface SubcontractDetailPageProps {
    projectId: string;
    subcontractId: string;
}

export async function generateSubcontractMetadata({
    locale
}: {
    locale: string;
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Subcontracts' });
    return {
        title: `${t('detailTitle', { default: 'Detalle de Subcontrato' })} | SEENCEL`,
        description: t('subtitle', { default: 'Gestión de Subcontratos' }),
        robots: "noindex, nofollow",
    };
}

export async function SubcontractDetailPage({ projectId, subcontractId }: SubcontractDetailPageProps) {
    const t = await getTranslations('Subcontracts');

    try {
        const [project, subcontract, allPayments] = await Promise.all([
            getProjectById(projectId),
            getSubcontractById(subcontractId),
            getSubcontractPayments(projectId),
        ]);

        if (!project || !subcontract) {
            return notFound();
        }

        // Get financial data after project is confirmed
        const financialData = await getOrganizationFinancialData(project.organization_id);

        // Filter payments for this subcontract
        const subcontractPayments = allPayments.filter((p: any) => p.subcontract_id === subcontractId);

        // Organization ID needed for forms
        const organizationId = project.organization_id;

        // Fetch index data if subcontract has adjustment configured
        let latestIndexValue: number | null = null;
        let indexTypeName: string | null = null;
        let indexHistory: EconomicIndexValue[] = [];

        if (subcontract.adjustment_index_type_id) {
            const [latestValue, indexType, history] = await Promise.all([
                getLatestIndexValue(subcontract.adjustment_index_type_id),
                getIndexType(subcontract.adjustment_index_type_id),
                subcontract.base_period_year && subcontract.base_period_month
                    ? getIndexHistory(
                        subcontract.adjustment_index_type_id,
                        subcontract.base_period_year,
                        subcontract.base_period_month
                    )
                    : Promise.resolve([])
            ]);

            if (latestValue?.values) {
                // Get the main component value (usually 'general' or first key)
                const mainKey = Object.keys(latestValue.values)[0];
                latestIndexValue = latestValue.values[mainKey] || null;
            }
            indexTypeName = indexType?.name || null;
            indexHistory = history;
        }

        // Title: prefer subcontract title, fallback to contact name
        const subcontractTitle = subcontract.title || subcontract.contact?.full_name || subcontract.contact?.company_name || "Subcontrato";

        return (
            <Tabs defaultValue="overview" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={subcontractTitle}
                    icon={<Handshake />}
                    backButton={
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 mr-2">
                            <Link href={`/project/${projectId}/subcontracts`}>
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    }
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="tasks">Tareas</TabsTrigger>
                            <TabsTrigger value="payments">Pagos</TabsTrigger>
                            <TabsTrigger value="adjustment">Ajuste</TabsTrigger>
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
                            <SubcontractOverviewView
                                subcontract={subcontract}
                                payments={subcontractPayments}
                                financialData={financialData || {}}
                                latestIndexValue={latestIndexValue}
                                indexTypeName={indexTypeName}
                                indexHistory={indexHistory}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: TASKS */}
                    <TabsContent
                        value="tasks"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractTasksView
                                subcontract={subcontract}
                                projectId={projectId}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent
                        value="payments"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractPaymentsView
                                subcontract={subcontract}
                                payments={subcontractPayments}
                                financialData={financialData || {}}
                                projectId={projectId}
                                organizationId={organizationId}
                            />
                        </ContentLayout>
                    </TabsContent>

                    {/* TAB: ADJUSTMENT */}
                    <TabsContent
                        value="adjustment"
                        className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none min-h-0"
                    >
                        <ContentLayout variant="wide" className="h-full">
                            <SubcontractAdjustmentView
                                subcontract={subcontract}
                                payments={subcontractPayments}
                                financialData={financialData || {}}
                                latestIndexValue={latestIndexValue}
                                indexTypeName={indexTypeName}
                                indexHistory={indexHistory}
                            />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        const t = await getTranslations('Subcontracts');
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
