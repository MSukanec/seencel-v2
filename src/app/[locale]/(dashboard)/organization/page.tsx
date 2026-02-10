import type { Metadata } from "next";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { prefetchOrgWidgetData, getDashboardLayout } from "@/actions/widget-actions";
import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { createClient } from "@/lib/supabase/server";
import { OrganizationDashboardView } from "@/features/organization/views/organization-dashboard-view";
import { TeamActivityView } from "@/features/team/views/team-activity-view";
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
        title: "Dashboard | Seencel",
        description: t('header.subtitle'),
        robots: "noindex, nofollow",
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
        // Only fetch what's needed for the Activity tab
        const orgId = await getActiveOrganizationId();

        // Fetch settings + widget data + org name + saved layout in parallel
        const supabase = await createClient();
        const [settingsData, widgetData, orgResult, planFeatures, savedLayout] = await Promise.all([
            orgId ? getOrganizationSettingsData(orgId) : null,
            orgId ? prefetchOrgWidgetData(orgId) : {},
            orgId ? supabase.from("organizations").select("name").eq("id", orgId).single() : null,
            orgId ? getOrganizationPlanFeatures(orgId) : null,
            getDashboardLayout('org_dashboard'),
        ]);

        const activityLogs = settingsData?.activityLogs || [];
        const orgName = orgResult?.data?.name || "Organización";

        return (
            <Tabs defaultValue={defaultTab} syncUrl="view" className="h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title={orgName}
                    icon={<Building2 className="h-5 w-5" />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-0 h-full flex items-center justify-start">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="activity">Actividad</TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="overview" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <OrganizationDashboardView
                            prefetchedData={widgetData}
                            savedLayout={savedLayout}
                            isCustomDashboardEnabled={planFeatures?.custom_dashboard ?? false}
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <TeamActivityView logs={activityLogs} />
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
