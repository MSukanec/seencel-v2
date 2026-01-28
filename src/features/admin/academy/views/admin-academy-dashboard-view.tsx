"use client";

import type { CoursesDashboardData } from "@/features/admin/academy-queries";
import { CoursesDashboard } from "@/features/academy/components/admin/courses-dashboard";

interface AdminAcademyDashboardViewProps {
    data: CoursesDashboardData;
}

/**
 * Admin Academy Dashboard View
 * Shows KPIs, recent enrollments, expiring enrollments, and course stats.
 * No Toolbar needed - this is a dashboard/overview view.
 */
export function AdminAcademyDashboardView({ data }: AdminAcademyDashboardViewProps) {
    return (
        <div className="space-y-6">
            <CoursesDashboard data={data} />
        </div>
    );
}
