"use client";

import { ActivityFeedCard } from "@/features/activity/components/activity-feed-card";
import { ProjectCard } from "@/features/projects/components/project-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Link } from "@/i18n/routing";
import {
    Folder,
    Briefcase,
    Users2,
    FileText,
    LayoutGrid,
    ArrowRight
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentLayout } from "@/components/layout";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { getStorageUrl } from "@/lib/storage-utils";
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

    // Organization logo URL
    const logoUrl = organization.logo_path
        ? getStorageUrl(
            organization.logo_path.startsWith('organizations/')
                ? organization.logo_path
                : `organizations/${organization.logo_path}`,
            'public-assets'
        )
        : null;

    return (
        <ContentLayout variant="wide">
            <div className="space-y-8 animate-in fade-in duration-700 pb-20">
                {/* 1. Header with Organization Logo */}
                <div className="border-b border-border/40 pb-6">
                    <div className="flex items-center gap-5">
                        {/* Organization Logo */}
                        {logoUrl && (
                            <div className="shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border border-border/50 shadow-lg bg-background">
                                <img
                                    src={logoUrl}
                                    alt={organization.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {greeting}, {userName}.
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg">
                                {t('header.subtitle')} <span className="font-semibold text-foreground">{organization.name}</span> {t('header.subtitleSuffix')}
                            </p>
                        </div>
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
                    {/* Left Column: Recent Projects (inlined) */}
                    <DashboardCard
                        title="Proyectos Recientes"
                        description="Los últimos 3 proyectos activos"
                        icon={<LayoutGrid className="w-4 h-4" />}
                        headerAction={
                            <Link
                                href="/organization/projects"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                                Ver Todos
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        }
                    >
                        {projects.length === 0 ? (
                            <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                                <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">Sin proyectos activos.</p>
                                <Link
                                    href="/organization/projects"
                                    className="text-xs text-primary hover:underline mt-2 inline-block"
                                >
                                    Crear un proyecto
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.slice(0, 3).map((project) => (
                                    <ProjectCard key={project.id} project={project as any} />
                                ))}
                            </div>
                        )}
                    </DashboardCard>

                    {/* Right Column: Activity Feed */}
                    <ActivityFeedCard activity={activity} />
                </div>
            </div>
        </ContentLayout>
    );
}
