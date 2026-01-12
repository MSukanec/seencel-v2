import { getFinancialMovements } from "@/features/organization/queries";
import { FinanceChart } from "@/components/dashboard/finance-chart";
import { Card } from "@/components/ui/card";
import {
    ArrowUpRight,
    ArrowDownRight,
    Wallet
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

export default async function FinancePage() {
    const { movements, error } = await getFinancialMovements();

    if (error || !movements) {
        return (
            <PageWrapper type="page" title="Finanzas">
                <ContentLayout variant="wide">
                    <div className="p-8 text-center text-red-500">Error loading financial data: {error}</div>
                </ContentLayout>
            </PageWrapper>
        );
    }

    // Calculate KPIs
    const totalIncome = movements.reduce((acc: number, m: any) => {
        const sign = Number(m.amount_sign ?? 1);
        return sign > 0 ? acc + Number(m.amount) : acc;
    }, 0);

    const totalExpense = movements.reduce((acc: number, m: any) => {
        const sign = Number(m.amount_sign ?? 1);
        return sign < 0 ? acc + Number(m.amount) : acc;
    }, 0);

    const balance = totalIncome - totalExpense;

    return (
        <PageWrapper type="page" title="Finanzas">
            <ContentLayout variant="wide">
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="p-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Balance Total</span>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Wallet className="w-4 h-4 text-blue-500" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold">
                                ${balance.toLocaleString('en-US')}
                            </div>
                        </Card>

                        <Card className="p-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Ingresos</span>
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">
                                +${totalIncome.toLocaleString('en-US')}
                            </div>
                        </Card>

                        <Card className="p-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Egresos</span>
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                -${totalExpense.toLocaleString('en-US')}
                            </div>
                        </Card>
                    </div>

                    {/* Main Chart */}
                    <div className="h-[400px]">
                        <FinanceChart movements={movements} />
                    </div>

                    {/* Transactions List */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold text-lg">Movimientos Recientes</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Descripción</th>
                                        <th className="px-6 py-3">Entidad</th>
                                        <th className="px-6 py-3 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {movements.slice(0, 10).map((m: any) => {
                                        const sign = Number(m.amount_sign ?? 1);
                                        const isPositive = sign > 0;
                                        return (
                                            <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                    {format(new Date(m.payment_date), "d MMM, yyyy", { locale: es })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{m.description}</div>
                                                    <div className="text-xs text-muted-foreground">{m.movement_type}</div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {m.entity_name || "-"}
                                                </td>
                                                <td className={cn(
                                                    "px-6 py-4 text-right font-medium",
                                                    isPositive ? "text-emerald-600" : "text-foreground"
                                                )}>
                                                    {isPositive ? "+" : "-"}${Number(m.amount).toLocaleString('en-US')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
