import { getBoards, getBoardWithData, getCalendarEvents } from "@/features/planner/queries";
import { getDashboardData } from "@/features/organization/queries";
import { getActiveOrganizationProjects } from "@/features/projects/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { redirect } from "next/navigation";
import { PlannerView } from "@/features/planner/views/planner-view";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Planner' });

    return {
        title: `${t('title')} | SEENCEL`,
        description: t('title'),
        robots: "noindex, nofollow",
    };
}

export default async function PlannerPage() {
    try {
        const dashboardData = await getDashboardData();

        if ('error' in dashboardData || !dashboardData.organization) {
            redirect("/organization");
        }

        const organization = dashboardData.organization as { id: string; name: string };
        const organizationId = organization.id;

        // Fetch data in parallel
        const [boards, calendarEvents, projects, planFeatures] = await Promise.all([
            getBoards(organizationId),
            getCalendarEvents(organizationId),
            getActiveOrganizationProjects(organizationId),
            getOrganizationPlanFeatures(organizationId)
        ]);

        const isTeamsEnabled = planFeatures?.can_invite_members ?? false;

        // Single-board architecture: auto-resolve the first (default) board
        let activeBoardData = null;
        if (boards.length > 0) {
            activeBoardData = await getBoardWithData(boards[0].id);
        }

        return (
            <PlannerView
                activeBoardData={activeBoardData}
                organizationId={organizationId}
                calendarEvents={calendarEvents}
                projects={projects}
                isTeamsEnabled={isTeamsEnabled}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el planificador"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
