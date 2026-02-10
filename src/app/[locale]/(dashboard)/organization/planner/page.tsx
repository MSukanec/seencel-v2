import { getBoards, getBoardWithData, getCalendarEvents } from "@/features/planner/queries";
import { getDashboardData } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { redirect } from "next/navigation";
import { PlannerPageView } from "@/features/planner/views/planner-page";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { ErrorDisplay } from "@/components/ui/error-display";

interface PlannerPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
    try {
        const dashboardData = await getDashboardData();

        if ('error' in dashboardData || !dashboardData.organization) {
            redirect("/organization");
        }

        const organization = dashboardData.organization as { id: string; name: string };
        const organizationId = organization.id;

        // Fetch data in parallel
        const [boards, calendarEvents, projects, planFeatures] = await Promise.all([
            getBoards(organizationId, null),
            getCalendarEvents(organizationId, { projectId: null }),
            getOrganizationProjects(organizationId),
            getOrganizationPlanFeatures(organizationId)
        ]);

        // Get max boards from plan (-1 = unlimited)
        const maxBoards = planFeatures?.max_org_boards ?? -1;

        // Determine active board ID from URL params
        const resolvedParams = await searchParams;
        const paramBoardId = typeof resolvedParams.boardId === 'string' ? resolvedParams.boardId : null;

        let activeBoardId = paramBoardId;
        if (!activeBoardId && boards.length > 0) {
            activeBoardId = boards[0].id;
        }

        // Fetch Active Board Data
        let activeBoardData = null;
        if (activeBoardId) {
            activeBoardData = await getBoardWithData(activeBoardId);
            if (!activeBoardData && boards.length > 0 && activeBoardId !== boards[0].id) {
                activeBoardData = await getBoardWithData(boards[0].id);
                activeBoardId = boards[0].id;
            }
        }

        return (
            <PlannerPageView
                boards={boards}
                activeBoardId={activeBoardId}
                activeBoardData={activeBoardData}
                organizationId={organizationId}
                projectId={null}
                baseUrl="/organization/planner"
                calendarEvents={calendarEvents}
                projects={projects}
                maxBoards={maxBoards}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar la agenda"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
