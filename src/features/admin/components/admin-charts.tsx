"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { BarChart as BarChartIcon, Clock, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardData } from "@/features/admin/queries";
import { LazyBarChart as BaseBarChart, LazyAreaChart as BaseAreaChart, LazyDonutChart as BaseDonutChart } from "@/components/charts/lazy-charts";

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

    // Country data is already prepared with fill colors from the query
    const countryData = charts.countryDistribution;

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

            {/* 4. Distribución por País */}
            <DashboardCard
                title="Países"
                description="Distribución de usuarios"
                icon={<PieChartIcon className="h-4 w-4" />}
                className="col-span-1"
            >
                <div className="h-[250px] w-full">
                    <BaseDonutChart
                        data={countryData}
                        nameKey="name"
                        valueKey="value"
                        height={140}
                        showLegend={true}
                        showPercentage={true}
                        autoFormat={false}
                        tooltipFormatter={(val) => `${val} usuarios`}
                        legendFormatter={(val) => `${val}`}
                    />
                </div>
            </DashboardCard>
        </div>
    );

}

