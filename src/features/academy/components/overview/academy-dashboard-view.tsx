"use client";

import { Clock, PlayCircle, BookOpen, GraduationCap, ArrowRight, BarChart3, CheckCircle2, TrendingUp, Presentation } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/cards";
import { CourseWithDetails } from "@/features/academy/types";
import { CourseCard } from "../course-card";
import type { GlobalAcademyOverviewData, RecentLessonProgress } from "@/features/academy/student-actions";

interface AcademyDashboardViewProps {
    latestCourse: CourseWithDetails | null;
    globalStats: GlobalAcademyOverviewData;
    recentLessons: RecentLessonProgress[];
    activeCourses: CourseWithDetails[];
    enrolledCourseIds: string[];
    startedCourseIds: string[];
    isPurchaseEnabled: boolean;
}

/**
 * Utility to format seconds into readable time (e.g. 5h 30m, 45m)
 */
function formatStudyTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
}

/**
 * Utility to format relative date
 */
function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
    return `Hace ${Math.floor(diffDays / 30)} mes.`;
}

export function AcademyDashboardView({
    latestCourse,
    globalStats,
    recentLessons,
    activeCourses,
    enrolledCourseIds,
    startedCourseIds,
    isPurchaseEnabled
}: AcademyDashboardViewProps) {

    // Calcular cantidad de cursos únicos en los que el usuario tiene historial o inscripción
    const totalCoursesCount = new Set([...enrolledCourseIds, ...startedCourseIds]).size;

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* ÚLTIMO CURSO AÑADIDO (HERO CARD) */}
            {latestCourse && (
                <Card className="relative overflow-hidden min-h-[300px] md:min-h-[350px] flex items-end group border-none shadow-lg">
                    {/* Background Image */}
                    {(latestCourse.image_path || latestCourse.details?.image_path) ? (
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url(${latestCourse.image_path || latestCourse.details?.image_path})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-primary/10" />
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent" />
                    
                    {/* Content */}
                    <div className="relative z-10 p-6 md:p-10 w-full md:w-2/3">
                        <Badge variant="default" className="mb-3 bg-primary text-primary-foreground border-none">
                            Nuevo Curso Añadido
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight drop-shadow-sm">
                            {latestCourse.title}
                        </h2>
                        {latestCourse.short_description && (
                            <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3 md:text-lg max-w-2xl drop-shadow-sm">
                                {latestCourse.short_description}
                            </p>
                        )}
                        <Link 
                            href={`/academy/courses/${latestCourse.slug}` as any}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 gap-2"
                        >
                            Ver Detalles <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </Card>
            )}

            {/* ESTADÍSTICAS GLOBALES */}
            <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Mis Estadísticas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Cursos Totales"
                        value={totalCoursesCount.toString()}
                        icon={<BookOpen />}
                        description="En los que has participado"
                    />
                    
                    <MetricCard
                        title="Lecciones Completadas"
                        value={globalStats.doneLessons.toString()}
                        icon={<CheckCircle2 />}
                        description={`De ${globalStats.totalLessons} lecciones inscritas`}
                    />
                    
                    <MetricCard
                        title="Progreso General"
                        value={`${globalStats.progressPct}%`}
                        icon={<TrendingUp />}
                        description="Avance ponderado de cursos"
                    />

                    <MetricCard
                        title="Tiempo Estudiado"
                        value={formatStudyTime(globalStats.secondsLifetime)}
                        icon={<Clock />}
                        trend={globalStats.secondsThisMonth > 0 ? {
                            value: formatStudyTime(globalStats.secondsThisMonth),
                            direction: "up",
                            label: "este mes"
                        } : undefined}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* COLUMNA 1 - CURSOS ACTIVOS */}
                <div className="space-y-4 flex flex-col h-full">
                    <div className="flex items-center justify-between shrink-0">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Cursos en Progreso
                        </h3>
                        <Link 
                            href="/academy/my-courses" 
                            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            Ver todos <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {activeCourses.length > 0 ? (
                        <Card variant="inset" className="p-1 divide-y divide-border/50 flex-1 flex flex-col">
                            {activeCourses.slice(0, 4).map(course => (
                                <Link 
                                    key={course.id}
                                    href={`/academy/my-courses/${course.slug}` as any}
                                    className="flex items-start gap-3 p-3 lg:p-4 hover:bg-muted/50 transition-colors rounded-lg group shrink-0"
                                >
                                    <div className="mt-0.5 shrink-0 bg-primary/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-colors">
                                        <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-2 mb-1">
                                            <p className="text-xs font-semibold text-primary truncate">
                                                {course.details?.badge_text || "En progreso"}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                                {startedCourseIds.includes(course.id) ? "Iniciado" : "Inscrito"}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-snug">
                                            {course.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {course.details?.instructor_name ? `Por ${course.details.instructor_name}` : "Instructor Seencel"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            {/* Fill remaining space and add CTA */}
                            <div className="flex-1 min-h-[80px]" />
                            <Link 
                                href="/academy/my-courses"
                                className="flex items-center justify-center gap-2 p-3 lg:p-4 hover:bg-muted/50 transition-colors rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground shrink-0 border-t border-border/50"
                            >
                                Explorar más cursos <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Card>
                    ) : (
                        <Card variant="inset" className="p-8 border-dashed flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-semibold text-foreground mb-1">Aún no comenzaste un curso</h4>
                            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                Explorá el catálogo de la academia e inscribite en tu primer curso para empezar a aprender hoy mismo.
                            </p>
                            <Link 
                                href="/academy/my-courses" 
                                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                            >
                                Explorar Cursos
                            </Link>
                        </Card>
                    )}
                </div>

                {/* COLUMNA LATERAL - ÚLTIMAS LECCIONES */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 shrink-0">
                        <Presentation className="h-5 w-5 text-primary" />
                        Aprende donde lo dejaste
                    </h3>

                    <Card variant="inset" className="p-1 divide-y divide-border/50 flex-1 flex flex-col">
                        {recentLessons.length > 0 ? (
                            recentLessons.map((lesson) => (
                                <Link 
                                    key={lesson.lesson_id}
                                    href={`/academy/my-courses/${lesson.course_slug}/player?lessonId=${lesson.lesson_id}` as any}
                                    className="flex items-start gap-3 p-3 lg:p-4 hover:bg-muted/50 transition-colors rounded-lg group"
                                >
                                    <div className="mt-0.5 shrink-0 bg-primary/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-colors">
                                        <PlayCircle className="h-5 w-5 lg:h-6 lg:w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-2 mb-1">
                                            <p className="text-xs font-semibold text-primary truncate">
                                                {lesson.course_title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                                {formatRelativeDate(lesson.updated_at)}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-snug">
                                            {lesson.lesson_title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            Módulo: {lesson.module_title}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                                <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    El historial de las lecciones que veas aparecerá aquí para que puedas retomarlas rápidamente.
                                </p>
                            </div>
                        )}
                        {/* Fill remaining space to match height if less than 4 */}
                        {recentLessons.length > 0 && <div className="flex-1" />}
                    </Card>
                </div>
            </div>
        </div>
    );
}
