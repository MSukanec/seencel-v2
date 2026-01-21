"use client";

import { CourseModule, CourseLesson } from "@/types/courses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ContentLayout } from "@/components/layout";

interface CourseContentViewProps {
    modules: (CourseModule & { lessons: CourseLesson[] })[];
    courseSlug: string;
    // Progress data (will come from DB later)
    completedLessonIds?: string[];
}

export function CourseContentView({
    modules,
    courseSlug,
    completedLessonIds = []
}: CourseContentViewProps) {
    const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

    return (
        <ContentLayout variant="narrow">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Contenido del Curso</h2>
                    <p className="text-muted-foreground">
                        {modules.length} módulos · {totalLessons} lecciones
                    </p>
                </div>

                <div className="space-y-4">
                    {modules.map((module, moduleIndex) => (
                        <Card key={module.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground">Módulo {moduleIndex + 1}:</span>
                                    {module.title}
                                </CardTitle>
                                {module.description && (
                                    <p className="text-sm text-muted-foreground">{module.description}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {module.lessons?.map((lesson, lessonIndex) => {
                                    const isCompleted = completedLessonIds.includes(lesson.id);
                                    return (
                                        <div
                                            key={lesson.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground w-6">
                                                    {lessonIndex + 1}.
                                                </span>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm">{lesson.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {lesson.duration_sec && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {Math.floor(lesson.duration_sec / 60)} min
                                                    </span>
                                                )}
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={`/academy/my-courses/${courseSlug}/player` as any}>
                                                        <Play className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!module.lessons || module.lessons.length === 0) && (
                                    <p className="text-sm text-muted-foreground py-2">
                                        No hay lecciones en este módulo.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {modules.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    El contenido del curso se está preparando.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </ContentLayout>
    );
}
