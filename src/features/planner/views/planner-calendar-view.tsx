"use client";

import * as React from "react";
import { PlannerCalendar } from "@/features/planner/components/planner-calendar";
import { CalendarEvent } from "@/features/planner/types";
import { Project } from "@/types/project";

// ============================================================================
// PLANNER CALENDAR VIEW
// ============================================================================
// Calendar view for the planner - shows events in a month/week/day format
// Uses optimistic updates internally - no need for router.refresh()
// ============================================================================

interface PlannerCalendarViewProps {
    organizationId: string;
    events: CalendarEvent[];
    projects?: Project[];
}

export function PlannerCalendarView({
    organizationId,
    events,
    projects
}: PlannerCalendarViewProps) {
    return (
        <div className="h-full relative flex flex-col">
            <PlannerCalendar
                organizationId={organizationId}
                events={events}
                projects={projects}
            />
        </div>
    );
}
