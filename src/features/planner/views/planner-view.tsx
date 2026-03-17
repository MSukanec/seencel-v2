"use client";

import { useState, useCallback, useMemo } from "react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useSearchParams, usePathname } from "next/navigation";
import { CalendarDays, Plus, List, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";

import { PageHeaderActionPortal } from "@/components/layout";
import { ToolbarCard, SearchButton, FilterPopover, DisplayButton } from "@/components/shared/toolbar-controls";
import { ViewEmptyState } from "@/components/shared/empty-state";

import { PlannerCalendar } from "@/features/planner/components/planner-calendar";
import { PlannerList } from "@/features/planner/components/planner-list";
import { KanbanDashboard } from "@/features/planner/components/kanban-dashboard";
import { PlannerItem, PRIORITY_CONFIG } from "@/features/planner/types";

import { useTranslations } from "next-intl";
import { usePanel } from "@/stores/panel-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";

// ============================================================================
// PLANNER VIEW (Unified Orchestrator)
// ============================================================================

type ViewMode = "list" | "kanban" | "calendar";

const VIEW_MODE_OPTIONS = [
    { value: "list" as const, label: "Lista", icon: List },
    { value: "kanban" as const, label: "Panel", icon: LayoutGrid },
    { value: "calendar" as const, label: "Calendario", icon: CalendarIcon },
];

// ── Filter options ──────────────────────────────────────────────────
const TYPE_FACET = { key: "type", title: "Tipo", options: [
    { label: "Manual", value: "manual" },
    { label: "Kanban", value: "kanban_card" },
    { label: "Pagos", value: "payment" },
    { label: "Hitos", value: "quote_milestone" },
]};

const PRIORITY_FILTER_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    label: config.label,
    value: key,
}));

// ── Props ───────────────────────────────────────────────────────────

interface PlannerViewProps {
    activeBoardData: any | null;
    organizationId: string;
    calendarEvents: PlannerItem[];
    projects?: Project[];
    isTeamsEnabled?: boolean;
}

export function PlannerView({
    activeBoardData,
    organizationId,
    calendarEvents,
    projects,
    isTeamsEnabled = false
}: PlannerViewProps) {
    const t = useTranslations('Planner');
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { openPanel, closePanel } = usePanel();
    const activeProjectId = useActiveProjectId();

    // ── Optimistic List ────────────────────────────────────────────────
    const {
        optimisticItems: optimisticEvents,
        addItem: addOptimisticEvent,
    } = useOptimisticList({
        items: calendarEvents,
        getItemId: (item) => item.id,
    });

    // ── View Mode ──────────────────────────────────────────────────────
    const initialMode = (searchParams.get("view") as ViewMode) || "list";
    const [viewMode, setViewMode] = useState<ViewMode>(
        VIEW_MODE_OPTIONS.some(o => o.value === initialMode) ? initialMode : "list"
    );

    const handleModeChange = useCallback((value: string) => {
        const mode = value as ViewMode;
        setViewMode(mode);
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", mode);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }, [pathname, searchParams]);

    // ── Filters (useTableFilters) ──────────────────────────────────────
    const labelFilterOptions = useMemo(() =>
        activeBoardData?.labels?.map((l: any) => ({ label: l.name, value: l.id })) || [],
        [activeBoardData?.labels]
    );

    const facetConfigs = useMemo(() => {
        if (viewMode === "kanban") {
            return [
                { key: "priority", title: "Prioridad", options: PRIORITY_FILTER_OPTIONS },
                ...(labelFilterOptions.length > 0
                    ? [{ key: "label", title: "Etiquetas", options: labelFilterOptions }]
                    : []),
            ];
        }
        return [TYPE_FACET];
    }, [viewMode, labelFilterOptions]);

    const filters = useTableFilters({ facets: facetConfigs });

    // ── Filtered Events ────────────────────────────────────────────────
    const filteredEvents = useMemo(() => {
        return optimisticEvents.filter(event => {
            if (activeProjectId && event.project_id && event.project_id !== activeProjectId) return false;

            const q = filters.searchQuery.toLowerCase();
            if (q && !event.title.toLowerCase().includes(q) && !event.description?.toLowerCase().includes(q)) return false;

            const typeFilter = filters.facetValues.type;
            if (typeFilter?.size > 0) {
                const src = event.source_type || 'manual';
                if (!typeFilter.has(src)) return false;
            }

            return true;
        });
    }, [optimisticEvents, filters.searchQuery, filters.facetValues, activeProjectId]);

    // ── Panel handlers ─────────────────────────────────────────────────
    const handleCreateEvent = useCallback(() => {
        openPanel('planner-event-form', {
            organizationId,
            projectId: activeProjectId,
            defaultDate: new Date(),
            boardId: activeBoardData?.board?.id || null,
            listId: activeBoardData?.lists?.[0]?.id || null,
            members: activeBoardData?.members || [],
            isTeamsEnabled,
            projects,
            onCancel: closePanel,
            onOptimisticCreate: addOptimisticEvent,
            onSuccess: () => { closePanel(); router.refresh(); },
        });
    }, [organizationId, activeProjectId, activeBoardData, isTeamsEnabled, projects, openPanel, closePanel, router, addOptimisticEvent]);

    const handleEditEvent = useCallback((event: PlannerItem) => {
        openPanel('planner-event-form', {
            organizationId,
            initialData: event,
            members: activeBoardData?.members || [],
            isTeamsEnabled,
            projects,
            onCancel: closePanel,
            onSuccess: () => { closePanel(); router.refresh(); },
        });
    }, [organizationId, activeBoardData, isTeamsEnabled, projects, openPanel, closePanel, router]);

    // ── Empty State (early return → centered) ──────────────────────────
    if (optimisticEvents.length === 0) {
        return (
            <>
                <PageHeaderActionPortal>
                    <Button size="sm" onClick={handleCreateEvent}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nueva Actividad
                    </Button>
                </PageHeaderActionPortal>
                <ViewEmptyState
                    mode="empty"
                    icon={CalendarDays}
                    viewName={t('title')}
                    featureDescription={t('emptyState.description')}
                    onAction={handleCreateEvent}
                    actionLabel="Nueva Actividad"
                    docsPath="/docs/planificador/introduccion"
                />
            </>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────
    return (
        <>
            <PageHeaderActionPortal>
                <Button size="sm" onClick={handleCreateEvent}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nueva Actividad
                </Button>
            </PageHeaderActionPortal>

            <div className="flex flex-col h-full gap-4">
                <ToolbarCard
                    right={
                        <>
                            <FilterPopover filters={filters} />
                            <SearchButton filters={filters} placeholder="Buscar actividades..." />
                            <DisplayButton
                                viewMode={viewMode}
                                onViewModeChange={handleModeChange}
                                viewModeOptions={VIEW_MODE_OPTIONS}
                            />
                        </>
                    }
                />


                <div className="flex-1">
                    {viewMode === "list" && (
                        <PlannerList
                            events={filteredEvents}
                            totalEvents={optimisticEvents.length}
                            onEventClick={handleEditEvent}
                            onCreateEvent={handleCreateEvent}
                            onResetFilters={filters.clearAll}
                        />
                    )}

                    {viewMode === "kanban" && (
                        <div className="h-full">
                            <KanbanDashboard
                                activeBoardData={activeBoardData}
                                organizationId={organizationId}
                                projects={projects}
                                searchQuery={filters.searchQuery}
                                selectedPriorities={Array.from(filters.facetValues.priority || new Set())}
                                selectedLabels={Array.from(filters.facetValues.label || new Set())}
                                isTeamsEnabled={isTeamsEnabled}
                            />
                        </div>
                    )}

                    {viewMode === "calendar" && (
                        <PlannerCalendar
                            organizationId={organizationId}
                            events={filteredEvents}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
