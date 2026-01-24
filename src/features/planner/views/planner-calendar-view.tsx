"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlannerCalendar } from "@/features/planner/components/planner-calendar";
import { CalendarEvent } from "@/features/planner/types";

// ============================================================================
// PLANNER CALENDAR VIEW
// ============================================================================
// Calendar view for the planner - shows events in a month/week/day format
// ============================================================================

import { Project } from "@/types/project";

// ...

interface PlannerCalendarViewProps {
    organizationId: string;
    projectId?: string | null;
    events: CalendarEvent[];
    projects?: Project[];
}

export function PlannerCalendarView({
    organizationId,
    projectId,
    events,
    projects
}: PlannerCalendarViewProps) {
    const router = useRouter();

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <div className="h-full relative flex flex-col">
            <PlannerCalendar
                organizationId={organizationId}
                projectId={projectId}
                events={events}
                onRefresh={handleRefresh}
                projects={projects}
            />
        </div>
    );
}

