import { getBoards, getBoardWithData, getCalendarEvents } from "@/features/planner/queries";
import { getProjectById } from "@/features/projects/queries";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { notFound } from "next/navigation";
import { PlannerPageView } from "@/features/planner/views/planner-page";

interface PlannerPageProps {
    params: Promise<{ projectId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectPlannerPage({ params, searchParams }: PlannerPageProps) {
    const { projectId } = await params;

    // Verify project exists and get org ID
    const project = await getProjectById(projectId);
    if (!project) {
        notFound();
    }

    const organizationId = project.organization_id;

    // Fetch data in parallel
    const [boards, calendarEvents, planFeatures] = await Promise.all([
        getBoards(organizationId, projectId),
        getCalendarEvents(organizationId, { projectId }),
        getOrganizationPlanFeatures(organizationId)
    ]);

    const isTeamsEnabled = planFeatures?.can_invite_members ?? false;

    // Determine active board ID from URL params
    const resolvedParams = await searchParams;
    const paramBoardId = typeof resolvedParams.boardId === 'string' ? resolvedParams.boardId : null;

    let activeBoardId = paramBoardId;
    if (!activeBoardId && boards.length > 0) {
        activeBoardId = boards[0].id;
    }

    // Fetch Active Board Data (filtered by project)
    let activeBoardData = null;
    if (activeBoardId) {
        activeBoardData = await getBoardWithData(activeBoardId, projectId);
        if (!activeBoardData && boards.length > 0 && activeBoardId !== boards[0].id) {
            activeBoardData = await getBoardWithData(boards[0].id, projectId);
            activeBoardId = boards[0].id;
        }
    }

    return (
        <PlannerPageView
            boards={boards}
            activeBoardId={activeBoardId}
            activeBoardData={activeBoardData}
            organizationId={organizationId}
            projectId={projectId}
            baseUrl={`/project/${projectId}/planner`}
            calendarEvents={calendarEvents}
            isTeamsEnabled={isTeamsEnabled}
        />
    );
}

