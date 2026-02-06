"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Video } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { CoursesTable } from "@/features/academy/components/admin/courses-table";
import type { AdminCourse } from "@/features/admin/academy-queries";

interface Instructor {
    id: string;
    name: string;
    avatar_path: string | null;
}

interface AdminAcademyCoursesViewProps {
    courses: AdminCourse[];
    instructors: Instructor[];
}

/**
 * Admin Academy Courses View
 * Shows courses table with Toolbar in header including search and create action.
 */
export function AdminAcademyCoursesView({ courses, instructors }: AdminAcademyCoursesViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter courses by search query
    const filteredCourses = courses.filter((c) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.title?.toLowerCase().includes(query) ||
            c.slug?.toLowerCase().includes(query) ||
            c.short_description?.toLowerCase().includes(query)
        );
    });

    // Empty state
    if (courses.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Video}
                        viewName="Cursos"
                        featureDescription="Crea tu primer curso para empezar."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar cursos..."
            />
            <CoursesTable courses={filteredCourses} instructors={instructors} />
        </>
    );
}
