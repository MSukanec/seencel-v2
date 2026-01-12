
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientFinancialSummary, ClientPaymentView } from "../types";
import { Users, DollarSign, Activity, FileText } from "lucide-react";

interface ClientsOverviewProps {
    summary: ClientFinancialSummary[]; // Summary per client
    payments: ClientPaymentView[]; // Recent payments
}

export function ClientsOverview({ summary, payments }: ClientsOverviewProps) {
    // 1. Calculations
    const totalClients = summary.length;

    // Sum amounts (Caution: mixed currencies might be an issue, assuming base currency or just summing for MVP)
    // Ideally we should group by currency. For now, let's just sum assuming standard.
    const totalCommitted = summary.reduce((acc, curr) => acc + (Number(curr.total_committed_amount) || 0), 0);
    const totalPaid = summary.reduce((acc, curr) => acc + (Number(curr.total_paid_amount) || 0), 0);
    const totalBalance = summary.reduce((acc, curr) => acc + (Number(curr.balance_due) || 0), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClients}</div>
                        <p className="text-xs text-muted-foreground">
                            Con compromisos financieros
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Comprometido</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalCommitted)}</div>
                        <p className="text-xs text-muted-foreground">
                            Valor total de contratos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">
                            Ingresos confirmados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balance Pendiente</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Por cobrar
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Deudores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Simple List of debts */}
                        <div className="space-y-4">
                            {summary
                                .sort((a, b) => b.balance_due - a.balance_due)
                                .slice(0, 5)
                                .map((client, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Cliente ID: {client.client_id.substring(0, 8)}...</p>
                                            <p className="text-xs text-muted-foreground">
                                                {client.currency_code}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            {formatCurrency(client.balance_due)}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Pagos Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {payments.slice(0, 5).map((payment, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{payment.client_name || "Desconocido"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-green-600">
                                        +{formatCurrency(payment.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
