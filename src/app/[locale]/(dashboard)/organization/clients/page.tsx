import { Metadata } from "next";
import { getOrganizationFinancialData } from "@/features/organization/queries";
import {
    getClientsByOrganization,
    getFinancialSummaryByOrganization,
    getCommitmentsByOrganization,
    getPaymentsByOrganization,
    getSchedulesByOrganization,
    getClientRoles,
} from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { ClientsPageClient } from "@/features/clients/views";
import { ErrorDisplay } from "@/components/ui/error-display";

// ── Metadata ──
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Clientes | SEENCEL",
        description: "Gestión de clientes, compromisos y pagos de la organización.",
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
        const { activeOrgId } = await getUserOrganizations();
        if (!activeOrgId) {
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
            schedulesRes,
            rolesRes,
            financialData,
        ] = await Promise.all([
            getClientsByOrganization(activeOrgId),
            getFinancialSummaryByOrganization(activeOrgId),
            getCommitmentsByOrganization(activeOrgId),
            getPaymentsByOrganization(activeOrgId),
            getSchedulesByOrganization(activeOrgId),
            getClientRoles(activeOrgId),
            getOrganizationFinancialData(activeOrgId),
        ]);

        return (
            <ClientsPageClient
                projectId={null as any}
                orgId={activeOrgId}
                clients={clientsRes.data || []}
                financialSummary={summaryRes.data || []}
                commitments={commitmentsRes.data || []}
                payments={paymentsRes.data || []}
                schedules={schedulesRes.data || []}
                roles={rolesRes.data || []}
                financialData={financialData}
                defaultTab={defaultTab}
            />
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
