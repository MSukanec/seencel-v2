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
import { LessonSummaryWithDetails } from "@/actions/courses";
import { ContentLayout } from "@/components/layout";

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
    const [expandedId, setExpandedId] = useState<string | null>(
        summaries.length > 0 ? summaries[0].id : null
    );

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
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
                    /* Empty State */
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
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
                        </CardContent>
                    </Card>
                ) : (
                    /* Notes Grid */
                    <div className="space-y-4">
                        {summaries.map((summary) => {
                            const isExpanded = expandedId === summary.id;
                            const lesson = summary.lesson;

                            return (
                                <Card
                                    key={summary.id}
                                    className={cn(
                                        "transition-all duration-200 overflow-hidden hover:shadow-md",
                                        isExpanded && "ring-1 ring-primary/20",
                                        summary.is_pinned && "border-primary/30 bg-primary/5"
                                    )}
                                >
                                    {/* Header - Always visible */}
                                    <button
                                        onClick={() => toggleExpand(summary.id)}
                                        className="w-full text-left"
                                    >
                                        <div className="p-4 md:p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                    "bg-gradient-to-br from-primary/20 to-primary/5"
                                                )}>
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            {/* Module badge */}
                                                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                                                {lesson.module.title}
                                                            </span>

                                                            {/* Lesson Title */}
                                                            <h3 className="font-semibold text-base mt-0.5 line-clamp-1 flex items-center gap-2">
                                                                {summary.is_pinned && (
                                                                    <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                )}
                                                                {lesson.title}
                                                            </h3>

                                                            {/* Meta info */}
                                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                                {lesson.duration_sec && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        {formatDuration(lesson.duration_sec)}
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {formatRelativeDate(summary.updated_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Expand button */}
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                            "hover:bg-muted"
                                                        )}>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Preview when collapsed */}
                                                    {!isExpanded && (
                                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                            {summary.body}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t bg-muted/30">
                                            <div className="p-4 md:p-5">
                                                {/* Full note body */}
                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                        {summary.body}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                                                    <Link href={`/academy/my-courses/${courseSlug}/player?lesson=${lesson.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Play className="w-4 h-4 mr-2" />
                                                            {t("goToLesson")}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </ContentLayout>
    );
}
