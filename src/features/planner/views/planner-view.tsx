"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { useSearchParams, usePathname } from "next/navigation";
import { CalendarDays, Plus, List, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";

import { PageWrapper, ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { ViewEmptyState } from "@/components/shared/empty-state";

import { PlannerCalendar } from "@/features/planner/components/planner-calendar";
import { PlannerList } from "@/features/planner/components/planner-list";
import { KanbanDashboard } from "@/features/planner/components/kanban-dashboard";
import { PlannerItem, PRIORITY_CONFIG } from "@/features/planner/types";
import { CalendarEventForm } from "@/features/planner/forms/calendar-event-form";

import { useTranslations } from "next-intl";
import { useModal } from "@/stores/modal-store";
import { useActiveProjectId } from "@/stores/layout-store";
import { Project } from "@/types/project";

// ============================================================================
// PLANNER VIEW (Unified Orchestrator)
// ============================================================================
// Client orchestrator for the unified Planner with 3 view modes:
// - List: Chronological list of events grouped by date
// - Kanban: Single-board task management
// - Calendar: Monthly calendar grid
//
// Justification for Client Orchestrator (per pages.md):
// Shares significant state across all 3 modes: viewMode, searchQuery,
// and contextual filters. Not just a tab pass-through.
// ============================================================================

type ViewMode = "list" | "kanban" | "calendar";

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "list", label: "Lista", icon: List },
    { value: "kanban", label: "Panel", icon: LayoutGrid },
    { value: "calendar", label: "Calendario", icon: CalendarIcon },
];

// ── Filters for List/Calendar mode ──────────────────────────────────
const TYPE_FILTER_OPTIONS = [
    { label: "Manual", value: "manual", icon: CalendarIcon },
    { label: "Kanban", value: "kanban_card", icon: LayoutGrid },
    { label: "Pagos", value: "payment", icon: CalendarIcon },
    { label: "Hitos", value: "quote_milestone", icon: CalendarIcon },
];

// ── Filters for Kanban mode ─────────────────────────────────────────
const PRIORITY_FILTER_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    label: config.label,
    value: key,
}));

interface PlannerViewProps {
    activeBoardData: any | null;
    organizationId: string;
    /** All planner items (events + tasks with dates) */
    calendarEvents: PlannerItem[];
    projects?: Project[];
    /** Whether the organization can invite members (Teams plan) */
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
    const { openModal, closeModal } = useModal();
    const activeProjectId = useActiveProjectId();

    // ── Optimistic List ────────────────────────────────────────────────
    const {
        optimisticItems: optimisticEvents,
        addItem: addOptimisticEvent,
        updateItem: updateOptimisticEvent,
        removeItem: removeOptimisticEvent,
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
        // Update URL without navigation (shallow routing)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", mode);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }, [pathname, searchParams]);

    // ── Search (shared) ────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const debouncedSetSearch = useCallback((value: string) => {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => setSearchQuery(value), 300);
    }, []);

    // ── List/Calendar Filters ──────────────────────────────────────────
    const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

    const handleTypeSelect = useCallback((value: string) => {
        setTypeFilter(prev => {
            const next = new Set(prev);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    }, []);

    // ── Kanban Filters ─────────────────────────────────────────────────
    const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());
    const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());

    const handlePrioritySelect = useCallback((value: string) => {
        setSelectedPriorities(prev => {
            const next = new Set(prev);
            if (next.has(value)) { next.delete(value); } else { next.add(value); }
            return next;
        });
    }, []);

    const handleLabelSelect = useCallback((value: string) => {
        setSelectedLabels(prev => {
            const next = new Set(prev);
            if (next.has(value)) { next.delete(value); } else { next.add(value); }
            return next;
        });
    }, []);

    // Label options from active board data
    const labelFilterOptions = useMemo(() => {
        return activeBoardData?.labels?.map((l: any) => ({
            label: l.name,
            value: l.id,
        })) || [];
    }, [activeBoardData?.labels]);

    // ── Filtered Events (for List & Calendar) ──────────────────────────
    const filteredEvents = useMemo(() => {
        return optimisticEvents.filter(event => {
            // Project context filter
            if (activeProjectId && event.project_id && event.project_id !== activeProjectId) {
                return false;
            }

            // Text search
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                event.title.toLowerCase().includes(searchLower) ||
                event.description?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Type filter
            if (typeFilter.size > 0 && event.source_type) {
                if (!typeFilter.has(event.source_type)) return false;
            } else if (typeFilter.size > 0 && !event.source_type) {
                if (!typeFilter.has('manual')) return false;
            }

            return true;
        });
    }, [optimisticEvents, searchQuery, typeFilter, activeProjectId]);

    // ── Create Event ───────────────────────────────────────────────────
    const handleCreateEvent = useCallback(() => {
        openModal(
            <CalendarEventForm
                organizationId={organizationId}
                projectId={activeProjectId}
                defaultDate={new Date()}
                projects={projects}
                onCancel={closeModal}
                onOptimisticCreate={(tempEvent) => addOptimisticEvent(tempEvent)}
                onRollback={() => {
                    // React 19 useOptimistic handles rollback automatically
                    // when the server action fails within startTransition
                }}
            />,
            {
                title: "Nuevo evento",
                description: "Completá los campos para crear un nuevo evento.",
                size: 'md'
            }
        );
    }, [organizationId, activeProjectId, projects, openModal, closeModal, addOptimisticEvent]);

    // ── Reset Filters ──────────────────────────────────────────────────
    const handleResetFilters = useCallback(() => {
        setSearchQuery("");
        setTypeFilter(new Set());
        setSelectedPriorities(new Set());
        setSelectedLabels(new Set());
    }, []);

    // ── Empty State Check ──────────────────────────────────────────────
    const hasNoData = optimisticEvents.length === 0 && !activeBoardData;

    // ── Contextual Toolbar Filters ─────────────────────────────────────
    const renderFilterContent = () => {
        if (viewMode === "kanban") {
            return (
                <div className="flex items-center gap-2">
                    <FacetedFilter
                        title="Prioridad"
                        options={PRIORITY_FILTER_OPTIONS}
                        selectedValues={selectedPriorities}
                        onSelect={handlePrioritySelect}
                        onClear={() => setSelectedPriorities(new Set())}
                    />
                    {labelFilterOptions.length > 0 && (
                        <FacetedFilter
                            title="Etiquetas"
                            options={labelFilterOptions}
                            selectedValues={selectedLabels}
                            onSelect={handleLabelSelect}
                            onClear={() => setSelectedLabels(new Set())}
                        />
                    )}
                </div>
            );
        }

        // List & Calendar: Type filter
        return (
            <FacetedFilter
                title="Tipo"
                options={TYPE_FILTER_OPTIONS}
                selectedValues={typeFilter}
                onSelect={handleTypeSelect}
            />
        );
    };

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <PageWrapper
            type="page"
            title={t('title')}
            icon={<CalendarDays />}
        >
            {/* Toolbar: ALWAYS visible (even in empty state, per projects pattern) */}
            <Toolbar
                portalToHeader
                searchQuery={hasNoData ? undefined : searchQuery}
                onSearchChange={hasNoData ? undefined : debouncedSetSearch}
                searchPlaceholder="Buscar..."
                filterContent={hasNoData ? undefined : renderFilterContent()}
                actions={[{
                    label: "Nuevo Evento",
                    icon: Plus,
                    onClick: handleCreateEvent
                }]}
                leftActions={
                    <ToolbarTabs
                        value={viewMode}
                        onValueChange={handleModeChange}
                        options={VIEW_MODE_OPTIONS}
                    />
                }
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {hasNoData ? (
                    <ContentLayout variant="wide">
                        <div className="h-full flex items-center justify-center">
                            <ViewEmptyState
                                mode="empty"
                                icon={CalendarDays}
                                viewName="Planificador"
                                featureDescription="El planificador te permite organizar eventos, reuniones, tareas y fechas importantes. Creá eventos con horarios, colores y descripciones, o usá el panel para gestionar tus tareas de equipo."
                                onAction={handleCreateEvent}
                                actionLabel="Nuevo Evento"
                                docsPath="/docs/agenda/introduccion"
                            />
                        </div>
                    </ContentLayout>
                ) : (
                    <>
                        {/* List Mode */}
                        {viewMode === "list" && (
                            <ContentLayout variant="wide">
                                <PlannerList
                                    events={filteredEvents}
                                    totalEvents={optimisticEvents.length}
                                    onEventClick={(e: PlannerItem) => {
                                        openModal(
                                            <CalendarEventForm
                                                organizationId={organizationId}
                                                projectId={activeProjectId}
                                                initialData={e}
                                                projects={projects}
                                                onCancel={closeModal}
                                                onOptimisticUpdate={(updated) => updateOptimisticEvent(e.id, updated)}
                                                onRollback={() => { }}
                                            />,
                                            {
                                                title: "Editar evento",
                                                description: "Modificá los detalles del evento.",
                                                size: 'md'
                                            }
                                        );
                                    }}
                                    onCreateEvent={handleCreateEvent}
                                    onResetFilters={handleResetFilters}
                                />
                            </ContentLayout>
                        )}

                        {/* Kanban Mode */}
                        {viewMode === "kanban" && (
                            <ContentLayout variant="full">
                                <KanbanDashboard
                                    activeBoardData={activeBoardData}
                                    organizationId={organizationId}
                                    projects={projects}
                                    searchQuery={searchQuery}
                                    selectedPriorities={Array.from(selectedPriorities)}
                                    selectedLabels={Array.from(selectedLabels)}
                                    isTeamsEnabled={isTeamsEnabled}
                                />
                            </ContentLayout>
                        )}

                        {/* Calendar Mode */}
                        {viewMode === "calendar" && (
                            <ContentLayout variant="wide">
                                <PlannerCalendar
                                    organizationId={organizationId}
                                    events={filteredEvents}
                                    projects={projects}
                                />
                            </ContentLayout>
                        )}
                    </>
                )}
            </div>
        </PageWrapper>
    );
}
