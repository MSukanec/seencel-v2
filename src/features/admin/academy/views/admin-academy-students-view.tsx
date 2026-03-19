"use client";

import { useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanel } from "@/stores/panel-store";
import { useRouter } from "@/i18n/routing";
import { useTableActions } from "@/hooks/use-table-actions";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { ToolbarCard } from "@/components/shared/toolbar-controls";
import { PageHeaderActionPortal } from "@/components/layout/dashboard/header/page-header";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { StudentsTable } from "./students-table";
import { deleteEnrollment } from "@/actions/enrollment-actions";
import type { AdminCourseEnrollment, AdminCourse } from "@/features/admin/academy-queries";

interface AdminAcademyStudentsViewProps {
    enrollments: AdminCourseEnrollment[];
    courses: AdminCourse[];
}

export function AdminAcademyStudentsView({ enrollments, courses }: AdminAcademyStudentsViewProps) {
    const { openPanel } = usePanel();
    const router = useRouter();
    const filters = useTableFilters();

    const {
        optimisticItems: optimisticEnrollments,
    } = useOptimisticList({
        items: enrollments,
        getItemId: (enrollment) => enrollment.id,
    });

    const { handleDelete, DeleteConfirmDialog } = useTableActions<AdminCourseEnrollment>({
        onDelete: async (item) => {
            await deleteEnrollment(item.id);
            return { success: true };
        },
        entityName: "inscripción",
        entityNamePlural: "inscripciones",
    });

    // ⚠️ CRITICAL: useCallback para evitar loop infinito con DataTable
    // DataTable tiene onEdit/onDelete en sus deps de useMemo para tableColumns.
    // Sin useCallback, cada render crea funciones nuevas → tableColumns recomputa → loop.
    const handleCreate = useCallback(() => {
        openPanel("enrollment-form", {
            onSuccess: () => router.refresh(),
        });
    }, [openPanel, router]);

    const handleEdit = useCallback((enrollment: AdminCourseEnrollment) => {
        openPanel("enrollment-form", {
            initialData: enrollment,
            onSuccess: () => router.refresh(),
        });
    }, [openPanel, router]);

    // Filtrar enrollments
    const filteredEnrollments = optimisticEnrollments.filter((e) => {
        if (!filters.searchQuery) return true;
        const query = filters.searchQuery.toLowerCase();
        return (
            e.user?.full_name?.toLowerCase().includes(query) ||
            e.user?.email?.toLowerCase().includes(query) ||
            e.course?.title?.toLowerCase().includes(query)
        );
    });

    // Empty state
    if (optimisticEnrollments.length === 0) {
        return (
            <>
                <PageHeaderActionPortal>
                    <Button size="sm" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Inscribir Alumno
                    </Button>
                </PageHeaderActionPortal>
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Users}
                        viewName="Alumnos Inscritos"
                        featureDescription="Inscribe tu primer alumno a un curso."
                        onAction={handleCreate}
                        actionLabel="Inscribir Alumno"
                    />
                </div>
            </>
        );
    }

    // No results
    if (filteredEnrollments.length === 0 && filters.hasActiveFilters) {
        return (
            <>
                <PageHeaderActionPortal>
                    <Button size="sm" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Inscribir Alumno
                    </Button>
                </PageHeaderActionPortal>
                <ToolbarCard
                    filters={filters}
                    searchPlaceholder="Buscar alumnos..."
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="no-results"
                        icon={Users}
                        viewName="Alumnos"
                        onResetFilters={filters.clearAll}
                    />
                </div>
                <DeleteConfirmDialog />
            </>
        );
    }

    return (
        <>
            <PageHeaderActionPortal>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Inscribir Alumno
                </Button>
            </PageHeaderActionPortal>

            <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                <ToolbarCard
                    filters={filters}
                    searchPlaceholder="Buscar alumnos..."
                />

                <StudentsTable
                    enrollments={filteredEnrollments}
                    courses={courses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            <DeleteConfirmDialog />
        </>
    );
}
