"use client";

import { useMemo } from "react";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { AdminCharts } from "./admin-charts";
import { Activity, Users, Building, Folder, UserPlus, Zap, UserMinus, Timer, TrendingDown, Lightbulb } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getViewName } from "@/lib/view-name-map";
import { InsightCard } from "@/features/insights/components/insight-card";
import { generateAdminInsights } from "@/features/insights/logic/admin";
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

    return (
        <div className="flex flex-col gap-6">
            {/* Hero KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardKpiCard
                    title="En línea ahora"
                    value={kpis.activeNow}
                    icon={<Users className="w-5 h-5" />}
                    description="Usuarios activos en este momento"
                />
                <DashboardKpiCard
                    title="Nuevos este mes"
                    value={kpis.newUsers}
                    icon={<UserPlus className="w-5 h-5" />}
                    trend={{ value: "+12%", direction: "up", label: "vs mes anterior" }}
                />
                <DashboardKpiCard
                    title="Total Registrados"
                    value={kpis.totalUsers}
                    icon={<Building className="w-5 h-5" />}
                />
                <DashboardKpiCard
                    title="En Riesgo"
                    value={lists.dropOff.length}
                    icon={<TrendingDown className="w-5 h-5" />}
                    description="Usuarios con baja actividad"
                />

                <DashboardKpiCard
                    title="Organizaciones"
                    value={kpis.totalOrgs}
                    icon={<Building className="w-5 h-5" />}
                />
                <DashboardKpiCard
                    title="Proyectos"
                    value={kpis.totalProjects}
                    icon={<Folder className="w-5 h-5" />}
                />
                <DashboardKpiCard
                    title="Duración Promedio"
                    value={formatDuration(kpis.avgSessionDuration)}
                    icon={<Timer className="w-5 h-5" />}
                    description="Tiempo medio por sesión"
                />
                <DashboardKpiCard
                    title="Tasa de Rebote"
                    value={`${kpis.bounceRate}%`}
                    icon={<Activity className="w-5 h-5" />}
                    trend={{ value: "-2.5%", direction: "down", label: "Mejorando" }}
                />
            </div>

            {/* Lists Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {/* Actividad Reciente */}
                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimas conexiones"
                    icon={<Activity className="h-4 w-4" />}
                    className="col-span-1"
                >
                    <div className="space-y-4">
                        {lists.recentActivity.map((user) => {
                            const lastSeen = user.user_presence?.last_seen_at ? new Date(user.user_presence.last_seen_at) : null;
                            const isActive = lastSeen && (new Date().getTime() - lastSeen.getTime() < 1000 * 60 * 5);
                            return (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <div className="text-sm font-medium leading-none truncate w-[120px]">{user.full_name}</div>
                                            <div className="text-xs text-muted-foreground truncate w-[120px]">
                                                {getViewName(user.user_presence?.current_view)}
                                            </div>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6 w-fit">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Activo
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DashboardCard>

                {/* Nuevos Usuarios */}
                <DashboardCard
                    title="Nuevos Usuarios"
                    description="Registrados recientemente"
                    icon={<UserPlus className="h-4 w-4" />}
                    className="col-span-1"
                >
                    <div className="space-y-4">
                        {lists.newRegistrations.map((user) => (
                            <div key={user.id} className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <div className="text-sm font-medium leading-none truncate w-[150px]">{user.full_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNowStrict(new Date(user.created_at), { addSuffix: true, locale: es })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* Top Usuarios */}
                <DashboardCard
                    title="Top Usuarios"
                    description="Mayor engagement"
                    icon={<Zap className="h-4 w-4" />}
                    className="col-span-1"
                >
                    <div className="space-y-4">
                        {lists.topUsers.map((user, i) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback className="bg-amber-100 text-amber-700">{user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <div className="text-sm font-medium leading-none truncate w-[120px]">{user.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{user.sessions} interacciones</div>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="h-5 w-auto min-w-[20px] justify-center bg-lime-100 text-lime-700">#{i + 1}</Badge>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* En Riesgo */}
                <DashboardCard
                    title="En Riesgo"
                    description="Poca actividad (Drop-off)"
                    icon={<UserMinus className="h-4 w-4" />}
                    className="col-span-1"
                >
                    <div className="space-y-4">
                        {lists.dropOff.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-2">
                                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                                </div>
                                <p className="text-xs text-muted-foreground">¡No hay usuarios en riesgo!</p>
                            </div>
                        ) : (
                            lists.dropOff.map((user) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <div className="text-sm font-medium leading-none truncate w-[150px]">{user.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{user.session_count} sesión{user.session_count !== 1 ? 'es' : ''}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DashboardCard>
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

