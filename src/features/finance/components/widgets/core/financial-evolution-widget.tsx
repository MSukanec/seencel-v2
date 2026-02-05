"use client";

import { useMemo } from "react";
import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { BentoCard } from "@/components/bento/bento-card";
import { BaseDualAreaChart } from "@/components/charts/area/base-dual-area-chart";
import { BarChart3 } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { ChartConfig } from "@/components/ui/chart";

export function FinancialEvolutionWidget({ size = 'wide' }: { size?: 'md' | 'lg' | 'wide' }) {
    const { filteredMovements } = useFinanceDashboard();
    const money = useMoney();

    // ========================================
    // REAL DATA PROCESSING
    // ========================================
    const evolutionData = useMemo(() => {
        const grouped = filteredMovements.reduce((acc, m) => {
            const monthKey = m.payment_date ? m.payment_date.substring(0, 7) : '';
            if (!monthKey) return acc;

            const sign = Number(m.amount_sign ?? 1);
            // ALWAYS convert to functional currency for charts
            const amount = money.toFunctionalAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });

            if (!acc[monthKey]) acc[monthKey] = { ingresos: 0, egresos: 0 };
            if (sign > 0) {
                acc[monthKey].ingresos += amount;
            } else {
                acc[monthKey].egresos += amount;
            }
            return acc;
        }, {} as Record<string, { ingresos: number, egresos: number }>);


        type MonthData = { ingresos: number, egresos: number };
        const sortedMonths = (Object.entries(grouped) as [string, MonthData][])
            .filter(([month]) => month && month.length >= 7)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12);

        return sortedMonths.map(([month, data]) => {
            const [year, monthNum] = month.split('-').map(Number);
            const date = new Date(year, (monthNum || 1) - 1, 1);
            const formatted = isNaN(date.getTime())
                ? month
                : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);

            return {
                month: formatted,
                rawMonth: month,
                ingresos: data.ingresos,
                egresos: data.egresos
            };
        });
    }, [filteredMovements, money.toFunctionalAmount]);

    const chartConfig: ChartConfig = {
        ingresos: { label: "Ingresos", color: "var(--amount-positive)" },
        egresos: { label: "Egresos", color: "var(--amount-negative)" }
    };

    return (
        <BentoCard
            size={size as any} // Cast safely as we know it's compatible
            title="Evolución Financiera"
            subtitle="Ingresos vs Egresos por mes"
            icon={<BarChart3 className="w-4 h-4" />}
            className="flex flex-col"
        >
            <div className="flex-1 min-h-[200px] w-full mt-4">
                {evolutionData.length > 0 ? (
                    <BaseDualAreaChart
                        data={evolutionData}
                        xKey="month"
                        primaryKey="ingresos"
                        secondaryKey="egresos"
                        primaryLabel="Ingresos"
                        secondaryLabel="Egresos"
                        height={250}
                        config={chartConfig}
                        gradient
                        showLegend
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sin datos suficientes para proyectar evolución
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
