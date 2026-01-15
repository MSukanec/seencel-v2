
import { Suspense } from "react";
import {
    getClientsByOrganization,
    getFinancialSummaryByOrganization,
    getCommitmentsByOrganization,
    getPaymentsByOrganization,
    getSchedulesByOrganization,
    getClientRoles
} from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsOverview } from "@/features/clients/components/clients-overview";
import { ClientsListTable } from "@/features/clients/components/clients-list-table";
import { ClientCommitmentsTable } from "@/features/clients/components/client-commitments-table";
import { ClientPaymentsTable } from "@/features/clients/components/client-payments-table";
import { ClientSchedulesTable } from "@/features/clients/components/client-schedules-table";
import { ClientSettings } from "@/features/clients/components/client-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Reusing types from features
import {
    ProjectClientView,
    ClientFinancialSummary,
    ClientCommitment,
    ClientPaymentView,
    ClientRole
} from "@/features/clients/types";

interface PageProps {
    searchParams: Promise<{
        view?: string;
    }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;

    // 1. Resolve Data
    const { clients, financialSummary, commitments, payments, schedules, roles, orgId } = await getData();

    const currentTab = resolvedSearchParams.view || "overview";

    return (
        <div className="flex flex-col h-full space-y-6 pt-6">
            <div className="flex items-center justify-between px-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h2>
                    <p className="text-muted-foreground">
                        Administra tus clientes, contratos y flujos de pago.
                    </p>
                </div>
            </div>

            <div className="flex-1 px-6">
                <Tabs defaultValue={currentTab} className="h-full space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Visión General</TabsTrigger>
                        <TabsTrigger value="list">Lista de Clientes</TabsTrigger>
                        <TabsTrigger value="commitments">Compromisos</TabsTrigger>
                        <TabsTrigger value="payments">Pagos</TabsTrigger>
                        <TabsTrigger value="schedules">Cronogramas</TabsTrigger>
                        <TabsTrigger value="settings">Ajustes</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: OVERVIEW */}
                    <TabsContent value="overview" className="space-y-4">
                        <ClientsOverview summary={financialSummary} payments={payments} />
                    </TabsContent>

                    {/* TAB 2: LIST */}
                    <TabsContent value="list" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cartera de Clientes</CardTitle>
                                <CardDescription>
                                    Listado de todos los clientes activos vinculados a proyectos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientsListTable data={clients} roles={roles} orgId={orgId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: COMMITMENTS */}
                    <TabsContent value="commitments" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compromisos de Pago</CardTitle>
                                <CardDescription>
                                    Contratos y acuerdos financieros con clientes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientCommitmentsTable
                                    data={commitments}
                                    clients={clients}
                                    payments={payments}
                                    financialData={{}}
                                    orgId={orgId}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: PAYMENTS */}
                    <TabsContent value="payments" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Pagos</CardTitle>
                                <CardDescription>
                                    Registro detallado de ingresos recibidos.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientPaymentsTable data={payments} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 5: SCHEDULES */}
                    <TabsContent value="schedules" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cronogramas de Vencimiento</CardTitle>
                                <CardDescription>
                                    Cuotas y fechas de pago programadas.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientSchedulesTable data={schedules} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 6: SETTINGS */}
                    <TabsContent value="settings" className="space-y-4">
                        <ClientSettings roles={roles} orgId={orgId} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

async function getData() {
    // Helper to get all needed data in parallel
    // NOTE: In a real app with huge data, we would fetch ONLY what's needed for the current tab.
    // However, to simplify the layout and "props drilling" for this MVP, fetching all (or leveraging server caching) is easier.
    // Recommendation: If this grows, move fetches INSIDE each Tab Content component (Server Components).

    // For now, let's fetch everything. It's safe given the "dashboard" nature usually fetches initial state.

    // First get Org ID
    const { activeOrgId } = await getUserOrganizations();
    if (!activeOrgId) return { clients: [], financialSummary: [], commitments: [], payments: [], schedules: [], roles: [], orgId: "" };

    const [
        clientsRes,
        summaryRes,
        commitmentsRes,
        paymentsRes,
        schedulesRes,
        rolesRes
    ] = await Promise.all([
        getClientsByOrganization(activeOrgId),
        getFinancialSummaryByOrganization(activeOrgId),
        getCommitmentsByOrganization(activeOrgId),
        getPaymentsByOrganization(activeOrgId),
        getSchedulesByOrganization(activeOrgId),
        getClientRoles(activeOrgId)
    ]);

    return {
        clients: clientsRes.data || [],
        financialSummary: summaryRes.data || [],
        commitments: commitmentsRes.data || [],
        payments: paymentsRes.data || [],
        schedules: schedulesRes.data || [],
        roles: rolesRes.data || [],
        orgId: activeOrgId
    };
}
