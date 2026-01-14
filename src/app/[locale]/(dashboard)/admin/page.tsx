import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/features/admin/queries";
import { AdminCharts } from "@/features/admin/components/admin-charts";
import { Activity, Users, Building, Folder, ArrowRight, UserPlus, Zap, UserMinus, Timer, TrendingDown, Route } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { getViewName } from "@/lib/view-name-map";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

export default async function AdminDashboard() {
    const { kpis, charts, lists } = await getAdminDashboardData();

    // Helper to format seconds to readable time
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <PageWrapper type="dashboard">
            <ContentLayout variant="wide">
                <div className="flex flex-col gap-6">
                    {/* Hero KPIs - Consolidated */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Card 1: Usuarios */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-lime-500/20">
                                            <Users className="h-5 w-5 text-lime-500" />
                                        </div>
                                        <CardTitle className="text-lg">Usuarios</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="text-lime-600 border-lime-500/30">En vivo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-lime-500">{kpis.activeNow}</div>
                                        <p className="text-xs text-muted-foreground mt-1">En línea ahora</p>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold">{kpis.newUsers}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Nuevos este mes</p>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold">{kpis.totalUsers}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Total registrados</p>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-amber-500">{lists.dropOff.length}</div>
                                        <p className="text-xs text-muted-foreground mt-1">En riesgo</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 2: Plataforma & Engagement */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-violet-500/20">
                                            <Activity className="h-5 w-5 text-violet-500" />
                                        </div>
                                        <CardTitle className="text-lg">Plataforma & Engagement</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold">{kpis.totalOrgs}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Organizaciones</p>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold">{kpis.totalProjects}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Proyectos</p>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-lime-500">{formatDuration(kpis.avgSessionDuration)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">Duración promedio</p>
                                    </div>
                                    <div>
                                        <div className={`text-3xl md:text-4xl font-bold ${kpis.bounceRate > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {kpis.bounceRate}%
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Tasa de rebote</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lists Row - MOVED UP */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Actividad Reciente */}
                        <Card className="col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Actividad Reciente</CardTitle>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardDescription>Últimas conexiones</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                                    Activo ahora
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* 2. Usuarios Registrados */}
                        <Card className="col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Usuarios Registrados</CardTitle>
                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardDescription>Nuevos registros</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* 3. Top Usuarios Activos */}
                        <Card className="col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Top Usuarios</CardTitle>
                                    <Zap className="h-4 w-4 text-amber-500" />
                                </div>
                                <CardDescription>Mayor engagement</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* 4. Drop Off / En Riesgo */}
                        <Card className="col-span-1">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">En Riesgo</CardTitle>
                                    <UserMinus className="h-4 w-4 text-amber-500" />
                                </div>
                                <CardDescription>Usuarios con poca actividad</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {lists.dropOff.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">¡No hay usuarios en riesgo! 🎉</p>
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <AdminCharts charts={charts} />

                    {/* User Journeys - ENTERPRISE */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Route className="h-4 w-4 text-lime-500" />
                                        User Journeys (Últimas Sesiones)
                                    </CardTitle>
                                    <CardDescription>Flujo de navegación de usuarios reales</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lists.userJourneys.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Route className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Aún no hay datos de sesiones.</p>
                                    <p className="text-xs mt-1">Los journeys aparecerán cuando el frontend implemente <code className="bg-muted px-1 rounded">session_id</code>.</p>
                                </div>
                            ) : (
                                lists.userJourneys.map((journey) => (
                                    <div key={journey.session_id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                        <Avatar className="h-8 w-8 mt-0.5">
                                            <AvatarImage src={journey.avatar_url || ""} />
                                            <AvatarFallback>{journey.user_name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{journey.user_name}</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {journey.steps.map((step, i) => (
                                                    <span key={i} className="inline-flex items-center">
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-background">
                                                            {step.view}
                                                            {step.duration > 0 && <span className="ml-1 text-muted-foreground">({formatDuration(step.duration)})</span>}
                                                        </Badge>
                                                        {i < journey.steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
