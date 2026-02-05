"use client";

import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/bento";
import { TrendingDown } from "lucide-react";

export function ExpenseKpiWidget() {
    const { kpis, trends } = useFinanceDashboard();

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
