import type { Metadata } from "next";
import { getDashboardData } from "@/features/organization/queries";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getActiveOrganizationId } from "@/actions/general-costs";
import { OrganizationOverviewView } from "@/features/organization/views";
import { ActivitySettingsView } from "@/features/organization/views/organization-activity-settings-view";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PageWrapper } from "@/components/layout/dashboard/shared/page-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        title: "Dashboard | SEENCEL",
        description: t('header.subtitle'),
        robots: "noindex, nofollow", // Private dashboard
    };
}

// ============================================
// PAGE COMPONENT
// ============================================
interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ view?: string }>;
}

export default async function OrganizationPage({ params, searchParams }: Props) {
    const t = await getTranslations('OrganizationDashboard');
    const { view } = await searchParams;
    const defaultTab = view === 'activity' ? 'activity' : 'overview';

    try {
        // Fetch dashboard data
        const data = await getDashboardData();

        if (!data || data.error) {
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title={t('errors.unableToLoad')}
                        message={data?.error || t('errors.unknownError')}
                        retryLabel={t('errors.retry')}
                    />
                </div>
            );
        }

        const { user, organization, stats, projects, activity } = data;

        if (!user || !organization || !stats) {
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <ErrorDisplay
                        title={t('errors.unableToLoad')}
                        message={t('errors.unknownError')}
                        retryLabel={t('errors.retry')}
                    />
                </div>
            );
        }

        // Fetch activity logs for the activity tab
        const orgId = await getActiveOrganizationId();
        const settingsData = orgId ? await getOrganizationSettingsData(orgId) : null;
        const activityLogs = settingsData?.activityLogs || [];

        return (
            <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={(organization as { name: string }).name}
                    icon={<Building2 className="h-5 w-5" />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="activity">Actividad</TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <OrganizationOverviewView
                            user={user}
                            organization={organization as unknown as import("@/features/organization/types").Organization}
                            stats={stats}
                            projects={projects || []}
                            activity={activity || []}
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ActivitySettingsView logs={activityLogs} />
                    </TabsContent>
                </PageWrapper>
            </Tabs>
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
