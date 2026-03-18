"use client";

import { useState } from "react";
import { LessonMarker, CourseLesson } from "@/features/academy/types";
import { deleteLessonMarker } from "@/features/academy/student-actions";
import { MarkerForm } from "@/features/academy/forms/marker-form";
import { usePanel } from "@/stores/panel-store";
import { Bookmark, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntityContextMenu } from "@/components/shared/entity-context-menu";
import { DeleteDialog } from "@/components/shared/forms/general/delete-dialog";
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
    const { openPanel } = usePanel();
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

    const handleEdit = (marker: LessonMarker) => {
        openPanel(
            'academy-marker-form',
            {
                mode: "edit",
                lessonId: marker.lesson_id,
                initialData: marker,
                onSuccess: (updated: any) => {
                    if (updated) onMarkerUpdate?.(updated);
                }
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
                                <EntityContextMenu
                                    key={marker.id}
                                    data={marker}
                                    onEdit={handleEdit}
                                    onDelete={setDeleteMarker}
                                >
                                    <div className="w-full flex items-start gap-3 px-4 py-2 hover:bg-muted/50 transition-colors text-left group cursor-context-menu relative">
                                        <button
                                            onClick={() => onMarkerClick(marker, lesson)}
                                            className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5"
                                        >
                                            <Play className="h-3 w-3 ml-0.5" />
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
                                    </div>
                                </EntityContextMenu>
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

