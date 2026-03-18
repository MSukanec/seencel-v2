"use client";

/**
 * Admin Academy — Students Table
 *
 * Pure presentational table component.
 * Receives data and callbacks as props.
 * Columns defined in tables/enrollment-columns.tsx.
 */

import { useMemo } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getEnrollmentColumns, ENROLLMENT_STATUS_OPTIONS } from "../tables/enrollment-columns";
import type { AdminCourseEnrollment, AdminCourse } from "@/features/admin/academy-queries";

interface StudentsTableProps {
    enrollments: AdminCourseEnrollment[];
    courses: AdminCourse[];
    onEdit: (enrollment: AdminCourseEnrollment) => void;
    onDelete: (enrollment: AdminCourseEnrollment) => void;
}

export function StudentsTable({ enrollments, courses, onEdit, onDelete }: StudentsTableProps) {
    const columns = useMemo(() => getEnrollmentColumns(), []);

    return (
        <DataTable
            columns={columns}
            data={enrollments}
            initialSorting={[{ id: "created_at", desc: true }]}
        />
    );
}
