"use client";

import { useMemo } from "react";
import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { BentoCard } from "@/components/bento/bento-card";
import { BaseDualAreaChart } from "@/components/charts/area/base-dual-area-chart";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export function FinancialSummaryWidget({ size = 'wide' }: { size?: 'lg' | 'wide' }) {
    const { kpis, filteredMovements } = useFinanceDashboard();
    const money = useMoney();

    const evolutionData = useMemo(() => {
        const grouped = filteredMovements.reduce((acc, m) => {
            const monthKey = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!monthKey) return acc;
            const sign = Number(m.amount_sign ?? 1);
            const amount = money.toFunctionalAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });

            if (!acc[monthKey]) acc[monthKey] = { ingresos: 0, egresos: 0 };
            if (sign > 0) acc[monthKey].ingresos += amount;
            else acc[monthKey].egresos += amount;
            return acc;
        }, {} as Record<string, { ingresos: number, egresos: number }>);

        type MonthData = { ingresos: number, egresos: number };
        const sortedMonths = (Object.entries(grouped) as [string, MonthData][])
            .filter(([month]) => month && month.length >= 7)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6);

        return sortedMonths.map(([month, data]) => {
            const [year, monthNum] = month.split('-').map(Number);
            const date = new Date(year, (monthNum || 1) - 1, 1);
            const formatted = isNaN(date.getTime())
                ? month
                : new Intl.DateTimeFormat('es', { month: 'short' }).format(date);

            return { month: formatted, ingresos: data.ingresos, egresos: data.egresos };
        });
    }, [filteredMovements, money.toFunctionalAmount]);

    const chartConfig: ChartConfig = {
        ingresos: { label: "Ingresos", color: "var(--amount-positive)" },
        egresos: { label: "Egresos", color: "var(--amount-negative)" }
    };

    return (
        <BentoCard
            size={size as any}
            title="Resumen Financiero"
            subtitle="Flujo de caja consolidado"
            icon={<BarChart3 className="w-4 h-4" />}
        >
            <div className="flex flex-col lg:flex-row h-full gap-4">
                {/* Left: Stats List */}
                <div className="flex-1 flex flex-col justify-center gap-4 min-w-[180px]">
                    {/* Income */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-muted-foreground">Ingresos</span>
                        </div>
                        <span className="text-base font-bold">{money.format(kpis.ingresos)}</span>
                    </div>

                    {/* Expense */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-muted-foreground">Egresos</span>
                        </div>
                        <span className="text-base font-bold">{money.format(kpis.egresos)}</span>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Balance */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-lg", kpis.balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                <Wallet className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-muted-foreground">Balance</span>
                        </div>
                        <span className={cn("text-lg font-bold", kpis.balance >= 0 ? "text-emerald-500" : "text-red-500")}>
                            {money.format(kpis.balance)}
                        </span>
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="flex-[1.5] min-h-[140px] bg-muted/10 rounded-lg overflow-hidden">
                    <BaseDualAreaChart
                        data={evolutionData}
                        xKey="month"
                        primaryKey="ingresos"
                        secondaryKey="egresos"
                        primaryLabel="Ingresos"
                        secondaryLabel="Egresos"
                        height={180}
                        config={chartConfig}
                        gradient
                        showLegend={false}
                    />
                </div>
            </div>
        </BentoCard>
    );
}
