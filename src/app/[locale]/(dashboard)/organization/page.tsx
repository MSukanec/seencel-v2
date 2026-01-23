import type { Metadata } from "next";
import { getDashboardData } from "@/features/organization/queries";
import { OrganizationOverviewView } from "@/features/organization/views";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getTranslations } from "next-intl/server";

// ============================================
// METADATA (SEO)
// ============================================
export async function generateMetadata({
    params
}: {
    params: { locale: string }
}): Promise<Metadata> {
    const t = await getTranslations({
        locale: params.locale,
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
export default async function OrganizationPage() {
    const t = await getTranslations('OrganizationDashboard');
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

    // After the error guard, we know data has all required fields
    const { user, organization, stats, projects, activity } = data;

    // TypeScript needs explicit assertions after the guard
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

    return (
        <OrganizationOverviewView
            user={user}
            organization={organization as unknown as import("@/features/organization/types").Organization}
            stats={stats}
            projects={projects || []}
            activity={activity || []}
        />
    );
}

