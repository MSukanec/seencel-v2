"use client";

import { useState, useEffect, useTransition } from "react";
import { CourseWithDetails, CourseModule, CourseLesson, LessonMarker, LessonProgress, LessonNote } from "@/types/courses";
import { VideoPlayer } from "@/components/ui/video-player";
import { CourseContentList } from "@/features/academy/components/course-content-list";
import { LessonMarkersList } from "@/features/academy/components/lesson-markers-list";
import { MarkerForm } from "@/features/academy/components/forms/marker-form";
import { toggleLessonCompleted, saveLessonSummary } from "@/actions/courses";
import { useModal } from "@/providers/modal-store";
import { List, Bookmark, CheckCircle2, Circle, Loader2, Save, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
    const [activeTab, setActiveTab] = useState<SidebarTab>("content");
    const [videoStartTime, setVideoStartTime] = useState<number | undefined>(initialPositionSec);
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
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);

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
            setCurrentNote(lessonSummaries[activeLesson.id] || "");
            setNoteSaved(false);
        }
    }, [activeLesson?.id, lessonSummaries]);

    const handleLessonSelect = (lesson: CourseLesson) => {
        setActiveLesson(lesson);
        setVideoStartTime(undefined); // Reset start time when changing lessons normally
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleMarkerClick = (marker: LessonMarker, lesson: CourseLesson) => {
        // If different lesson, switch to it first
        if (activeLesson?.id !== lesson.id) {
            setActiveLesson(lesson);
        }
        // Set the start time to seek to
        setVideoStartTime(marker.time_sec);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddMarker = () => {
        if (!activeLesson) return;

        // For now, use 0 as the time (since we don't have SDK access to current playback position)
        // In a future enhancement, this could integrate with the video player SDK
        const currentTime = videoStartTime || 0;

        openModal(
            <MarkerForm
                mode="create"
                lessonId={activeLesson.id}
                timeSec={currentTime}
                onSuccess={(newMarker) => {
                    if (newMarker) {
                        setMarkers(prev => [...prev, newMarker]);
                    }
                }}
            />,
            {
                title: "Agregar Marcador",
                description: "Guardá un momento importante de esta lección con un comentario",
                size: "md"
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

    const handleSaveNote = async () => {
        if (!activeLesson) return;

        setIsSavingNote(true);
        try {
            const result = await saveLessonSummary(activeLesson.id, currentNote);
            if (result.success) {
                setLessonSummaries(prev => ({
                    ...prev,
                    [activeLesson.id]: currentNote
                }));
                setNoteSaved(true);
                setTimeout(() => setNoteSaved(false), 2000);
            }
        } finally {
            setIsSavingNote(false);
        }
    };

    const isCurrentLessonCompleted = activeLesson ? completedLessons.has(activeLesson.id) : false;
    const hasNoteChanges = activeLesson ? currentNote !== (lessonSummaries[activeLesson.id] || "") : false;

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: Video Player and Info (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Lesson Info Card - Above Video */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold">{activeLesson?.title || course.title}</h2>
                                    {activeLesson && (
                                        <p className="text-muted-foreground mt-1">
                                            Lección {activeLesson.sort_index + 1}
                                            {activeLesson.duration_sec && (
                                                <span className="ml-2">· {Math.floor(activeLesson.duration_sec / 60)} min</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddMarker}
                                        disabled={!activeLesson}
                                    >
                                        <Bookmark className="h-4 w-4 mr-2" />
                                        Marcador
                                    </Button>
                                    {activeLesson && (
                                        <Button
                                            variant={isCurrentLessonCompleted ? "outline" : "default"}
                                            size="sm"
                                            onClick={handleToggleComplete}
                                            disabled={isPending}
                                            className={cn(
                                                isCurrentLessonCompleted && "text-green-600 border-green-600 hover:bg-green-50"
                                            )}
                                        >
                                            {isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : isCurrentLessonCompleted ? (
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                            ) : (
                                                <Circle className="h-4 w-4 mr-2" />
                                            )}
                                            {isCurrentLessonCompleted ? "Completada" : "Marcar Completa"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <VideoPlayer
                        videoId={activeLesson?.video_id || course.details?.preview_video_id || ""}
                        title={activeLesson?.title || "Vista Previa"}
                        startTime={videoStartTime}
                        autoPlay={videoStartTime !== undefined}
                    />

                    {/* Notes Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5" />
                                Apuntes de la Lección
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                placeholder="Escribí tus apuntes sobre esta lección..."
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                className="min-h-[120px] resize-y"
                                disabled={!activeLesson}
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    {activeLesson
                                        ? "Tus apuntes se guardan por lección"
                                        : "Seleccioná una lección para agregar apuntes"
                                    }
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleSaveNote}
                                    disabled={!activeLesson || isSavingNote || (!hasNoteChanges && !noteSaved)}
                                    className={cn(
                                        noteSaved && "bg-green-600 hover:bg-green-600"
                                    )}
                                >
                                    {isSavingNote ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : noteSaved ? (
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {noteSaved ? "Guardado" : "Guardar Apuntes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Sidebar with Tabs (1/3 width) */}
                <div className="lg:col-span-1">
                    <div className="border rounded-xl bg-card flex flex-col max-h-[600px]">
                        {/* Tabs Header */}
                        <div className="flex border-b">
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
                                Contenido
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
                                Marcadores
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
                </div>
            </div>
        </div >
    );
}

