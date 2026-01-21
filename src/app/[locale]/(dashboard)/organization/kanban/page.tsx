import { getBoards, getBoardWithData } from "@/features/kanban/queries";
import { getDashboardData } from "@/features/organization/queries";
import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout";
import { KanbanDashboard } from "@/features/kanban/components/kanban-dashboard";

interface KanbanPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KanbanPage({ searchParams }: KanbanPageProps) {
    const dashboardData = await getDashboardData();

    if ('error' in dashboardData || !dashboardData.organization) {
        redirect("/organization");
    }

    // Safely extract organization ID
    const organization = dashboardData.organization as { id: string; name: string };
    const organizationId = organization.id;

    // 1. Get all boards for the tabs
    const boards = await getBoards(organizationId, null);

    // 2. Determine active board ID
    // Priority: URL Param -> First Board -> null
    const resolvedParams = await searchParams;
    const paramBoardId = typeof resolvedParams.boardId === 'string' ? resolvedParams.boardId : null;

    let activeBoardId = paramBoardId;

    // If no param, or param invalid (not in list), default to first board
    // BUT only auto-select if we actually have boards.
    if (!activeBoardId && boards.length > 0) {
        activeBoardId = boards[0].id;
    }

    // 3. Fetch Active Board Data (if we have an active board)
    let activeBoardData = null;
    if (activeBoardId) {
        activeBoardData = await getBoardWithData(activeBoardId);

        // Safety check: if board exists but data fetch failed (e.g. deleted?), reset
        if (!activeBoardData && boards.length > 0) {
            // Fallback: active board might be invalid/deleted, try first one again or just fail gracefully
            if (activeBoardId !== boards[0].id) {
                activeBoardData = await getBoardWithData(boards[0].id);
                activeBoardId = boards[0].id;
            }
        }
    }

    return (
        <PageWrapper type="page" title="Kanban">
            <KanbanDashboard
                boards={boards}
                activeBoardId={activeBoardId}
                activeBoardData={activeBoardData}
                organizationId={organizationId}
            />
        </PageWrapper>
    );
}
