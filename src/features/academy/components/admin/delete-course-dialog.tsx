"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCourse } from "@/features/academy/course-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface DeleteCourseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
    courseTitle: string;
}

export function DeleteCourseDialog({
    open,
    onOpenChange,
    courseId,
    courseTitle,
}: DeleteCourseDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!courseId) return;
        setIsDeleting(true);
        try {
            const result = await deleteCourse(courseId);
            if (result.success) {
                toast.success(result.message);
                onOpenChange(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al eliminar el curso");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el curso
                        <span className="font-bold text-foreground mx-1">"{courseTitle}"</span>
                        y todo su contenido asociado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeleting ? "Eliminando..." : "Eliminar Curso"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
