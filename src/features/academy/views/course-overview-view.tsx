"use client";

import { CourseWithDetails, CourseModule, CourseLesson } from "@/types/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Play,
    Clock,
    BookOpen,
    FileText,
    MessageSquare,
    Bookmark,
    ChevronRight,
    TrendingUp,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ContentLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { CourseOverviewData, LessonSummaryWithDetails, MarkerWithDetails } from "@/actions/courses";
import { ForumThread } from "@/actions/forum";

interface CourseOverviewViewProps {
    course: CourseWithDetails;
    modules: (CourseModule & { lessons: CourseLesson[] })[];
    courseSlug: string;
    overviewData?: CourseOverviewData | null;
    latestThreads?: ForumThread[];
    latestSummaries?: LessonSummaryWithDetails[];
    latestMarkers?: MarkerWithDetails[];
}

// Helper to format seconds to human readable
function formatTime(seconds: number): string {
    if (seconds < 60) return "< 1 min";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
}

// Helper to format relative date
function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
}

// Format marker time
function formatMarkerTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CourseOverviewView({
    course,
    modules,
    courseSlug,
    overviewData,
    latestThreads = [],
    latestSummaries = [],
    latestMarkers = []
}: CourseOverviewViewProps) {
    const t = useTranslations("CourseOverview");
    const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const totalDuration = modules.reduce((acc, m) =>
        acc + (m.lessons?.reduce((a, l) => a + (l.duration_sec || 0), 0) || 0), 0
    );

    const progressPct = overviewData?.progressPct || 0;
    const doneLessons = overviewData?.doneLessons || 0;
    const remainingLessons = totalLessons - doneLessons;
    const studyTimeLifetime = overviewData?.secondsLifetime || 0;
    const studyTimeThisMonth = overviewData?.secondsThisMonth || 0;

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                {/* Hero Section with Course Image Background */}
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                    {/* Background Image */}
                    {(course.image_path || course.details?.image_path) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={course.image_path || course.details?.image_path || ''}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="relative p-6 md:p-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{course.title}</h1>

                        <Link href={`/academy/my-courses/${courseSlug}/player`}>
                            <Button className="mt-4">
                                <Play className="w-4 h-4 mr-2" />
                                {progressPct > 0 ? t("continue") : t("start")}
                            </Button>
                        </Link>

                        {/* KPI Row inside Hero */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                            <div>
                                <p className="text-xs text-white/60 uppercase tracking-wide">{t("kpi.remaining")}</p>
                                <p className="text-2xl md:text-3xl font-bold text-primary">
                                    {remainingLessons}
                                </p>
                                <p className="text-xs text-white/60">
                                    {t("kpi.lessonsRemaining", { total: totalLessons })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60 uppercase tracking-wide">{t("kpi.progress")}</p>
                                <p className="text-2xl md:text-3xl font-bold text-primary">
                                    {progressPct.toFixed(1)}%
                                </p>
                                <p className="text-xs text-white/60">
                                    {doneLessons} {t("kpi.of")} {totalLessons} {t("kpi.lessons")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60 uppercase tracking-wide">{t("kpi.studyTime")}</p>
                                <p className="text-2xl md:text-3xl font-bold text-white">
                                    {formatTime(studyTimeLifetime)}
                                </p>
                                <p className="text-xs text-white/60">
                                    {t("kpi.ofContent", { total: formatTime(totalDuration) })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/60 uppercase tracking-wide">{t("kpi.thisMonth")}</p>
                                <p className="text-2xl md:text-3xl font-bold text-white">
                                    {formatTime(studyTimeThisMonth)}
                                </p>
                                <p className="text-xs text-white/60">
                                    {t("kpi.dedicated")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Forum Card */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                {t("cards.forum.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {latestThreads.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">{t("cards.forum.empty")}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 flex-1">
                                    {latestThreads.slice(0, 3).map((thread) => (
                                        <div key={thread.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium line-clamp-1">{thread.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("cards.forum.by")} {thread.author?.full_name || "Usuario"}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatRelativeDate(thread.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/academy/my-courses/${courseSlug}/forum`}
                                className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                {t("cards.forum.viewAll")}
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                {t("cards.notes.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {latestSummaries.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-4">{t("cards.notes.empty")}</p>
                                    <Link href={`/academy/my-courses/${courseSlug}/player`}>
                                        <Button size="sm" variant="outline">
                                            <Play className="w-3 h-3 mr-1" />
                                            {t("cards.notes.goToPlayer")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3 flex-1">
                                    {latestSummaries.slice(0, 3).map((summary) => (
                                        <div key={summary.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium line-clamp-1">{summary.lesson.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {summary.body.substring(0, 60)}...
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatRelativeDate(summary.updated_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/academy/my-courses/${courseSlug}/notes`}
                                className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                {t("cards.notes.viewAll")}
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Markers Card */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-primary" />
                                {t("cards.markers.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {latestMarkers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <Bookmark className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">{t("cards.markers.empty")}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 flex-1">
                                    {latestMarkers.slice(0, 3).map((marker) => (
                                        <div key={marker.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <Bookmark className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium line-clamp-1">
                                                    {marker.body || t("cards.markers.noDescription")}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {marker.lesson.title} · {formatMarkerTime(marker.time_sec)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatRelativeDate(marker.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/academy/my-courses/${courseSlug}/player`}
                                className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                {t("cards.markers.viewAll")}
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ContentLayout>
    );
}

