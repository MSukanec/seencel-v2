"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    BookOpen,
    Clock,
    ChevronDown,
    ChevronUp,
    Play,
    Pin
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LessonSummaryWithDetails, deleteLessonMarker, saveLessonSummary } from "@/features/academy/student-actions";
import { ContentLayout } from "@/components/layout";
import { useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Trash2 } from "lucide-react";
import { useTableActions } from "@/hooks/use-table-actions";

interface CourseNotesViewProps {
    courseId: string;
    courseSlug: string;
    summaries?: LessonSummaryWithDetails[];
}

// Helper to format duration
function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to format relative time
function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString();
}

export function CourseNotesView({
    courseId,
    courseSlug,
    summaries = []
}: CourseNotesViewProps) {
    const t = useTranslations("CourseNotes");
    const router = useRouter();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isSaving, startSaving] = useTransition();

    const { handleDelete, DeleteConfirmDialog } = useTableActions({
        onDelete: (item: any) => deleteLessonMarker(item.id),
        entityName: "apunte",
        entityNamePlural: "apuntes"
    });

    const startEditing = (summary: any) => {
        setEditingId(summary.id);
        setEditContent(summary.body);
    };

    const handleSave = (id: string, lessonId: string) => {
        if (!editContent.trim()) return;
        startSaving(async () => {
            const res = await saveLessonSummary(lessonId, editContent);
            if (res.success) {
                toast.success("Apunte guardado");
                setEditingId(null);
                router.refresh();
            } else {
                toast.error("Error al guardar el apunte");
            }
        });
    };

    return (
        <ContentLayout variant="narrow">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{t("title")}</h2>
                        {summaries.length > 0 && (
                            <p className="text-muted-foreground text-sm mt-1">
                                {t("count", { count: summaries.length })}
                            </p>
                        )}
                    </div>
                </div>

                {summaries.length === 0 ? (
                    <Card variant="inset" className="p-16 text-center border-dashed">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t("emptyTitle")}</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            {t("emptyDescription")}
                        </p>
                        <Link href={`/academy/my-courses/${courseSlug}/player`}>
                            <Button>
                                <Play className="w-4 h-4 mr-2" />
                                {t("startWatching")}
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    /* Notes Grid wrapped in inset card */
                    <Card variant="inset" className="p-4 md:p-6">
                        <div className="space-y-4">
                            {summaries.map((summary) => {
                                const lesson = summary.lesson;

                                return (
                                    <ContextMenu key={summary.id}>
                                        <ContextMenuTrigger asChild>
                                            <Card
                                                variant="island"
                                                className={cn(
                                                    "transition-all duration-200 overflow-hidden group",
                                                    summary.is_pinned && "border-primary/30 bg-primary/2"
                                                )}
                                            >
                                                {/* Header Portion */}
                                                <div className="w-full p-4 md:p-5 flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                        "bg-primary/10 text-primary"
                                                    )}>
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>

                                                    {/* Content Header Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                {/* Module badge */}
                                                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                                    {lesson.module.title}
                                                                </div>

                                                                {/* Lesson Title */}
                                                                <h3 className="font-medium text-base text-foreground line-clamp-1 flex items-center gap-2">
                                                                    {summary.is_pinned && (
                                                                        <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                    )}
                                                                    {lesson.title}
                                                                </h3>

                                                                {/* Meta info */}
                                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                                                                    {lesson.duration_sec ? (
                                                                        <span className="flex items-center gap-1.5">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            {formatDuration(lesson.duration_sec)}
                                                                        </span>
                                                                    ) : null}
                                                                    <span className="opacity-50">•</span>
                                                                    <span>{formatRelativeDate(summary.updated_at)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="shrink-0 pt-1 flex items-center gap-1.5">
                                                                <Link 
                                                                    href={`/academy/my-courses/${courseSlug}/player?lesson=${lesson.id}` as any}
                                                                >
                                                                    <Button variant="secondary" size="sm" className="h-8 hidden sm:flex text-xs">
                                                                        <Play className="w-3.5 h-3.5 mr-2" />
                                                                        {t("goToLesson")}
                                                                    </Button>
                                                                    <Button variant="secondary" size="icon" className="h-8 w-8 sm:hidden">
                                                                        <Play className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body - Content */}
                                                <div className="border-t bg-muted/20">
                                                    <div className="p-4 md:p-5 md:pl-[4.5rem]">
                                                        {editingId === summary.id ? (
                                                            <div className="space-y-3">
                                                                <Textarea 
                                                                    value={editContent}
                                                                    onChange={(e) => setEditContent(e.target.value)}
                                                                    className="min-h-[120px] resize-y"
                                                                    placeholder="Escribe tu apunte aquí..."
                                                                    disabled={isSaving}
                                                                    autoFocus
                                                                />
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        onClick={() => setEditingId(null)}
                                                                        disabled={isSaving}
                                                                    >
                                                                        Cancelar
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        onClick={() => handleSave(summary.id, lesson.id)}
                                                                        disabled={isSaving || !editContent.trim()}
                                                                    >
                                                                        {isSaving ? "Guardando..." : "Guardar"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Full note body */
                                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                                <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90 font-medium">
                                                                    {summary.body}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48">
                                            <ContextMenuItem onClick={() => startEditing(summary)}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Editar
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => router.push(`/academy/my-courses/${courseSlug}/player?lesson=${lesson.id}` as any)}>
                                                <Play className="mr-2 h-4 w-4" />
                                                Ir a la Lección
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem 
                                                onClick={() => handleDelete(summary)}
                                                className="text-muted-foreground focus:text-destructive focus:bg-destructive/10"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </div>
            
            <DeleteConfirmDialog />
        </ContentLayout>
    );
}
