import { getOrganizationFinancialData } from "@/features/organization/queries"; // Unified fetch
import { getClients, getClientFinancialSummary, getClientCommitments, getClientPayments, getClientPaymentSchedules, getClientRoles, getOrganizationContacts, getProjectRepresentatives } from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { ClientsPageClient } from "@/features/clients/components/overview/clients-page-client";

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

    const { clients, financialSummary, commitments, payments, schedules, roles, orgId, financialData, contacts, representativesByClient } = await getData(projectId);

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
            contacts={contacts}
            representativesByClient={representativesByClient}
        />
    );
}

async function getData(projectId: string) {
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) return { clients: [], financialSummary: [], commitments: [], payments: [], schedules: [], roles: [], orgId: "", financialData: { currencies: [], wallets: [], defaultCurrencyId: null, defaultWalletId: null, defaultTaxLabel: null, preferences: null }, contacts: [], representativesByClient: {} };

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

    // Fetch representatives and contacts in parallel (separate for clarity)
    const [contactsRes, repsRes] = await Promise.all([
        getOrganizationContacts(activeOrgId),
        getProjectRepresentatives(projectId)
    ]);

    return {
        clients: clientsRes.data || [],
        financialSummary: summaryRes.data || [],
        commitments: commitmentsRes.data || [],
        payments: paymentsRes.data || [],
        schedules: schedulesRes.data || [],
        roles: rolesRes.data || [],
        orgId: activeOrgId,
        financialData,
        contacts: contactsRes.data || [],
        representativesByClient: repsRes.data || {}
    };
}

