import { getDashboardData } from "@/features/organization/queries";
import { FinanceChart } from "@/components/dashboard/finance-chart";
import { ProjectTable, ActivityFeed, ProjectCardsGrid } from "@/components/dashboard/widgets";
import {
    Users2,
    Folder,
    FileText,
    Briefcase,
    Loader2,
    Plus,
    Activity,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowRight
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

export default async function OrganizationPage() {
    const t = await getTranslations('OrganizationDashboard');
    const data: any = await getDashboardData();

    if (!data || data.error) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{t('errors.unableToLoad')}</h3>
                    <p className="text-sm text-muted-foreground w-full max-w-sm mx-auto">
                        {data?.error || t('errors.unknownError')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>{t('errors.retry')}</Button>
            </div>
        );
    }

    const { user, organization, stats, projects, movements } = data;
    const userName = user?.user_metadata?.first_name || 'Architect';

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('greeting.morning') : hour < 18 ? t('greeting.afternoon') : t('greeting.evening');

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Set header title to organization name */}
            <HeaderTitleUpdater title={organization.name} />

            {/* 1. Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('status.operational')}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {greeting}, {userName}.
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('header.subtitle')} <span className="font-semibold text-foreground">{organization.name}</span> {t('header.subtitleSuffix')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 hidden sm:flex">
                        <Users2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        {t('actions.inviteTeam')}
                    </Button>
                    <Button className="h-10 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('actions.newProject')}
                    </Button>
                </div>
            </div>

            {/* 2. KPI Grid (Spectacular Glass Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title={t('kpis.activeProjects')}
                    value={stats.activeProjects}
                    icon={Folder}
                    trend="+12%"
                    trendUp={true}
                    className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10"
                    iconColor="text-blue-500"
                    vsLabel={t('kpis.vsLastMonth')}
                />
                <KpiCard
                    title={t('kpis.totalBudget')}
                    value="$2.4M"
                    icon={DollarSign}
                    trend="+5.2%"
                    trendUp={true}
                    className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10"
                    iconColor="text-emerald-500"
                    vsLabel={t('kpis.vsLastMonth')}
                />
                <KpiCard
                    title={t('kpis.pendingTasks')}
                    value={stats.totalTasks}
                    icon={Briefcase}
                    trend="-2"
                    trendUp={true} // Less tasks is good
                    className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/10"
                    iconColor="text-purple-500"
                    vsLabel={t('kpis.vsLastMonth')}
                />
                <KpiCard
                    title={t('kpis.teamVelocity')}
                    value="87%"
                    icon={Activity}
                    trend="+3%"
                    trendUp={true}
                    className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10"
                    iconColor="text-amber-500"
                    vsLabel={t('kpis.vsLastMonth')}
                />
            </div>

            {/* 3. Main Dashboard Content (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Recent Projects */}
                <ProjectCardsGrid projects={projects} />

                {/* Right Column: Activity Feed */}
                <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                                <p className="text-xs text-muted-foreground">Últimas 5 actividades</p>
                            </div>
                        </div>
                        <Link
                            href={{ pathname: "/organization/settings", query: { tab: "activity" } }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            Ver Todos
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ActivityFeed activity={data.activity} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// Components (Internal)
// ----------------------------------------------------------------------------

function KpiCard({ title, value, icon: Icon, trend, trendUp, className, iconColor, vsLabel }: any) {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-md", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h2 className="text-3xl font-bold tracking-tight mt-2">{value}</h2>
                </div>
                <div className={cn("p-3 rounded-xl bg-background/50 backdrop-blur-md", iconColor)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1", trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                        {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </span>
                    <span className="text-xs text-muted-foreground">{vsLabel}</span>
                </div>
            )}
        </div>
    )
}
