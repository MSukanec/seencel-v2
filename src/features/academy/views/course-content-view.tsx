"use client";

import { CourseModule, CourseLesson } from "@/features/academy/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Clock, CheckCircle2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { markModuleAsCompleted } from "@/features/academy/student-actions";
import { Link } from "@/i18n/routing";
import { ContentLayout } from "@/components/layout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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
    const [loadingModuleId, setLoadingModuleId] = useState<string | null>(null);
    const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

    const handleMarkAllCompleted = async (e: React.MouseEvent, module: CourseModule & { lessons: CourseLesson[] }) => {
        e.preventDefault();
        e.stopPropagation();

        if (!module.lessons || module.lessons.length === 0) {
            toast.error("El módulo no tiene lecciones.");
            return;
        }

        setLoadingModuleId(module.id);
        const toastId = toast.loading(`Marcando lecciones de "${module.title}" como completadas...`);

        const lessonIds = module.lessons.map(l => l.id);
        const result = await markModuleAsCompleted(module.course_id, lessonIds);

        if (result.success) {
            toast.success("Módulo completado con éxito.", { id: toastId });
        } else {
            toast.error(result.error || "Hubo un error al marcar las lecciones.", { id: toastId });
        }
        
        setLoadingModuleId(null);
    };

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
                    {modules.length > 0 && (
                        <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="w-full space-y-4">
                            {modules.map((module, moduleIndex) => {
                                const moduleCompletedLessons = module.lessons?.filter(l => completedLessonIds.includes(l.id)).length || 0;
                                const isModuleFullyCompleted = module.lessons?.length > 0 && moduleCompletedLessons === module.lessons.length;

                                return (
                                    <AccordionItem key={module.id} value={module.id} className="border bg-card rounded-xl px-2 overflow-hidden shadow-sm">
                                        <AccordionTrigger className="hover:no-underline px-4 py-4 data-[state=open]:border-b-0">
                                            <div className="flex flex-col items-start text-left gap-1 w-full pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground text-sm font-medium">Módulo {moduleIndex + 1}:</span>
                                                    <span className="font-semibold text-base flex-1">
                                                        {module.title}
                                                        <span className="text-muted-foreground text-sm font-normal ml-2 bg-muted/50 px-2 py-0.5 rounded-full inline-flex items-center">
                                                            {moduleCompletedLessons}/{module.lessons?.length || 0}
                                                        </span>
                                                    </span>
                                                    {isModuleFullyCompleted && <CheckCircle2 className="w-4 h-4 text-primary ml-2 hidden sm:block delay-150 transition-all" />}
                                                </div>
                                                {module.description && (
                                                    <p className="text-sm text-muted-foreground font-normal line-clamp-1">{module.description}</p>
                                                )}
                                            </div>
                                            
                                            <div className="ml-auto mr-4 flex flex-shrink-0 items-center gap-2">
                                                {!isModuleFullyCompleted && (module.lessons?.length || 0) > 0 && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 gap-1.5 text-xs font-semibold"
                                                        onClick={(e) => handleMarkAllCompleted(e, module)}
                                                        disabled={loadingModuleId === module.id}
                                                    >
                                                        {loadingModuleId === module.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Check className="w-3 h-3" />
                                                        )}
                                                        <span className="hidden sm:inline">Marcar completadas</span>
                                                        <span className="sm:hidden">Completar</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 pt-0">
                                            <div className="space-y-2 mt-2">
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
                                                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                                                ) : (
                                                                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                                                )}
                                                                <span className={isCompleted ? "text-sm text-muted-foreground" : "text-sm font-medium"}>
                                                                    {lesson.title}
                                                                </span>
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
                                                    <p className="text-sm text-muted-foreground py-2 text-center">
                                                        No hay lecciones en este módulo.
                                                    </p>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}

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

