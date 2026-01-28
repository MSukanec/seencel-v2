"use client";

import { RecentProjectsCard } from "@/features/projects/components/dashboard/recent-projects-card";
import { ActivityFeedCard } from "@/features/activity/components/activity-feed-card";
import {
    Folder,
    Briefcase,
    Users2,
    FileText
} from "lucide-react";
import { useTranslations } from "next-intl";
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

    // Get user name from metadata, fallback to email or generic greeting
    const userName = user?.user_metadata?.first_name
        || user?.user_metadata?.name?.split(' ')[0]
        || user?.email?.split('@')[0]
        || 'Usuario';

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('greeting.morning') : hour < 18 ? t('greeting.afternoon') : t('greeting.evening');

    return (
        <ContentLayout variant="wide">
            <div className="space-y-8 animate-in fade-in duration-700 pb-20">
                {/* 1. Header (Simplified - No buttons, no operational status) */}
                <div className="border-b border-border/40 pb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {greeting}, {userName}.
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('header.subtitle')} <span className="font-semibold text-foreground">{organization.name}</span> {t('header.subtitleSuffix')}
                    </p>
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
    );
}
