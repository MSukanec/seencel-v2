"use client";

import { useFinanceDashboardSafe } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/widgets/grid";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { Wallet } from "lucide-react";

export function BalanceKpiWidget() {
    const ctx = useFinanceDashboardSafe();
    if (!ctx) {
        return (
            <WidgetEmptyState
                icon={Wallet}
                title="Balance Neto"
                description="Disponible en el dashboard de Finanzas"
                href="/organization/finance"
                actionLabel="Ir a Finanzas"
            />
        );
    }

    const { kpis, trends } = ctx;
    const isPositive = kpis.balance >= 0;
    const color = isPositive ? "oklch(69.766% 0.16285 126.686)" : "oklch(54.392% 0.19137 24.073)";

    return (
        <BentoKpiCard
            title="Balance Neto"
            subtitle="Ingresos - Egresos"
            amount={kpis.balance}
            icon={<Wallet className="w-4 h-4" />}
            chartType="sparkline"
            chartData={trends.balance}
            chartColor={color}
            chartPosition="right"
            expandable={true}
        />
    );
}
