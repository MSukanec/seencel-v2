"use client";

import { useState } from "react";
import { CourseWithDetails } from "@/features/academy/types";
import { CourseCard } from "./course-card";
import { useTranslations } from "next-intl";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";

interface CoursesContentProps {
    courses: CourseWithDetails[];
    isDashboard?: boolean;
    detailRoute?: string;
    enrolledCourseIds?: string[];
    isPurchaseEnabled?: boolean;
}

export function CoursesContent({ courses, isDashboard = false, detailRoute = '/academy/courses', enrolledCourseIds = [], isPurchaseEnabled = true }: CoursesContentProps) {
    const t = useTranslations('Learning');
    const [searchQuery, setSearchQuery] = useState("");

    // Filter courses based on search
    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full w-full">
            {/* Hero Section - Only show on public page, not dashboard */}
            {!isDashboard && (
                <div className="max-w-7xl mx-auto w-full p-4 md:p-8 pt-8">
                    <section className="relative rounded-2xl overflow-hidden">
                        {/* Background Image - Same as founders */}
                        <img
                            src="/images/founders-hero-bg.webp"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Dark overlay - more opacity for better readability */}
                        <div className="absolute inset-0 bg-black/80" />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />

                        <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">
                                    Formación Profesional
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                                {t('title')}
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base md:text-lg text-zinc-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                                {t('description')}
                            </p>

                            {/* Founders Promo Card */}
                            <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-primary/30 p-5">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Sparkles className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left flex-1">
                                        <h3 className="font-semibold text-base text-white mb-1">
                                            ¡Acceso completo con Founders!
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            El curso Master ArchiCAD Online está disponible <strong className="text-primary">gratis</strong> para miembros Founders.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        className="bg-primary hover:bg-primary/90 rounded-full px-6"
                                    >
                                        <Link href="/founders">
                                            Ver Founders
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </section>
                </div>
            )}

            {/* Courses List */}
            <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 p-4 md:p-8">

                {/* Search Toolbar - only in dashboard */}
                {isDashboard && (
                    <Toolbar
                        portalToHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Buscar cursos..."
                    />
                )}

                {/* Courses Grid */}
                {filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                basePath={detailRoute}
                                isEnrolled={enrolledCourseIds.includes(course.id)}
                                isPurchaseEnabled={isPurchaseEnabled}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed p-16 text-center flex flex-col items-center justify-center gap-4 bg-muted/20">
                        <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                        <div className="text-muted-foreground text-lg font-medium">
                            {searchQuery ? "No se encontraron cursos con esa búsqueda." : "No se encontraron cursos activos."}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {searchQuery ? "Prueba con otros términos." : "Vuelve a intentar más tarde."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

