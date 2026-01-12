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

    // Fetch all data
    const { clients, financialSummary, commitments, payments, schedules, roles, orgId, projects } = await getData(projectId);

    return (
        <ClientsPageClient
            projectId={projectId}
            orgId={orgId}
            projects={projects}
            clients={clients}
            financialSummary={financialSummary}
            commitments={commitments}
            payments={payments}
            schedules={schedules}
            roles={roles}
            defaultTab={defaultTab}
        />
    );
}

async function getData(projectId: string) {
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) return { clients: [], financialSummary: [], commitments: [], payments: [], schedules: [], roles: [], orgId: "", projects: [] };

    const [
        clientsRes,
        summaryRes,
        commitmentsRes,
        paymentsRes,
        schedulesRes,
        rolesRes,
        projectsRes
    ] = await Promise.all([
        getClients(projectId),
        getClientFinancialSummary(projectId),
        getClientCommitments(projectId),
        getClientPayments(projectId),
        getClientPaymentSchedules(projectId),
        getClientRoles(activeOrgId),
        getOrganizationProjects(activeOrgId)
    ]);

    return {
        clients: clientsRes.data || [],
        financialSummary: summaryRes.data || [],
        commitments: commitmentsRes.data || [],
        payments: paymentsRes.data || [],
        schedules: schedulesRes.data || [],
        roles: rolesRes.data || [],
        orgId: activeOrgId,
        projects: projectsRes.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            image_url: p.image_url
        }))
    };
}

