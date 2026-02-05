"use client";

import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/bento";
import { Wallet } from "lucide-react";

export function BalanceKpiWidget() {
    const { kpis, trends } = useFinanceDashboard();

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
