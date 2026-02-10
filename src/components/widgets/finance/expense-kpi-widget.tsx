"use client";

import { useFinanceDashboardSafe } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/widgets/grid";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { TrendingDown } from "lucide-react";

export function ExpenseKpiWidget() {
    const ctx = useFinanceDashboardSafe();
    if (!ctx) {
        return (
            <WidgetEmptyState
                icon={TrendingDown}
                title="Egresos Totales"
                description="Disponible en el dashboard de Finanzas"
                href="/organization/finance"
                actionLabel="Ir a Finanzas"
            />
        );
    }

    const { kpis, trends } = ctx;

    return (
        <BentoKpiCard
            title="Egresos Totales"
            subtitle="Pagos y retiros"
            amount={kpis.egresos}
            icon={<TrendingDown className="w-4 h-4" />}
            chartType="area"
            chartData={trends.expenses}
            chartColor="oklch(54.392% 0.19137 24.073)"
            chartPosition="bottom"
            expandable={true}
        />
    );
}
