"use client";

import { useMemo } from "react";
import { useFinanceDashboardSafe } from "@/features/finance/context/finance-dashboard-context";
import { BentoCard } from "@/components/widgets/grid/bento-card";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { BaseDonutChart } from "@/components/charts/pie/base-donut-chart";
import { PieChart } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { ChartConfig } from "@/components/ui/chart";

export function WalletDistributionWidget({ size = 'md' }: { size?: 'md' | 'lg' }) {
    const ctx = useFinanceDashboardSafe();
    const money = useMoney();

    if (!ctx) {
        return (
            <WidgetEmptyState
                icon={PieChart}
                title="Distribución de Fondos"
                description="Disponible en el dashboard de Finanzas"
                href="/organization/finance"
                actionLabel="Ir a Finanzas"
            />
        );
    }

    const { filteredMovements } = ctx;

    const distributionData = useMemo(() => {
        const walletBalances = filteredMovements.reduce((acc, m) => {
            const walletName = m.wallet_name || 'Sin billetera';
            const baseAmount = money.toFunctionalAmount({
                amount: Number(m.amount) || 0,
                currency_code: m.currency_code,
                exchange_rate: Number(m.exchange_rate) || undefined
            });
            const signedAmount = baseAmount * (Number(m.amount_sign) || 1);
            acc[walletName] = (acc[walletName] || 0) + signedAmount;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

        return Object.entries(walletBalances)
            .filter(([_, value]) => (value as number) > 0)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value: value as number,
                fill: colors[i % colors.length]
            }));
    }, [filteredMovements, money.toFunctionalAmount]);

    const chartConfig: ChartConfig = distributionData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig);

    return (
        <BentoCard
            size={size as any}
            title="Distribución de Fondos"
            subtitle="Balance por billetera"
            icon={<PieChart className="w-4 h-4" />}
        >
            <div className="h-full w-full min-h-[160px]">
                {distributionData.length > 0 ? (
                    <BaseDonutChart
                        data={distributionData}
                        nameKey="name"
                        valueKey="value"
                        height={160}
                        config={chartConfig}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sin fondos disponibles
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
