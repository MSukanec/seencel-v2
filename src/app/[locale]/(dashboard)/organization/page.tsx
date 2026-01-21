import { getDashboardData } from "@/features/organization/queries";
import { OrganizationOverviewView } from "@/features/organization/views";
import { ErrorDisplay } from "@/components/ui/error-display";
import { getTranslations } from "next-intl/server";

export default async function OrganizationPage() {
    const t = await getTranslations('OrganizationDashboard');
    const data: any = await getDashboardData();

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

    const { user, organization, stats, projects, movements, activity } = data;

    return (
        <OrganizationOverviewView
            user={user}
            organization={organization}
            stats={stats}
            projects={projects}
            movements={movements}
            activity={activity}
        />
    );
}
