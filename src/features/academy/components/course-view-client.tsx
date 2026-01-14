"use client";

import { useEffect, useState } from "react";
import { CourseWithDetails, CourseLesson, CourseModule } from "@/types/courses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "./video-player";
import { CourseContentList } from "./course-content-list";
import { PlayCircle, GraduationCap, LayoutDashboard, List, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

interface CourseViewClientProps {
    course: CourseWithDetails;
    modules: (CourseModule & { lessons: CourseLesson[] })[];
    isPublic?: boolean;
    backHref?: string;
}

export function CourseViewClient({ course, modules, isPublic = false, backHref = "/academy/courses" }: CourseViewClientProps) {
    // State for the active lesson in the player
    const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");

    // Auto-select first lesson if none selected
    useEffect(() => {
        if (!activeLesson && modules.length > 0) {
            const firstModuleWithLessons = modules.find(m => m.lessons.length > 0);
            if (firstModuleWithLessons && firstModuleWithLessons.lessons.length > 0) {
                setActiveLesson(firstModuleWithLessons.lessons[0]);
            }
        }
    }, [modules, activeLesson]);

    const handleLessonSelect = (lesson: CourseLesson) => {
        setActiveLesson(lesson);
        setActiveTab("player"); // Switch to player tab when a lesson is clicked
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const TabsListContent = (
        <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
            <TabsTrigger
                value="dashboard"
                className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
                {isPublic ? "Información" : "Dashboard"}
            </TabsTrigger>
            <TabsTrigger
                value="player"
                className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
                Reproductor
            </TabsTrigger>
            <TabsTrigger
                value="content"
                className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
            >
                Contenido
            </TabsTrigger>
        </TabsList>
    );

    return (
        <div className="flex flex-col h-full">
            {!isPublic && (
                <HeaderTitleUpdater title={
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        Aprendizajes <span className="text-muted-foreground/40">/</span> Cursos <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">{course.title}</span>
                    </span>
                } />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                {isPublic ? (
                    <div className="border-b bg-background w-full">
                        <div className="container mx-auto px-4">
                            {TabsListContent}
                        </div>
                    </div>
                ) : (
                    <HeaderPortal>
                        {TabsListContent}
                    </HeaderPortal>
                )}

                <div className="flex-1 bg-muted/5 p-6 w-full max-w-7xl mx-auto">
                    {/* 1. DASHBOARD TAB */}
                    <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 m-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-2 items-center">
                                <h2 className="text-2xl font-bold tracking-tight">Bienvenido</h2>
                                {course.details?.badge_text && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-secondary/20">{course.details.badge_text}</Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={backHref as any}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Main Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">Sobre este curso</h2>
                                        <div className="text-muted-foreground space-y-4">
                                            <p>
                                                {course.short_description || "Este curso está diseñado para llevarte al siguiente nivel en tu carrera profesional."}
                                            </p>
                                            <p>
                                                Bienvenido al dashboard del curso. Aquí podrás ver tu progreso general, acceder a recursos adicionales y conocer más sobre lo que aprenderás.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {course.details?.instructor_name && (
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="font-semibold mb-2">Instructor</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                                    {course.details.instructor_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-lg">{course.details.instructor_name}</p>
                                                    <p className="text-sm text-muted-foreground">{course.details.instructor_title || "Instructor Experto"}</p>
                                                </div>
                                            </div>
                                            {course.details.instructor_bio && (
                                                <p className="mt-4 text-sm text-muted-foreground">{course.details.instructor_bio}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right: Progress / Stats */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Tu Progreso</h3>
                                            <span className="text-2xl font-bold text-primary">0%</span>
                                        </div>
                                        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full w-[0%]" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Comienza tu primera lección para empezar a rastrear tu progreso.
                                        </p>
                                        <Button className="w-full mt-4" onClick={() => setActiveTab("player")}>
                                            Ir al Curso
                                        </Button>
                                    </CardContent>
                                </Card>

                                {course.details?.image_path && (
                                    <div className="rounded-xl overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={course.details.image_path} alt="Preview" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* 2. PLAYER TAB */}
                    <TabsContent value="player" className="space-y-6 animate-in fade-in-50 m-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Player (2/3 width) */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="w-full">
                                    <VideoPlayer
                                        videoId={activeLesson?.vimeo_video_id || course.details?.preview_video_id || ""}
                                        title={activeLesson?.title || "Vista Previa"}
                                    />
                                </div>
                                <div className="flex items-start justify-between gap-4 px-1">
                                    <div>
                                        <h2 className="text-2xl font-bold">{activeLesson?.title || course.title}</h2>
                                        {activeLesson && (
                                            <p className="text-muted-foreground mt-1">Lección {activeLesson.sort_index}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Playlist (1/3 width) */}
                            <div className="lg:col-span-1 h-full">
                                <div className="border rounded-xl bg-card h-full flex flex-col max-h-[600px]">
                                    <div className="p-4 border-b font-semibold flex items-center gap-2">
                                        <List className="h-4 w-4" /> Contenido del Curso
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        <CourseContentList
                                            modules={modules}
                                            activeLessonId={activeLesson?.id}
                                            onLessonSelect={handleLessonSelect}
                                            className="border-0 rounded-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 3. CONTENT TAB */}
                    <TabsContent value="content" className="space-y-6 animate-in fade-in-50 m-0">
                        <Card>
                            <CardContent className="p-6">
                                <div className="max-w-3xl">
                                    <h2 className="text-xl font-semibold mb-6">Temario Completo</h2>
                                    <CourseContentList modules={modules} activeLessonId={activeLesson?.id} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
