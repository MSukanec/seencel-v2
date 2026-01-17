"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { BarChart as BarChartIcon, Clock, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardData } from "@/features/admin/queries";
import { LazyBarChart as BaseBarChart, LazyAreaChart as BaseAreaChart, LazyPieChart as BasePieChart } from "@/components/charts/lazy-charts";

interface AdminChartsProps {
    charts: DashboardData['charts'];
}

// Chart Configs
const engagementConfig = {
    value: {
        label: "Sesiones",
        color: "var(--chart-1)",
    }
};

const activityConfig = {
    value: {
        label: "Sesiones",
        color: "var(--chart-1)",
    }
};

const growthConfig = {
    users: {
        label: "Usuarios",
        color: "var(--chart-1)",
    }
};

const sourcesConfig = {
    "Directo": { label: "Directo", color: "var(--chart-1)" },
    "Redes Sociales": { label: "Redes Sociales", color: "var(--chart-2)" },
    "Orgánico": { label: "Orgánico", color: "var(--chart-3)" },
    "Referido": { label: "Referido", color: "var(--chart-4)" },
    "Otro": { label: "Otro", color: "var(--chart-5)" },
};

export function AdminCharts({ charts }: AdminChartsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-[350px]">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-muted/10 rounded-xl animate-pulse" />)}
            </div>
        )
    }

    // Pre-calculate colors for Pie Chart to avoid CSS variable issues with spaces in keys
    const sourcesData = charts.sources.map(item => ({
        ...item,
        fill: sourcesConfig[item.name as keyof typeof sourcesConfig]?.color || "var(--muted)"
    }));

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Engagement por Vista */}
            <DashboardCard
                title="Engagement por Vista"
                description="Tiempo promedio"
                icon={<BarChartIcon className="h-4 w-4" />}
                className="col-span-1"
            >
                <div className="h-[250px] w-full">
                    <BaseBarChart
                        data={charts.engagement}
                        xKey="name"
                        yKey="value"
                        layout="vertical"
                        height={250}
                        showGrid={false}
                        config={engagementConfig}
                        color="var(--primary)"
                        chartClassName="h-full"
                    />
                </div>
            </DashboardCard>

            {/* 2. Actividad por Hora */}
            <DashboardCard
                title="Actividad por Hora"
                description="Sesiones por hora del día"
                icon={<Clock className="h-4 w-4" />}
                className="col-span-1"
            >
                <div className="h-[250px] w-full">
                    <BaseAreaChart
                        data={charts.activityByHour}
                        xKey="hour"
                        yKey="value"
                        height={250}
                        showGrid={false}
                        config={activityConfig}
                        color="var(--primary)"
                        chartClassName="h-full"
                    />
                </div>
            </DashboardCard>

            {/* 3. Crecimiento de Usuarios */}
            <DashboardCard
                title="Crecimiento"
                description="Registros por mes"
                icon={<TrendingUp className="h-4 w-4" />}
                className="col-span-1"
            >
                <div className="h-[250px] w-full">
                    <BaseAreaChart
                        data={charts.userGrowth}
                        xKey="name"
                        yKey="users"
                        height={250}
                        showGrid={false}
                        config={growthConfig}
                        gradient={true}
                        color="var(--primary)"
                        chartClassName="h-full"
                    />
                </div>
            </DashboardCard>

            {/* 4. Fuentes de Adquisición */}
            <DashboardCard
                title="Adquisición"
                description="Fuentes de tráfico"
                icon={<PieChartIcon className="h-4 w-4" />}
                className="col-span-1"
            >
                <div className="h-[250px] w-full">
                    <BasePieChart
                        data={sourcesData}
                        nameKey="name"
                        valueKey="value"
                        height={250}
                        innerRadius={60}
                        config={sourcesConfig}
                        chartClassName="h-full"
                    />
                </div>
            </DashboardCard>
        </div>
    );

}
