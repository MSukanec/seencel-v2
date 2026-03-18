import type { Metadata } from "next";
import {
    getOverviewHeroData,
    getRecentProjects,
    getUpcomingEvents,
    getRecentFiles,
    getActivityFeedItems,
} from "@/actions/widget-actions";
import { requireAuthContext } from "@/lib/auth";
import { OrganizationDashboardView } from "@/features/organization/views/organization-dashboard-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shell/page-wrapper";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({
        locale,
        namespace: 'OrganizationDashboard'
    });

    return {
        title: "Dashboard | Seencel",
        description: t('header.subtitle'),
        robots: "noindex, nofollow",
    };
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function OrganizationPage() {
    const t = await getTranslations('OrganizationDashboard');

    try {
        await requireAuthContext();

        // Prefetch card data in parallel (fault-tolerant — each card auto-fetches as fallback)
        const [heroData, projectsData, eventsData, galleryData, activityData] = await Promise.all([
            getOverviewHeroData(null).catch(() => null),
            getRecentProjects(6).catch(() => null),
            getUpcomingEvents('all', 8).catch(() => null),
            getRecentFiles('media', 'organization', 12).catch(() => null),
            getActivityFeedItems('all', 5).catch(() => null),
        ]);

        const prefetchedData: Record<string, any> = {};
        const entries: [string, any][] = [
            ['org_pulse', heroData],
            ['org_recent_projects', projectsData],
            ['upcoming_events', eventsData],
            ['recent_files_gallery', galleryData],
            ['activity_kpi', activityData],
        ];
        for (const [key, value] of entries) {
            if (value != null) prefetchedData[key] = value;
        }

        return (
            <PageWrapper
                title="Visión General"
                icon={<Building2 className="h-5 w-5" />}
            >
                <OrganizationDashboardView prefetchedData={prefetchedData} />
            </PageWrapper>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title={t('errors.unableToLoad')}
                    message={error instanceof Error ? error.message : t('errors.unknownError')}
                    retryLabel={t('errors.retry')}
                />
            </div>
        );
    }
}

