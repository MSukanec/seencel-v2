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

interface PlannerCalendarViewProps {
    organizationId: string;
    projectId?: string | null;
    events: CalendarEvent[];
}

export function PlannerCalendarView({
    organizationId,
    projectId,
    events,
}: PlannerCalendarViewProps) {
    const router = useRouter();

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <div className="h-full relative">
            <PlannerCalendar
                organizationId={organizationId}
                projectId={projectId}
                events={events}
                onRefresh={handleRefresh}
            />
        </div>
    );
}

