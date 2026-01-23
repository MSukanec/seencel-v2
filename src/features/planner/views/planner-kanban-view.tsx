import { PageWrapper } from "@/components/layout";
import { KanbanDashboard } from "@/features/planner/components/kanban-dashboard";

// ============================================================================
// KANBAN PAGE VIEW
// ============================================================================
// Shared view for Kanban that works in both Organization and Project contexts
// - Organization context: Shows all org boards
// - Project context: Shows only project-specific boards
// ============================================================================

interface KanbanPageViewProps {
    boards: any[];
    activeBoardId: string | null;
    activeBoardData: any | null;
    organizationId: string;
    projectId?: string | null;
    /** Base URL for navigation (e.g., "/organization/kanban" or "/project/123/kanban") */
    baseUrl: string;
}

export function KanbanPageView({
    boards,
    activeBoardId,
    activeBoardData,
    organizationId,
    projectId,
    baseUrl
}: KanbanPageViewProps) {
    return (
        <PageWrapper type="page" title="Kanban">
            <KanbanDashboard
                boards={boards}
                activeBoardId={activeBoardId}
                activeBoardData={activeBoardData}
                organizationId={organizationId}
                projectId={projectId}
                baseUrl={baseUrl}
            />
        </PageWrapper>
    );
}

