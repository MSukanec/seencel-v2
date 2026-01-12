
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients, getClientFinancialSummary, getClientCommitments, getClientPayments, getClientPaymentSchedules, getClientRoles } from "@/features/clients/queries";
import { getUserOrganizations } from "@/features/organization/queries";
import { ClientsOverview } from "@/features/clients/components/clients-overview";
import { ClientsListTable } from "@/features/clients/components/clients-list-table";
import { ClientCommitmentsTable } from "@/features/clients/components/client-commitments-table";
import { ClientPaymentsTable } from "@/features/clients/components/client-payments-table";
import { ClientSchedulesTable } from "@/features/clients/components/client-schedules-table";
import { ClientSettings } from "@/features/clients/components/client-settings";

interface PageProps {
    params: {
        projectId: string;
    };
    searchParams: {
        view?: string;
    };
}

export default async function ClientsPage({ params, searchParams }: PageProps) {
    const { projectId } = params;

    // 1. Resolve Data
    const { clients, financialSummary, commitments, payments, schedules, roles, orgId } = await getData(projectId);

    const currentTab = searchParams.view || "overview";

    return (
        <div className="flex flex-col h-full space-y-6 pt-6">
            <div className="flex items-center justify-between px-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h2>
                    <p className="text-muted-foreground">
                        Administra los clientes, contratos y pagos de este proyecto.
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
                                    Listado de clientes vinculados a este proyecto.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientsListTable data={clients} roles={roles} orgId={orgId} projectId={projectId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: COMMITMENTS */}
                    <TabsContent value="commitments" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compromisos de Pago</CardTitle>
                                <CardDescription>
                                    Contratos y acuerdos financieros.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClientCommitmentsTable data={commitments} clients={clients} projectId={projectId} orgId={orgId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: PAYMENTS */}
                    <TabsContent value="payments" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Pagos</CardTitle>
                                <CardDescription>
                                    Registro detallado de ingresos.
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

async function getData(projectId: string) {
    // First get Org ID (still needed for creating new records or getting roles)
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
        getClients(projectId),
        getClientFinancialSummary(projectId),
        getClientCommitments(projectId),
        getClientPayments(projectId),
        getClientPaymentSchedules(projectId),
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
