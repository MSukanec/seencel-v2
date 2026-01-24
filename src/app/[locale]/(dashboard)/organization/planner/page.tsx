import { getBoards, getBoardWithData, getCalendarEvents } from "@/features/planner/queries";
import { getDashboardData } from "@/features/organization/queries";
import { getOrganizationProjects } from "@/features/projects/queries";
import { redirect } from "next/navigation";
import { PlannerPageView } from "@/features/planner/views";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

interface PlannerPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
    const dashboardData = await getDashboardData();

    if ('error' in dashboardData || !dashboardData.organization) {
        redirect("/organization");
    }

    const organization = dashboardData.organization as { id: string; name: string };
    const organizationId = organization.id;

    // Fetch data in parallel
    const [boards, calendarEvents, projects] = await Promise.all([
        getBoards(organizationId, null),
        getCalendarEvents(organizationId, { projectId: null }),
        getOrganizationProjects(organizationId)
    ]);

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
        />
    );
}

