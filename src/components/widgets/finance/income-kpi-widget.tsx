"use client";

import { useFinanceDashboardSafe } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/widgets/grid";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { TrendingUp } from "lucide-react";

export function IncomeKpiWidget() {
    const ctx = useFinanceDashboardSafe();
    if (!ctx) {
        return (
            <WidgetEmptyState
                icon={TrendingUp}
                title="Ingresos Totales"
                description="Disponible en el dashboard de Finanzas"
                href="/organization/finance"
                actionLabel="Ir a Finanzas"
            />
        );
    }

    const { kpis, trends } = ctx;

    return (
        <BentoKpiCard
            title="Ingresos Totales"
            subtitle="Cobros y aportes"
            amount={kpis.ingresos}
            icon={<TrendingUp className="w-4 h-4" />}
            chartType="area"
            chartData={trends.income}
            chartColor="oklch(69.766% 0.16285 126.686)"
            chartPosition="bottom"
            expandable={true}
            trend={kpis.trendPercent !== 0 ? {
                value: `${Math.abs(kpis.trendPercent).toFixed(0)}%`,
                direction: kpis.trendDirection as "up" | "down" | "neutral",
                label: "vs mes anterior"
            } : undefined}
        />
    );
}
