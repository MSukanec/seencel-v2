"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCourse } from "@/features/academy/course-actions";
import { useModal } from "@/providers/modal-store";
import { FormFooter } from "@/components/shared/form-footer";

interface DeleteCourseConfirmProps {
    courseId: string;
    courseTitle: string;
}

export function DeleteCourseConfirm({ courseId, courseTitle }: DeleteCourseConfirmProps) {
    const { closeModal } = useModal();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleDelete() {
        setIsLoading(true);
        try {
            const result = await deleteCourse(courseId);
            if (result.success) {
                toast.success("Curso eliminado correctamente");
                closeModal();
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al eliminar el curso");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">
                    ¿Estás seguro que deseas eliminar el curso <strong>{courseTitle}</strong>?
                    <br />
                    Esta acción lo marcará como eliminado pero no borrará los datos permanentemente.
                </p>
            </div>

            <FormFooter
                onCancel={closeModal}
                onSubmit={handleDelete}
                submitLabel="Eliminar"
                // variant="destructive" - removed as it might not be supported. Use submitLabel to convey danger or just text.
                isLoading={isLoading}
                className="-mx-4 -mb-4 mt-6"
            />
        </div>
    );
}

