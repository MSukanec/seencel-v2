"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";

import { PlannerCalendarView } from "./planner-calendar-view";
import { KanbanDashboard } from "@/features/planner/components/kanban-dashboard";
import { CalendarEvent } from "@/features/planner/types";
import { useTranslations } from "next-intl";
import { Project } from "@/types/project";

// ============================================================================
// PLANNER PAGE VIEW
// ============================================================================
// Unified view for Planner with Calendar and Kanban (To-Do) tabs
// - Calendar: Monthly view of events and deadlines
// - Kanban: Board-based task management
// ============================================================================

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface PlannerPageViewProps {
    boards: any[];
    activeBoardId: string | null;
    activeBoardData: any | null;
    organizationId: string;
    projectId?: string | null;
    /** Base URL for navigation (e.g., "/organization/planner" or "/project/123/planner") */
    baseUrl: string;
    /** Calendar events for the calendar view */
    calendarEvents: CalendarEvent[];
    projects?: Project[];
    /** Max boards allowed by plan (-1 = unlimited) */
    maxBoards?: number;
    /** Whether the organization can invite members (Teams plan) */
    isTeamsEnabled?: boolean;
}

export function PlannerPageView({
    boards,
    activeBoardId,
    activeBoardData,
    organizationId,
    projectId,
    baseUrl,
    calendarEvents,
    projects,
    maxBoards = -1,
    isTeamsEnabled = false
}: PlannerPageViewProps) {
    const t = useTranslations('Planner');
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || "calendar";
    const [activeTab, setActiveTab] = useState(currentTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without navigation (shallow)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="calendar" className={tabTriggerClass}>{t('tabs.calendar')}</TabsTrigger>
            <TabsTrigger value="kanban" className={tabTriggerClass}>{t('tabs.kanban')}</TabsTrigger>
        </TabsList>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title={t('title')}
                tabs={tabs}
                icon={<CalendarDays />}
            >
                <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="wide">
                        <PlannerCalendarView
                            organizationId={organizationId}
                            projectId={projectId}
                            events={calendarEvents}
                            projects={projects}
                        />
                    </ContentLayout>
                </TabsContent>
                <TabsContent value="kanban" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <ContentLayout variant="full">
                        <KanbanDashboard
                            boards={boards}
                            activeBoardId={activeBoardId}
                            activeBoardData={activeBoardData}
                            organizationId={organizationId}
                            projectId={projectId}
                            projects={projects}
                            baseUrl={baseUrl}
                            maxBoards={maxBoards}
                            isTeamsEnabled={isTeamsEnabled}
                        />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
