import { getOrganizationFinancialData } from "@/features/organization/queries"; // Unified fetch
import { getClients, getClientFinancialSummary, getClientCommitments, getClientPayments, getClientPaymentSchedules, getClientRoles } from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { ClientsPageClient } from "@/features/clients/components/clients-page-client";

interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{
        view?: string;
    }>;
}

export default async function ClientsPage({ params, searchParams }: PageProps) {
    const { projectId } = await params;
    const resolvedSearchParams = await searchParams;
    const defaultTab = resolvedSearchParams.view || "overview";

    const { clients, financialSummary, commitments, payments, schedules, roles, orgId, financialData } = await getData(projectId);

    return (
        <ClientsPageClient
            projectId={projectId}
            orgId={orgId}
            clients={clients}
            financialSummary={financialSummary}
            commitments={commitments}
            payments={payments}
            schedules={schedules}
            roles={roles}
            financialData={financialData}
            defaultTab={defaultTab}
        />
    );
}

async function getData(projectId: string) {
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) return { clients: [], financialSummary: [], commitments: [], payments: [], schedules: [], roles: [], orgId: "", financialData: { currencies: [], wallets: [] } };

    const [
        clientsRes,
        summaryRes,
        commitmentsRes,
        paymentsRes,
        schedulesRes,
        rolesRes,
        financialData
    ] = await Promise.all([
        getClients(projectId),
        getClientFinancialSummary(projectId),
        getClientCommitments(projectId),
        getClientPayments(projectId),
        getClientPaymentSchedules(projectId),
        getClientRoles(activeOrgId),
        getOrganizationFinancialData(activeOrgId)
    ]);

    return {
        clients: clientsRes.data || [],
        financialSummary: summaryRes.data || [],
        commitments: commitmentsRes.data || [],
        payments: paymentsRes.data || [],
        schedules: schedulesRes.data || [],
        roles: rolesRes.data || [],
        orgId: activeOrgId,
        financialData
    };
}

