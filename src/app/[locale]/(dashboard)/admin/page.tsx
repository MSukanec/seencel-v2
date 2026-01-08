import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/features/admin/queries";
import { AdminCharts } from "./admin-charts";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { Activity, Users, Building, Folder, ArrowRight, UserPlus, Zap, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { PageLayout } from "@/components/layout/page-layout";

export default async function AdminDashboard() {
    const { kpis, charts, lists } = await getAdminDashboardData();

    return (
        <PageLayout variant="wide">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Admin <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Visión General</span>
                </span>
            } />

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                        <Activity className="h-4 w-4 text-lime-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-lime-600">{kpis.activeNow}</div>
                        <p className="text-xs text-muted-foreground">activos hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.newUsers}</div>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizaciones</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalOrgs}</div>
                        <p className="text-xs text-muted-foreground">Activas ({kpis.totalOrgs} totales)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">nuevos este mes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <AdminCharts charts={charts} />

            {/* Lists Row */}
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
                        {lists.recentActivity.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-0.5">
                                        <div className="text-sm font-medium leading-none truncate w-[120px]">{user.full_name}</div>
                                        <div className="text-xs text-muted-foreground truncate w-[120px]">
                                            {(() => {
                                                const view = user.user_presence?.current_view || '';
                                                const cleanView = view.split('?')[0].replace(/^\/|\/$/g, '');

                                                const viewMap: Record<string, string> = {
                                                    '': 'Inicio',
                                                    'admin': 'Admin',
                                                    'admin/users': 'Usuarios',
                                                    'admin/organizations': 'Organizaciones',
                                                    'dashboard': 'Tablero',
                                                    'settings': 'Ajustes',
                                                    'profile': 'Perfil'
                                                };

                                                // Try exact match or fallback to formatted string
                                                return viewMap[cleanView] || (cleanView ? cleanView.replace(/_/g, ' ') : 'Navegando');
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-lime-500/10 text-lime-600 border-lime-500/20 text-[10px] h-5 px-1.5">
                                    En línea
                                </Badge>
                            </div>
                        ))}
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
                            <CardTitle className="text-base">Top Usuarios Activos</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
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
                                        <div className="text-xs text-muted-foreground">{user.sessions} sesiones</div>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="h-5 w-auto min-w-[20px] justify-center bg-lime-100 text-lime-700">#{i + 1}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 4. Drop Off */}
                <Card className="col-span-1">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Drop Off</CardTitle>
                            <UserMinus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <CardDescription>Baja actividad (1-2 sesiones)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lists.dropOff.map((user) => (
                            <div key={user.id} className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <div className="text-sm font-medium leading-none truncate w-[150px]">{user.full_name}</div>
                                    <div className="text-xs text-muted-foreground">1 sesión</div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
