"use client";

import { useMemo } from "react";
import { BentoKpiCard, BentoListCard, type BentoListItem } from "@/components/widgets/grid";
import { AdminCharts } from "./admin-charts";
import {
    Activity, Users, Building, Folder, UserPlus, Zap,
    UserMinus, Timer, TrendingDown, Lightbulb
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getViewName } from "@/lib/view-name-map";
import { InsightCard } from "@/features/insights/components/insight-card";
import { generateAdminInsights } from "@/features/insights/logic/admin";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { DashboardData, AdminUser } from "../queries";

interface AdminDashboardViewProps {
    data: DashboardData;
}

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
    const { kpis, charts, lists } = data;

    // Generate insights from dashboard data
    const insights = useMemo(() => {
        return generateAdminInsights({ kpis, charts, lists });
    }, [kpis, charts, lists]);

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    // Transform users for BentoListCard format
    const recentActivityItems: BentoListItem[] = useMemo(() =>
        lists.recentActivity.map((user) => {
            const lastSeen = user.user_presence?.last_seen_at ? new Date(user.user_presence.last_seen_at) : null;
            const isActive = lastSeen && (new Date().getTime() - lastSeen.getTime() < 1000 * 60 * 5);
            return {
                id: user.id,
                avatar: user.avatar_url || undefined,
                title: user.full_name || 'Usuario',
                subtitle: getViewName(user.user_presence?.current_view),
                status: isActive ? 'active' as const : undefined
            };
        }),
        [lists.recentActivity]);

    const newUsersItems: BentoListItem[] = useMemo(() =>
        lists.newRegistrations.map((user) => ({
            id: user.id,
            avatar: user.avatar_url || undefined,
            title: user.full_name || 'Usuario',
            subtitle: formatDistanceToNowStrict(new Date(user.created_at), { addSuffix: true, locale: es })
        })),
        [lists.newRegistrations]);

    const topUsersItems: BentoListItem[] = useMemo(() =>
        lists.topUsers.map((user) => ({
            id: user.id,
            avatar: user.avatar_url || undefined,
            title: user.full_name || 'Usuario',
            subtitle: `${user.sessions} interacciones`
        })),
        [lists.topUsers]);

    const dropOffItems: BentoListItem[] = useMemo(() =>
        lists.dropOff.map((user) => ({
            id: user.id,
            avatar: user.avatar_url || undefined,
            title: user.full_name || 'Usuario',
            subtitle: `${user.session_count} sesión${user.session_count !== 1 ? 'es' : ''}`,
            status: 'warning' as const
        })),
        [lists.dropOff]);

    // Extract chart data for sparklines
    const userGrowthData = useMemo(() =>
        charts.userGrowth?.map(d => d.users) || [],
        [charts.userGrowth]);

    const activityByHourData = useMemo(() =>
        charts.activityByHour?.map(d => d.value) || [],
        [charts.activityByHour]);

    return (
        <div className="flex flex-col gap-6">
            {/* Hero Bento Grid - KPIs with embedded charts */}
            <div className="grid grid-cols-1 auto-rows-fr md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Featured KPI with chart */}
                <BentoKpiCard
                    size="sm"
                    title="Usuarios Totales"
                    value={kpis.totalUsers}
                    icon={<Users className="w-5 h-5" />}
                    chartType="area"
                    chartData={userGrowthData}
                    chartPosition="background"
                    chartColor="#a3e635"
                />

                {/* Secondary KPIs */}
                <BentoKpiCard
                    title="En línea ahora"
                    value={kpis.activeNow}
                    icon={<Activity className="w-5 h-5" />}
                    accentColor="#22c55e"
                />

                <BentoKpiCard
                    title="Nuevos este mes"
                    value={kpis.newUsers}
                    icon={<UserPlus className="w-5 h-5" />}
                    trend={{ value: "+12%", direction: "up", label: "vs mes anterior" }}
                />

                <BentoKpiCard
                    title="En Riesgo"
                    value={lists.dropOff.length}
                    icon={<TrendingDown className="w-5 h-5" />}
                    accentColor={lists.dropOff.length > 0 ? "#ef4444" : undefined}
                />

                {/* Row 2 - More KPIs with mini charts */}
                <BentoKpiCard
                    title="Organizaciones"
                    value={kpis.totalOrgs}
                    icon={<Building className="w-5 h-5" />}
                />

                <BentoKpiCard
                    title="Proyectos"
                    value={kpis.totalProjects}
                    icon={<Folder className="w-5 h-5" />}
                />

                <BentoKpiCard
                    title="Duración Promedio"
                    value={formatDuration(kpis.avgSessionDuration)}
                    icon={<Timer className="w-5 h-5" />}
                    chartType="bar"
                    chartData={activityByHourData.slice(0, 8)}
                    chartPosition="bottom"
                />

                <BentoKpiCard
                    title="Tasa de Rebote"
                    value={`${kpis.bounceRate}%`}
                    icon={<Activity className="w-5 h-5" />}
                    trend={{ value: "-2.5%", direction: "down", label: "Mejorando" }}
                />
            </div>

            {/* Lists Row - Using BentoListCard */}
            <div className="grid grid-cols-1 auto-rows-fr md:grid-cols-2 lg:grid-cols-4 gap-4">
                <BentoListCard
                    title="Actividad Reciente"
                    description="Últimas conexiones"
                    icon={<Activity className="h-4 w-4" />}
                    items={recentActivityItems}
                    size="tall"
                />

                <BentoListCard
                    title="Nuevos Usuarios"
                    description="Registrados recientemente"
                    icon={<UserPlus className="h-4 w-4" />}
                    items={newUsersItems}
                    size="tall"
                />

                <BentoListCard
                    title="Top Usuarios"
                    description="Mayor engagement"
                    icon={<Zap className="h-4 w-4" />}
                    items={topUsersItems}
                    showRank
                    size="tall"
                />

                <BentoListCard
                    title="En Riesgo"
                    description="Poca actividad (Drop-off)"
                    icon={<UserMinus className="h-4 w-4" />}
                    items={dropOffItems}
                    size="tall"
                />
            </div>

            {/* Insights Row */}
            {insights.length > 0 && (
                <DashboardCard
                    title="Insights"
                    description="Análisis automático de tu plataforma"
                    icon={<Lightbulb className="h-4 w-4" />}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {insights.slice(0, 6).map((insight) => (
                            <InsightCard key={insight.id} insight={insight} />
                        ))}
                    </div>
                </DashboardCard>
            )}

            {/* Charts Row */}
            <AdminCharts charts={charts} />
        </div>
    );
}
