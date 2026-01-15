"use client";

import { useMemo } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { FinanceCashFlowWidget } from "@/features/finance/components/dashboard/finance-cash-flow-widget";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency as formatCurrencyUtil, getAmountsByCurrency, sumMonetaryAmounts } from "@/lib/currency-utils";

interface FinanceOverviewProps {
    movements: any[];
}

export function FinanceOverview({ movements }: FinanceOverviewProps) {
    const currencyContext = useCurrencyOptional();
    const primaryCurrencyCode = currencyContext?.primaryCurrency?.code || 'ARS';

    const formatCurrency = (amount: number, currencyCode?: string) => {
        // If a specific currency code is provided, use it
        if (currencyCode) {
            return formatCurrencyUtil(amount, currencyCode);
        }

        // Otherwise, respect the global display preference
        const displayCurrency = currencyContext?.displayCurrency || 'primary';
        if (displayCurrency === 'secondary' && currencyContext?.secondaryCurrency) {
            const converted = currencyContext.convertFromFunctional(amount, currencyContext.secondaryCurrency);
            return formatCurrencyUtil(converted, currencyContext.secondaryCurrency);
        }

        // Default: Primary (Functional)
        return formatCurrencyUtil(amount, currencyContext?.primaryCurrency || 'ARS');
    };

    const kpis = useMemo(() => {
        // Separate movements by type
        const incomeMovements = movements.filter(m => Number(m.amount_sign ?? 1) > 0);
        const expenseMovements = movements.filter(m => Number(m.amount_sign ?? 1) < 0);

        // Sum amounts using functional currency (preferred) or native with conversion fallback
        const incomeTotals = sumMonetaryAmounts(incomeMovements, primaryCurrencyCode);
        const expenseTotals = sumMonetaryAmounts(expenseMovements, primaryCurrencyCode);

        return {
            totalIncome: incomeTotals.total,
            totalExpense: expenseTotals.total,
            balance: incomeTotals.total - expenseTotals.total,
            incomeBreakdown: getAmountsByCurrency(incomeMovements, primaryCurrencyCode),
            expenseBreakdown: getAmountsByCurrency(expenseMovements, primaryCurrencyCode),
            balanceBreakdown: getAmountsByCurrency(movements, primaryCurrencyCode),
        };
    }, [movements, primaryCurrencyCode]);

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <DashboardKpiCard
                    title="Balance Total"
                    value={formatCurrency(kpis.balance)}
                    icon={<Wallet className="w-5 h-5" />}
                    currencyBreakdown={kpis.balanceBreakdown}
                    className="border-none bg-blue-500/5 shadow-none"
                    iconClassName="bg-blue-500/10 text-blue-500"
                />

                <DashboardKpiCard
                    title="Ingresos"
                    value={formatCurrency(kpis.totalIncome)}
                    icon={<ArrowUpRight className="w-5 h-5" />}
                    currencyBreakdown={kpis.incomeBreakdown}
                    className="border-none bg-emerald-500/5 shadow-none"
                    iconClassName="bg-emerald-500/10 text-emerald-500"
                />

                <DashboardKpiCard
                    title="Egresos"
                    value={formatCurrency(kpis.totalExpense)}
                    icon={<ArrowDownRight className="w-5 h-5" />}
                    currencyBreakdown={kpis.expenseBreakdown}
                    className="border-none bg-red-500/5 shadow-none"
                    iconClassName="bg-red-500/10 text-red-500"
                />
            </div>

            {/* Main Chart */}
            <div className="h-[400px]">
                <FinanceCashFlowWidget movements={movements} />
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
                            {movements.slice(0, 50).map((m: any) => {
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
                                            <div className="flex flex-col items-end">
                                                <span>
                                                    {isPositive ? "+" : "-"}
                                                    {formatCurrency(Number(m.amount), m.currency_code)}
                                                </span>
                                                {m.currency_code !== primaryCurrencyCode && m.functional_amount && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        ({formatCurrency(Number(m.functional_amount))})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
