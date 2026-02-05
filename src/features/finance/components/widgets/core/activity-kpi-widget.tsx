"use client";

import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { BentoKpiCard } from "@/components/bento";
import { Activity } from "lucide-react";

export function ActivityKpiWidget() {
    const { kpis, trends } = useFinanceDashboard();

    return (
        <BentoKpiCard
            title="Movimientos"
            subtitle="Cantidad total registrada"
            value={kpis.totalMovements.toString()}
            icon={<Activity className="w-4 h-4" />}
            chartType="bar"
            chartData={trends.movements}
            chartColor="#3b82f6"
            chartPosition="background"
        />
    );
}
