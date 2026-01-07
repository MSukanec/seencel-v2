"use client";

import { CourseLesson, CourseModule } from "@/types/courses";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CirclePlay, Lock, CheckCircle, PlayCircle } from "lucide-react";

interface CourseContentListProps {
    modules: (CourseModule & { lessons: CourseLesson[] })[];
    activeLessonId?: string;
    onLessonSelect?: (lesson: CourseLesson) => void;
    className?: string;
}

export function CourseContentList({
    modules,
    activeLessonId,
    onLessonSelect,
    className
}: CourseContentListProps) {

    // Determine which items should be open by default
    // Ideally, open the module containing the active lesson
    const defaultValue = modules.find(m =>
        m.lessons.some(l => l.id === activeLessonId)
    )?.id || modules[0]?.id;

    return (
        <Accordion
            type="single"
            collapsible
            defaultValue={defaultValue}
            className={cn("w-full border rounded-xl bg-card overflow-hidden", className)}
        >
            {modules.map((module, index) => (
                <AccordionItem key={module.id} value={module.id} className="border-b last:border-0 px-2">
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 rounded-lg transition-colors py-4">
                        <div className="flex flex-col items-start text-left gap-1">
                            <span className="text-sm font-medium text-muted-foreground">
                                Módulo {index + 1}
                            </span>
                            <span className="text-base font-semibold">
                                {module.title}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                        <div className="flex flex-col">
                            {module.lessons.map((lesson, lessonIndex) => {
                                const isActive = lesson.id === activeLessonId;
                                const isLocked = !lesson.free_preview && !isActive; // Simplified logic for now

                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => onLessonSelect?.(lesson)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 text-left transition-colors border-l-2 border-transparent w-full",
                                            isActive
                                                ? "bg-primary/5 border-primary text-primary"
                                                : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex-shrink-0">
                                            {isActive ? (
                                                <PlayCircle className="h-5 w-5" />
                                            ) : (
                                                <CirclePlay className="h-5 w-5 opacity-70" />
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium truncate text-sm">
                                                    {lessonIndex + 1}. {lesson.title}
                                                </span>
                                                {lesson.duration_sec && (
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {Math.floor(lesson.duration_sec / 60)}:
                                                        {(lesson.duration_sec % 60).toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {module.lessons.length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground italic">
                                    No hay lecciones en este módulo aun.
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
