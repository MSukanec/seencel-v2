"use client";

import { useState, useEffect, useTransition } from "react";
import { CourseWithDetails, CourseModule, CourseLesson, LessonMarker, LessonProgress, LessonNote } from "@/features/academy/types";
import { VideoPlayer } from "@/components/ui/video-player";
import { CourseContentList } from "@/features/academy/components/course-content-list";
import { LessonMarkersList } from "@/features/academy/components/lesson-markers-list";
import { MarkerForm } from "@/features/academy/forms/marker-form";
import { toggleLessonCompleted, saveLessonSummary } from "@/features/academy/student-actions";
import { useModal } from "@/stores/modal-store";
import { ContextSidebar } from "@/stores/sidebar-store";
import { usePanel } from "@/stores/panel-store"; // Added this import
import { useAutoSave } from "@/hooks/use-auto-save";
import { List, Bookmark, CheckCircle2, Circle, Loader2, Save, FileText, Plus, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentLayout } from "@/components/layout";
import { PageHeaderActionPortal } from "@/components/layout/dashboard/header/page-header";
import { ContentCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CoursePlayerViewProps {
    course: CourseWithDetails;
    modules: (CourseModule & { lessons: CourseLesson[] })[];
    markers?: LessonMarker[];
    progress?: LessonProgress[];
    summaries?: LessonNote[];
    initialLessonId?: string;
    initialPositionSec?: number;
}

type SidebarTab = "content" | "markers";

export function CoursePlayerView({
    course,
    modules,
    markers: initialMarkers = [],
    progress = [],
    summaries = [],
    initialLessonId,
    initialPositionSec
}: CoursePlayerViewProps) {
    const { openModal } = useModal();
    const { openPanel } = usePanel(); // Added this hook call
    const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
    const [activeTab, setActiveTab] = useState<SidebarTab>("content");
    const [videoStartTime, setVideoStartTime] = useState<number | undefined>(initialPositionSec);
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(
        new Set(progress.filter(p => p.is_completed).map(p => p.lesson_id))
    );
    const [isPending, startTransition] = useTransition();

    // Markers state (for optimistic updates)
    const [markers, setMarkers] = useState<LessonMarker[]>(initialMarkers);

    // Notes state
    const [lessonSummaries, setLessonSummaries] = useState<Record<string, string>>(
        Object.fromEntries(summaries.map(s => [s.lesson_id, s.body]))
    );
    const [currentNote, setCurrentNote] = useState("");
    
    const hasNote = currentNote.trim().length > 0;
    // Notes area is open if there is a note, or if the user explicitly clicked "Agregar Apunte"
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    // AutoSave for Notes
    const { triggerAutoSave } = useAutoSave({
        saveFn: async (noteContent: string) => {
            if (!activeLesson) return;
            const result = await saveLessonSummary(activeLesson.id, noteContent);
            if (result.success) {
                setLessonSummaries(prev => ({
                    ...prev,
                    [activeLesson.id]: noteContent
                }));
            } else {
                throw new Error("No se pudo guardar el apunte");
            }
        },
        successMessage: "Apuntes guardados",
        delay: 800
    });

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setCurrentNote(val);
        triggerAutoSave(val);
    };

    // Flatten all lessons for marker navigation
    const allLessons = modules.flatMap(m => m.lessons);

    // Auto-select lesson: priority is initialLessonId > first lesson
    useEffect(() => {
        if (!activeLesson && modules.length > 0) {
            if (initialLessonId) {
                // Find the initial lesson (from resume)
                for (const module of modules) {
                    const lesson = module.lessons.find(l => l.id === initialLessonId);
                    if (lesson) {
                        setActiveLesson(lesson);
                        return;
                    }
                }
            }
            // Fallback to first lesson
            const firstModuleWithLessons = modules.find(m => m.lessons.length > 0);
            if (firstModuleWithLessons && firstModuleWithLessons.lessons.length > 0) {
                setActiveLesson(firstModuleWithLessons.lessons[0]);
            }
        }
    }, [modules, activeLesson, initialLessonId]);

    // Update current note when lesson changes
    useEffect(() => {
        if (activeLesson) {
            const savedNote = lessonSummaries[activeLesson.id] || "";
            setCurrentNote(savedNote);
            setIsNotesOpen(savedNote.trim().length > 0);
        }
    }, [activeLesson?.id, lessonSummaries]);

    const handleDeleteNote = async () => {
        if (!activeLesson) return;
        
        // Optimistic clear
        setCurrentNote("");
        setIsNotesOpen(false);
        setLessonSummaries(prev => {
            const next = { ...prev };
            delete next[activeLesson.id];
            return next;
        });

        // Backend call via AutoSave trick (saving empty string is same as delete via the action layer)
        const result = await saveLessonSummary(activeLesson.id, "");
        if (!result.success) {
            throw new Error("No se pudo eliminar el apunte");
        }
    };

    const handleLessonSelect = (lesson: CourseLesson) => {
        setActiveLesson(lesson);
        setVideoStartTime(undefined); // Reset start time when changing lessons normally
        setShouldAutoPlay(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleMarkerClick = (marker: LessonMarker, lesson: CourseLesson) => {
        // If different lesson, switch to it first
        if (activeLesson?.id !== lesson.id) {
            setActiveLesson(lesson);
        }
        // Set the start time to seek to
        setVideoStartTime(marker.time_sec);
        setShouldAutoPlay(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddMarker = () => {
        if (!activeLesson) return;

        // For now, use 0 as the time (since we don't have SDK access to current playback position)
        // In a future enhancement, this could integrate with the video player SDK
        const currentTime = videoStartTime || 0;

        openPanel(
            'academy-marker-form',
            {
                mode: "create",
                lessonId: activeLesson.id,
                timeSec: currentTime,
                onSuccess: (newMarker: any) => {
                    if (newMarker) {
                        setMarkers(prev => [...prev, newMarker]);
                    }
                }
            }
        );
    };

    const handleMarkerUpdate = (updatedMarker: LessonMarker) => {
        setMarkers(prev => prev.map(m =>
            m.id === updatedMarker.id ? updatedMarker : m
        ));
    };

    const handleMarkerDelete = (markerId: string) => {
        setMarkers(prev => prev.filter(m => m.id !== markerId));
    };

    const handleToggleComplete = () => {
        if (!activeLesson) return;

        startTransition(async () => {
            const result = await toggleLessonCompleted(activeLesson.id);
            if (result.success) {
                setCompletedLessons(prev => {
                    const newSet = new Set(prev);
                    if (result.isCompleted) {
                        newSet.add(activeLesson.id);
                    } else {
                        newSet.delete(activeLesson.id);
                    }
                    return newSet;
                });
            }
        });
    };

    const isCurrentLessonCompleted = activeLesson ? completedLessons.has(activeLesson.id) : false;
    const hasNoteChanges = activeLesson ? currentNote !== (lessonSummaries[activeLesson.id] || "") : false;

    // Navigation logic
    const activeLessonIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;
    const hasPrevLesson = activeLessonIndex > 0;
    const hasNextLesson = activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1;

    const handlePrevLesson = () => {
        if (hasPrevLesson) {
            handleLessonSelect(allLessons[activeLessonIndex - 1]);
        }
    };

    const handleNextLesson = () => {
        if (hasNextLesson) {
            handleLessonSelect(allLessons[activeLessonIndex + 1]);
        }
    };

    // Sidebar content component
    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex border-b shrink-0">
                <button
                    onClick={() => setActiveTab("content")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                        activeTab === "content"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <List className="h-4 w-4" />
                    <span className="hidden lg:inline">Contenido</span>
                </button>
                <button
                    onClick={() => setActiveTab("markers")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                        activeTab === "markers"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bookmark className="h-4 w-4" />
                    <span className="hidden lg:inline">Marcadores</span>
                    {markers.length > 0 && (
                        <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">
                            {markers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1">
                {activeTab === "content" ? (
                    <CourseContentList
                        modules={modules}
                        activeLessonId={activeLesson?.id}
                        onLessonSelect={handleLessonSelect}
                        completedLessons={completedLessons}
                        className="border-0 rounded-none"
                    />
                ) : (
                    <LessonMarkersList
                        markers={markers}
                        lessons={allLessons}
                        onMarkerClick={handleMarkerClick}
                        onMarkerUpdate={handleMarkerUpdate}
                        onMarkerDelete={handleMarkerDelete}
                    />
                )}
            </div>
        </div>
    );

    return (
        <>
            <PageHeaderActionPortal>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevLesson}
                        disabled={!hasPrevLesson}
                        title="Lección Anterior"
                        className="h-8 w-8"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </Button>

                    <Button
                        variant={isCurrentLessonCompleted ? "outline" : "default"}
                        size="sm"
                        onClick={handleToggleComplete}
                        disabled={isPending || !activeLesson}
                        className={cn(
                            "h-8 text-xs font-semibold px-3",
                            isCurrentLessonCompleted && "border-[color:var(--semantic-positive)] bg-[color:color-mix(in_srgb,var(--semantic-positive)_10%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--semantic-positive)_15%,transparent)]"
                        )}
                        style={isCurrentLessonCompleted ? { color: 'var(--semantic-positive)' } : undefined}
                    >
                        {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : isCurrentLessonCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                            <Circle className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isCurrentLessonCompleted ? "Completada" : "Marcar Completa"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextLesson}
                        disabled={!hasNextLesson}
                        title="Siguiente Lección"
                        className="h-8 w-8"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </Button>
                </div>
            </PageHeaderActionPortal>

            {/* Inject sidebar content into global right sidebar */}
            <ContextSidebar title="Lecciones">
                {sidebarContent}
            </ContextSidebar>

            <ContentLayout variant="wide">
                <div className="space-y-4">
                <VideoPlayer
                    videoId={activeLesson?.video_id || course.details?.preview_video_id || ""}
                    title={activeLesson?.title || "Vista Previa"}
                    startTime={videoStartTime}
                    autoPlay={shouldAutoPlay}
                />

                {/* Unified Lesson Info & Notes Card - Below Video */}
                <ContentCard
                    title={activeLesson?.title || course.title}
                    description={activeLesson?.duration_sec ? `${Math.floor(activeLesson.duration_sec / 60)} min` : undefined}
                    icon={<Play className="h-4 w-4" />}
                    compact
                    headerAction={
                        <div className="flex items-center gap-2">
                            {hasNote ? (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteNote}
                                    disabled={!activeLesson}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Eliminar Apuntes
                                </Button>
                            ) : (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setIsNotesOpen(true)}
                                    disabled={!activeLesson || isNotesOpen}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Agregar Apuntes
                                </Button>
                            )}
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleAddMarker}
                                disabled={!activeLesson}
                            >
                                <Bookmark className="h-4 w-4 mr-2" />
                                Agregar Marcador
                            </Button>
                        </div>
                    }
                >
                    {/* Expandable Notes Area */}
                    {isNotesOpen && activeLesson && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                             <Textarea
                                placeholder="Escribí tus apuntes sobre esta lección. Se guardan automáticamente..."
                                value={currentNote}
                                onChange={handleNoteChange}
                                className="min-h-[120px] resize-y bg-muted/30 focus:bg-background transition-colors"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Tus apuntes se guardan automáticamente al dejar de escribir.
                            </p>
                        </div>
                    )}
                </ContentCard>
                </div>
            </ContentLayout>
        </>
    );
}


