import { Metadata } from "next";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import { getActiveOrganizationProjects } from "@/features/projects/queries";
import {
    getClientsByOrganization,
    getFinancialSummaryByOrganization,
    getCommitmentsByOrganization,
    getPaymentsByOrganization,
    getOrganizationContracts,
} from "@/features/clients/queries";
import { requireAuthContext } from "@/lib/auth";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote } from "lucide-react";
import { LockedBadge } from "@/components/shared/locked-badge";

// ── Views ──
import { ClientsOverview } from "@/features/clients/views/clients-overview-view";
import { CommitmentsView } from "@/features/clients/views/clients-commitments-view";
import { ClientsPaymentsView } from "@/features/clients/views/clients-payments-view";
import { ClientsContractsView } from "@/features/clients/views/clients-contracts-view";


// ── Metadata ──
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Cobros | SEENCEL",
        description: "Gestión de cobros, compromisos y pagos de la organización.",
        robots: "noindex, nofollow",
    };
}

// ── Page Props ──
interface PageProps {
    searchParams: Promise<{
        view?: string;
    }>;
}

export default async function OrganizationClientsPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const defaultTab = resolvedSearchParams.view || "overview";

    try {
        const { orgId } = await requireAuthContext();
        if (!orgId) {
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title="Sin organización"
                        message="No se encontró una organización activa."
                        retryLabel="Reintentar"
                    />
                </div>
            );
        }

        // Fetch all data scoped to the active organization
        const [
            clientsRes,
            summaryRes,
            commitmentsRes,
            paymentsRes,
            financialData,
            projects,
            contractsRes,
        ] = await Promise.all([
            getClientsByOrganization(orgId),
            getFinancialSummaryByOrganization(orgId),
            getCommitmentsByOrganization(orgId),
            getPaymentsByOrganization(orgId),
            getOrganizationFinancialData(orgId),
            getActiveOrganizationProjects(orgId),
            getOrganizationContracts(orgId),
        ]);

        const clients = clientsRes.data || [];
        const financialSummary = summaryRes.data || [];
        const commitments = commitmentsRes.data || [];
        const payments = paymentsRes.data || [];
        const contracts = contractsRes.data || [];

        const tabs = (
            <TabsList className="portal-to-header">
                <TabsTrigger value="overview">Visión General</TabsTrigger>
                <TabsTrigger value="contracts">Contratos</TabsTrigger>
                <TabsTrigger value="commitments">Compromisos</TabsTrigger>
                <TabsTrigger value="payments">Pagos</TabsTrigger>
                <LockedBadge>
                    <TabsTrigger value="schedules">Cronogramas</TabsTrigger>
                </LockedBadge>

            </TabsList>
        );

        return (
            <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
                <PageWrapper
                    title="Cobros"
                    tabs={tabs}
                    icon={<Banknote />}
                >
                    <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ClientsOverview
                            summary={financialSummary}
                            payments={payments}
                        />
                    </TabsContent>
                    <TabsContent value="contracts" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ClientsContractsView
                            contracts={contracts}
                            orgId={orgId}
                            projects={projects.map(p => ({ id: p.id, name: p.name }))}
                        />
                    </TabsContent>
                    <TabsContent value="commitments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <CommitmentsView
                            commitments={commitments}
                            clients={clients}
                            payments={payments}
                            financialData={financialData}
                            orgId={orgId}
                            projects={projects.map(p => ({ id: p.id, name: p.name }))}
                        />
                    </TabsContent>
                    <TabsContent value="payments" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ClientsPaymentsView
                            data={payments}
                            clients={clients}
                            financialData={financialData}
                            orgId={orgId}
                            projects={projects.map(p => ({ id: p.id, name: p.name }))}
                        />
                    </TabsContent>


                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar clientes"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
