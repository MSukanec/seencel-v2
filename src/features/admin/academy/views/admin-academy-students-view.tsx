"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { deleteEnrollment } from "@/actions/enrollment-actions";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { EnrollmentForm } from "@/features/academy/components/admin/enrollment-form";
import { StudentsTable } from "./students-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminCourseEnrollment, AdminCourse } from "@/features/admin/academy-queries";

interface AdminAcademyStudentsViewProps {
    enrollments: AdminCourseEnrollment[];
    courses: AdminCourse[];
}

/**
 * Admin Academy Students View
 * Shows enrollments table with Toolbar in header including search and create action.
 */
export function AdminAcademyStudentsView({ enrollments, courses }: AdminAcademyStudentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    // Optimistic UI for delete
    const {
        optimisticItems: optimisticEnrollments,
        removeItem: optimisticRemove
    } = useOptimisticList({
        items: enrollments,
        getItemId: (enrollment) => enrollment.id,
    });

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleCreate = () => {
        openModal(
            <EnrollmentForm onSuccess={handleSuccess} />,
            {
                title: "Inscribir Alumno",
                description: "Agrega un alumno a un curso.",
                size: "md"
            }
        );
    };

    const handleEdit = (enrollment: AdminCourseEnrollment) => {
        openModal(
            <EnrollmentForm initialData={enrollment} onSuccess={handleSuccess} />,
            {
                title: "Editar Inscripción",
                description: `Modificando inscripción de ${enrollment.user?.full_name || enrollment.user?.email}`,
                size: "md"
            }
        );
    };

    const handleDelete = (enrollment: AdminCourseEnrollment) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>
                    ¿Estás seguro de eliminar la inscripción de{" "}
                    <strong>{enrollment.user?.full_name || enrollment.user?.email}</strong> en{" "}
                    <strong>{enrollment.course?.title}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                    Esto eliminará su progreso en el curso. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent"
                        onClick={closeModal}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                            const enrollmentId = enrollment.id;
                            closeModal();
                            optimisticRemove(enrollmentId, async () => {
                                try {
                                    await deleteEnrollment(enrollmentId);
                                    toast.success("Inscripción eliminada");
                                } catch {
                                    toast.error("Error al eliminar inscripción");
                                    router.refresh();
                                }
                            });
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>,
            {
                title: "Eliminar Inscripción",
                description: "Esta acción no se puede deshacer."
            }
        );
    };

    // Filter enrollments by search query
    const filteredEnrollments = optimisticEnrollments.filter((e) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
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
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Inscribir Alumno", icon: Plus, onClick: handleCreate }
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Users}
                        title="No hay alumnos inscritos"
                        description="Inscribe tu primer alumno a un curso."
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
                searchPlaceholder="Buscar alumnos..."
                actions={[
                    { label: "Inscribir Alumno", icon: Plus, onClick: handleCreate }
                ]}
            />
            <StudentsTable
                enrollments={filteredEnrollments}
                courses={courses}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
}
