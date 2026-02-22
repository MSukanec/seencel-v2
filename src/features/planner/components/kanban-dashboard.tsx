"use client";

import { useState, useEffect } from "react";
import { KanbanBoard as KanbanBoardComponent } from "@/features/planner/components/kanban-board";
import { Project } from "@/types/project";
import { useActiveProjectId } from "@/stores/layout-store";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { LayoutDashboard } from "lucide-react";

// ============================================================================
// KANBAN DASHBOARD
// ============================================================================
// Pure rendering component for the Kanban board.
// Single-board architecture: each org has one implicit board.
// All toolbar/search/filters are managed by the parent PlannerView.
// ============================================================================

interface KanbanDashboardProps {
    activeBoardData: any | null;
    organizationId: string;
    projects?: Project[];
    /** Search query passed from parent Toolbar */
    searchQuery?: string;
    /** Selected priority filters from parent Toolbar */
    selectedPriorities?: string[];
    /** Selected label filters from parent Toolbar */
    selectedLabels?: string[];
    /** Whether the organization can invite members (Teams plan) */
    isTeamsEnabled?: boolean;
}

export function KanbanDashboard({
    activeBoardData,
    organizationId,
    projects = [],
    searchQuery = "",
    selectedPriorities = [],
    selectedLabels = [],
    isTeamsEnabled = false
}: KanbanDashboardProps) {
    const activeProjectId = useActiveProjectId();

    // No board data = empty state or loading
    if (!activeBoardData) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <ViewEmptyState
                    mode="empty"
                    icon={LayoutDashboard}
                    viewName="Panel de Tareas"
                    featureDescription="El panel de tareas es tu espacio para organizar ideas, pendientes y cosas por hacer. Creá columnas que representen estados (por hacer, en progreso, listo) y arrastrá tarjetas entre ellas."
                    docsPath="/docs/agenda/introduccion"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden relative">
                <KanbanBoardComponent
                    board={activeBoardData.board}
                    lists={activeBoardData.lists}
                    labels={activeBoardData.labels}
                    members={activeBoardData.members || []}
                    projects={projects}
                    searchQuery={searchQuery}
                    selectedPriorities={selectedPriorities}
                    selectedLabels={selectedLabels}
                    isTeamsEnabled={isTeamsEnabled}
                />
            </div>
        </div>
    );
}
