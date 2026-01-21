"use client";

import { useState } from "react";
import { LessonMarker, CourseLesson } from "@/types/courses";
import { deleteLessonMarker } from "@/actions/courses";
import { MarkerForm } from "@/features/academy/components/forms/marker-form";
import { useModal } from "@/providers/modal-store";
import { Bookmark, Clock, Play, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";

interface LessonMarkersListProps {
    markers: LessonMarker[];
    lessons: CourseLesson[];
    onMarkerClick: (marker: LessonMarker, lesson: CourseLesson) => void;
    onMarkerUpdate?: (marker: LessonMarker) => void;
    onMarkerDelete?: (markerId: string) => void;
    className?: string;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function LessonMarkersList({
    markers,
    lessons,
    onMarkerClick,
    onMarkerUpdate,
    onMarkerDelete,
    className
}: LessonMarkersListProps) {
    const { openModal } = useModal();
    const [deleteMarker, setDeleteMarker] = useState<LessonMarker | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Group markers by lesson
    const markersByLesson = markers.reduce((acc, marker) => {
        if (!acc[marker.lesson_id]) {
            acc[marker.lesson_id] = [];
        }
        acc[marker.lesson_id].push(marker);
        return acc;
    }, {} as Record<string, LessonMarker[]>);

    // Sort markers within each lesson by time
    Object.values(markersByLesson).forEach(lessonMarkers => {
        lessonMarkers.sort((a, b) => a.time_sec - b.time_sec);
    });

    const lessonsWithMarkers = lessons.filter(lesson => markersByLesson[lesson.id]?.length > 0);

    const handleEdit = (marker: LessonMarker, e: React.MouseEvent) => {
        e.stopPropagation();
        openModal(
            <MarkerForm
                mode="edit"
                lessonId={marker.lesson_id}
                initialData={marker}
                onSuccess={(updated) => {
                    if (updated) onMarkerUpdate?.(updated);
                }}
            />,
            {
                title: "Editar Marcador",
                description: `Modificá el comentario de este marcador en ${formatTime(marker.time_sec)}`,
                size: "md"
            }
        );
    };

    const handleDeleteConfirm = async () => {
        if (!deleteMarker) return;

        setIsDeleting(true);
        try {
            const result = await deleteLessonMarker(deleteMarker.id);
            if (result.success) {
                toast.success("Marcador eliminado");
                onMarkerDelete?.(deleteMarker.id);
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } finally {
            setIsDeleting(false);
            setDeleteMarker(null);
        }
    };

    if (lessonsWithMarkers.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
                <Bookmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">
                    No tenés marcadores todavía
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                    Agregá marcadores desde el reproductor para acceder rápido a momentos importantes
                </p>
            </div>
        );
    }

    return (
        <>
            <div className={cn("divide-y divide-border", className)}>
                {lessonsWithMarkers.map(lesson => (
                    <div key={lesson.id} className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {lesson.title}
                        </div>
                        <div className="space-y-1">
                            {markersByLesson[lesson.id].map(marker => (
                                <div
                                    key={marker.id}
                                    className="w-full flex items-start gap-3 px-4 py-2 hover:bg-muted/50 transition-colors text-left group relative"
                                >
                                    <button
                                        onClick={() => onMarkerClick(marker, lesson)}
                                        className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                    >
                                        <Play className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => onMarkerClick(marker, lesson)}
                                        className="flex-1 min-w-0 text-left"
                                    >
                                        <p className="text-sm line-clamp-2">{marker.body}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTime(marker.time_sec)}</span>
                                        </div>
                                    </button>

                                    {/* Actions Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => handleEdit(marker, e)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteMarker(marker);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DeleteDialog
                open={!!deleteMarker}
                onOpenChange={(open) => !open && setDeleteMarker(null)}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
                title="Eliminar Marcador"
                description="¿Estás seguro de que querés eliminar este marcador? Esta acción no se puede deshacer."
            />
        </>
    );
}
