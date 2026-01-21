"use client";

import { FinanceCashFlowWidget } from "@/features/finance/components/dashboard/finance-cash-flow-widget";
import { ProjectStatusCard } from "@/features/projects/components/dashboard/project-status-card";
import { RecentProjectsCard } from "@/features/projects/components/dashboard/recent-projects-card";
import { ActivityFeedCard } from "@/features/activity/components/dashboard/activity-feed-card";
import {
    Folder,
    Briefcase,
    Plus,
    Activity,
    DollarSign,
    Users2
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { HeaderTitleUpdater } from "@/components/layout";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";

interface OrganizationOverviewViewProps {
    user: any;
    organization: any;
    stats: any;
    projects: any[];
    movements: any[];
    activity: any[];
}

export function OrganizationOverviewView({
    user,
    organization,
    stats,
    projects,
    movements,
    activity
}: OrganizationOverviewViewProps) {
    const t = useTranslations('OrganizationDashboard');

    const userName = user?.user_metadata?.first_name || 'Architect';

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('greeting.morning') : hour < 18 ? t('greeting.afternoon') : t('greeting.evening');

    return (
        <PageWrapper type="dashboard">
            <ContentLayout variant="wide">
                <HeaderTitleUpdater title={organization.name} />

                <div className="space-y-8 animate-in fade-in duration-700 pb-20">
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
                        <DashboardKpiCard
                            title={t('kpis.activeProjects')}
                            value={stats.activeProjects}
                            icon={<Folder className="w-5 h-5" />}
                            trend={{ value: "+12%", direction: "up", label: t('kpis.vsLastMonth') }}
                        />
                        <DashboardKpiCard
                            title={t('kpis.totalBudget')}
                            value="$2.4M"
                            icon={<DollarSign className="w-5 h-5" />}
                            trend={{ value: "+5.2%", direction: "up", label: t('kpis.vsLastMonth') }}
                        />
                        <DashboardKpiCard
                            title={t('kpis.pendingTasks')}
                            value={stats.totalTasks}
                            icon={<Briefcase className="w-5 h-5" />}
                            trend={{ value: "-2", direction: "up", label: t('kpis.vsLastMonth') }}
                        />
                        <DashboardKpiCard
                            title={t('kpis.teamVelocity')}
                            value="87%"
                            icon={<Activity className="w-5 h-5" />}
                            trend={{ value: "+3%", direction: "up", label: t('kpis.vsLastMonth') }}
                        />
                    </div>

                    {/* 3. Main Dashboard Content (2 Columns) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Recent Projects */}
                        <RecentProjectsCard projects={projects} />

                        {/* Right Column: Activity Feed */}
                        <ActivityFeedCard activity={activity} className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col items-stretch" />
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
