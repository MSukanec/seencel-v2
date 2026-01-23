"use client";

import { RecentProjectsCard } from "@/features/projects/components/dashboard/recent-projects-card";
import { ActivityFeedCard } from "@/features/activity/components/dashboard/activity-feed-card";
import {
    Folder,
    Briefcase,
    Plus,
    Users2,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { HeaderTitleUpdater } from "@/components/layout";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import type {
    Organization,
    DashboardStats,
    DashboardProject,
    DashboardActivity
} from "@/features/organization/types";
import type { User } from "@supabase/supabase-js";

interface OrganizationOverviewViewProps {
    user: User;
    organization: Organization;
    stats: DashboardStats;
    projects: DashboardProject[];
    activity: DashboardActivity[];
}

export function OrganizationOverviewView({
    user,
    organization,
    stats,
    projects,
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

                    {/* 2. KPI Grid (Real Data - No Hardcoded Values) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DashboardKpiCard
                            title={t('kpis.activeProjects')}
                            value={stats.activeProjects}
                            icon={<Folder className="w-5 h-5" />}
                        />
                        <DashboardKpiCard
                            title={t('kpis.pendingTasks')}
                            value={stats.totalTasks}
                            icon={<Briefcase className="w-5 h-5" />}
                        />
                        <DashboardKpiCard
                            title={t('kpis.documentsLast30Days')}
                            value={stats.documentsLast30Days}
                            icon={<FileText className="w-5 h-5" />}
                        />
                        <DashboardKpiCard
                            title={t('kpis.teamSize')}
                            value={stats.teamSize}
                            icon={<Users2 className="w-5 h-5" />}
                        />
                    </div>

                    {/* 3. Main Dashboard Content (2 Columns) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Recent Projects */}
                        <RecentProjectsCard projects={projects} />

                        {/* Right Column: Activity Feed */}
                        <ActivityFeedCard activity={activity} />
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}

