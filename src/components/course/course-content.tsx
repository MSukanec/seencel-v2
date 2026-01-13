"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
    Play,
    PlayCircle,
    Clock,
    Users,
    Award,
    CheckCircle2,
    ArrowRight,
    Star,
    Linkedin,
    Youtube,
    Instagram,
    BookOpen,
    Video,
    Globe,
    Infinity,
    RefreshCw,
    Shield,
    MessageCircle,
    Sparkles,
    GraduationCap,
    Building2,
    Rocket,
    Layers,
    Home,
    TrendingUp,
    Mountain,
    FileText,
    ImageIcon,
    DoorOpen,
    ChevronRight,
    Quote,
    Zap,
    Monitor,
    Download,
} from "lucide-react";
import { FoundersBanner } from "./founders-banner";
import { VideoPlaylistPlayer } from "@/components/shared/video-playlist-player";
import type { Course, Module, EnabledSections } from "./mock-course-data";
import { DEFAULT_ENABLED_SECTIONS } from "./mock-course-data";

interface CourseContentProps {
    course: Course;
    isDashboard?: boolean;
}

// Icon mapping for modules
const moduleIcons: Record<string, React.ElementType> = {
    Rocket: Rocket,
    Layers: Layers,
    DoorOpen: DoorOpen,
    Home: Home,
    TrendingUp: TrendingUp,
    Mountain: Mountain,
    FileText: FileText,
    Image: ImageIcon,
};

export function CourseContent({ course, isDashboard = false }: CourseContentProps) {
    const t = useTranslations("Course");

    // Merge course-specific enabled sections with defaults
    // This allows instructors to disable certain sections
    const sections: EnabledSections = {
        ...DEFAULT_ENABLED_SECTIONS,
        ...course.enabledSections
    };

    // Checkout link for course purchase
    const checkoutHref = {
        pathname: "/organization/billing/checkout" as const,
        query: { product: `course-${course.slug}`, cycle: "one-time" }
    };

    // Calculate totals
    const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const totalDuration = course.details.duration;

    return (
        <div className="relative">
            {/* ============================================ */}
            {/* SECTION 1: HERO */}
            {/* ============================================ */}
            {sections.hero && (
                <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={course.heroImage}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-60 scale-105" // Increased opacity, removed blur class
                            style={{ filter: "blur(2px)" }} // Manual light blur
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
                    </div>

                    {/* Grid pattern */}
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

                    {/* Glow effects */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse z-0" />

                    <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-start text-left">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                                {t("hero.badge")}
                            </span>
                        </div>

                        {/* Title - Reduced Size */}
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white max-w-4xl">
                            {course.title}
                        </h1>

                        {/* Subtitle - Reduced Size */}
                        <p className="text-base md:text-lg text-zinc-300 max-w-2xl mb-10 leading-relaxed">
                            {course.subtitle}
                        </p>

                        {/* Stats - Left aligned */}
                        <div className="flex flex-wrap justify-start gap-8 mb-10">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{totalDuration}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{course.modules.length} {t("hero.modules")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Video className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{totalLessons} {t("hero.lessons")}</span>
                            </div>
                        </div>

                        {/* Price - Left aligned */}
                        <div className="flex items-center justify-start gap-4 mb-10">
                            {course.originalPrice && (
                                <span className="text-xl text-zinc-500 line-through">
                                    ${course.originalPrice}
                                </span>
                            )}
                            <span className="text-4xl md:text-5xl font-bold text-white">
                                ${course.price}
                            </span>
                            <span className="text-zinc-400 font-medium">/ año</span>
                        </div>

                        {/* CTA - Left aligned */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-start">
                            <Button
                                asChild
                                size="lg"
                                className="h-14 px-10 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                            >
                                <Link href={checkoutHref}>
                                    {t("hero.cta")}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
                        <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2">
                            <div className="w-1 h-2 bg-primary/50 rounded-full" />
                        </div>
                    </div>
                </section>
            )}

            {/* SECCION: FOUNDERS BANNER (Conditional) */}
            {course.isFoundersIncluded && (
                <FoundersBanner isDashboard={isDashboard} coursePrice={course.price} />
            )}

            {/* ============================================ */}
            {/* SECTION 2: INSTRUCTOR */}
            {/* ============================================ */}
            {sections.instructor && (
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">

                            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group h-full">
                                <CardContent className="p-8 md:p-12 flex flex-col h-full bg-zinc-900">
                                    <div className="flex justify-center mb-10">
                                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl bg-zinc-900 flex items-center justify-center">
                                            {course.endorsement?.imagePath ? (
                                                <img
                                                    src={course.endorsement.imagePath}
                                                    alt={course.endorsement.title || "Endorsement"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-2">
                                                    <h4 className="text-xl font-bold text-white tracking-widest uppercase leading-none">
                                                        {course.endorsement?.title?.split(' ')[0] || "AVAL"}
                                                    </h4>
                                                    <span className="text-[10px] font-normal text-zinc-400 mt-1 tracking-wider uppercase">OFICIAL</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                            RESPALDO PROFESIONAL
                                        </p>
                                        <h3 className="text-3xl font-bold text-white mb-6">
                                            {course.endorsement?.title || "Avalado por..."}
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                            {course.endorsement?.description || "Este curso cuenta con respaldo oficial internacional."}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Col 2: Instructor */}
                            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative h-full">
                                <CardContent className="p-8 md:p-12 flex flex-col h-full bg-zinc-900">
                                    <div className="flex justify-center mb-8">
                                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl">
                                            {course.instructor.avatar ? (
                                                <img
                                                    src={course.instructor.avatar}
                                                    alt={course.instructor.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                                    <GraduationCap className="h-16 w-16 text-zinc-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center md:text-left mt-auto">
                                        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                            SOBRE EL DOCENTE
                                        </p>
                                        <h3 className="text-3xl font-bold text-white mb-6">
                                            {course.instructor.name}
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed mb-6">
                                            {course.instructor.bio}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </section>
            )}

            {/* ============================================ */}
            {/* SECTION 3: HOW IT WORKS */}
            {/* ============================================ */}
            {sections.howItWorks && (
                <section className="py-24 bg-zinc-950 relative overflow-hidden">
                    {/* Background subtle effect for the whole section */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 opacity-50 pointer-events-none" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {t("howItWorks.title")}
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                {t("howItWorks.subtitle")}
                            </p>
                        </div>

                        {/* NEW LEGACY TEXT CONTENT */}
                        <div className="max-w-4xl mx-auto mb-20">
                            <div className="space-y-8 text-lg md:text-xl text-zinc-300 leading-relaxed font-light text-center">
                                <p>
                                    Nuestra plataforma online está diseñada para ofrecerte una experiencia de aprendizaje clara, ordenada y flexible, similar a una estructura de tipo <span className="font-bold text-white">Netflix</span>.
                                </p>
                                <p>
                                    Cada curso está dividido en <span className="font-bold text-white">módulos temáticos</span>, organizados como temporadas, y dentro de cada módulo vas a encontrar <span className="font-bold text-white">lecciones en video</span> con explicaciones precisas, contenido descargable y navegación fluida.
                                </p>

                                <p>
                                    Trabajamos con <span className="font-bold text-white">Vimeo Pro</span>, lo que garantiza una reproducción segura, rápida y en alta calidad desde cualquier dispositivo, en cualquier lugar del mundo.
                                </p>

                                <p>
                                    El acceso es <span className="font-bold text-white">100% online, disponible las 24 horas, todos los días</span>. Vas a poder avanzar a tu ritmo, pausar, volver atrás o repasar una clase cuantas veces quieras. ¿Querés ver todo el curso de corrido o retomar desde donde te quedaste? Podés hacerlo sin limitaciones.
                                </p>

                                <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 mt-8">
                                    <p className="font-bold text-white text-xl">
                                        Aprendé de forma profesional, práctica y organizada. A tus tiempos. A tu ritmo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ORIGINAL GRID */}
                        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                            {[
                                { icon: Shield, key: "enroll" },
                                { icon: Monitor, key: "watch" },
                                { icon: Download, key: "practice" },
                                { icon: Award, key: "certify" },
                            ].map((step, idx) => (
                                <div key={step.key} className="relative text-center group">
                                    {/* Connector line */}
                                    {idx < 3 && (
                                        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                                    )}

                                    {/* Icon */}
                                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800 group-hover:border-primary/50 transition-colors shadow-lg">
                                        <step.icon className="h-8 w-8 text-primary" />
                                    </div>

                                    {/* Number */}
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center left-1/2 ml-4 md:ml-6 shadow-md border-2 border-zinc-950">
                                        {idx + 1}
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2 text-white">
                                        {t(`howItWorks.steps.${step.key}.title`)}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {t(`howItWorks.steps.${step.key}.description`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================ */}
            {/* SECTION 4: WHAT YOU'LL LEARN (Module Cards) */}
            {/* ============================================ */}
            {sections.curriculum && (
                <section className="py-24 bg-gradient-to-b from-zinc-900 to-background">
                    <div className="container mx-auto px-4">
                        <div className="mb-12 text-left">
                            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                {t("curriculum.subtitle")}
                            </p>
                            <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                {t("curriculum.title")}
                            </h2>
                        </div>

                        {/* Preview Video Section */}
                        {course.heroVideo && (
                            <div className="max-w-4xl mb-16">
                                <Card className="overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
                                    <div className="aspect-video relative bg-black">
                                        <iframe
                                            src={
                                                course.heroVideo.includes("vimeo")
                                                    ? `https://player.vimeo.com/video/${course.heroVideo.split("/").pop()}?autoplay=0`
                                                    : `https://www.youtube.com/embed/${course.heroVideo.includes("v=") ? course.heroVideo.split("v=")[1].split("&")[0] : course.heroVideo}?autoplay=0&rel=0`
                                            }
                                            title="Course Preview"
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                    <div className="p-4 bg-zinc-900/50 backdrop-blur border-t border-white/5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <PlayCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-100">Vista Previa del Curso</h3>
                                            <p className="text-sm text-zinc-400">Mira lo que vas a aprender en este curso.</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                            {course.modules.map((module, idx) => (
                                <Card key={module.id} className="h-full hover:border-primary/50 transition-colors overflow-hidden flex flex-col">
                                    {/* Module Image */}
                                    <div className="w-full aspect-video bg-zinc-900 relative">
                                        {module.imagePath && module.imagePath !== "/images/course-hero-placeholder.webp" ? (
                                            <img
                                                src={module.imagePath}
                                                alt={module.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                <BookOpen className="h-12 w-12 text-zinc-600" />
                                            </div>
                                        )}
                                        {/* Number Badge */}
                                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-lg">
                                            {idx + 1}
                                        </div>
                                    </div>

                                    <CardContent className="p-6 flex-grow">
                                        <h3 className="text-xl font-bold mb-3 break-words">
                                            {module.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1">
                                                <Video className="h-4 w-4" />
                                                <span>{module.lessons.length} {t("curriculum.lessons")}</span>
                                            </div>
                                        </div>

                                        <p className="text-muted-foreground text-sm line-clamp-3">
                                            {module.description}
                                        </p>
                                    </CardContent>

                                    <div className="px-6 pb-6 pt-0">
                                        <div className="w-full h-px bg-border mb-4" />
                                        <div className="space-y-2">
                                            {module.lessons.slice(0, 3).map((lesson) => (
                                                <div key={lesson.id} className="flex items-center justify-between text-sm group cursor-default">
                                                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors overflow-hidden">
                                                        <PlayCircle className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{lesson.title}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{lesson.duration}</span>
                                                </div>
                                            ))}
                                            {module.lessons.length > 3 && (
                                                <p className="text-xs text-center text-muted-foreground pt-2">
                                                    + {module.lessons.length - 3} lecciones más
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================ */}
            {/* SECTION 9: MODULES ACCORDION */}
            {/* ============================================ */}
            {
                sections.modulesAccordion && (
                    <section className="py-24">
                        <div className="container mx-auto px-4">
                            <div className="mb-12 text-left">
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                    {t("modules.subtitle")}
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                    {t("modules.title")}
                                </h2 >
                            </div>

                            <div className="max-w-3xl mx-auto">
                                <Accordion type="single" collapsible className="space-y-4">
                                    {course.modules.map((mod, idx) => {
                                        const Icon = moduleIcons[mod.icon || "Rocket"] || Rocket;
                                        return (
                                            <AccordionItem key={mod.id} value={mod.id} className="border rounded-xl px-6 bg-card">
                                                <AccordionTrigger className="hover:no-underline py-6">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Icon className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">
                                                                {t("modules.module")} {idx + 1}
                                                            </p>
                                                            <p className="font-semibold">{mod.title}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="ml-auto mr-4">
                                                            {mod.lessons.length} {t("modules.lessons")}
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-6">
                                                    <div className="pl-14 space-y-3">
                                                        {mod.lessons.map((lesson) => (
                                                            <div key={lesson.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                                                <div className="flex items-center gap-3">
                                                                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm">{lesson.title}</span>
                                                                    {lesson.isFree && (
                                                                        <Badge variant="outline" className="text-xs text-chart-2 border-chart-2">
                                                                            {t("modules.free")}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 5: COMMUNITY */}
            {/* ============================================ */}
            {
                sections.community && (
                    <section className="py-24">
                        <div className="container mx-auto px-4">
                            <div className="max-w-5xl mx-auto">
                                <div className="grid md:grid-cols-2 gap-12 items-center">
                                    {/* Left: Content */}
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-5/10 border border-chart-5/20 mb-6">
                                            <MessageCircle className="h-3 w-3 text-chart-5" />
                                            <span className="text-xs font-semibold text-chart-5">
                                                {t("community.badge")}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                            {t("community.title")}
                                        </h2>
                                        <p className="text-lg text-muted-foreground mb-6">
                                            {t("community.description")}
                                        </p>

                                        <div className="space-y-4">
                                            {["networking", "support", "events", "resources"].map((item) => (
                                                <div key={item} className="flex items-center gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                                    <span>{t(`community.features.${item}`)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-6 mt-8">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-primary">500+</p>
                                                <p className="text-sm text-muted-foreground">{t("community.members")}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-primary">24/7</p>
                                                <p className="text-sm text-muted-foreground">{t("community.support")}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Discord-like preview */}
                                    <div className="relative">
                                        <Card className="bg-[#36393f] border-none overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="bg-[#2f3136] p-4">
                                                    <div className="flex items-center gap-2 text-white font-semibold">
                                                        <MessageCircle className="h-5 w-5" />
                                                        <span>SEENCEL Community</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    {/* Mock messages */}
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">A</div>
                                                        <div>
                                                            <p className="text-sm text-zinc-300"><span className="font-semibold text-primary">Ana</span> <span className="text-zinc-500 text-xs">hoy a las 14:32</span></p>
                                                            <p className="text-zinc-400 text-sm">¡Acabo de terminar el módulo 3! 🎉</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-chart-2 flex items-center justify-center text-white font-bold">M</div>
                                                        <div>
                                                            <p className="text-sm text-zinc-300"><span className="font-semibold text-chart-2">Matías</span> <span className="text-zinc-500 text-xs">hoy a las 14:35</span></p>
                                                            <p className="text-zinc-400 text-sm">Excelente Ana! Si tienes dudas, aquí estamos 💪</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 6: STUDENT WORKS (Temporarily disabled) */}
            {/* ============================================ */}
            {/* {
                sections.studentWorks && (
                    <section className="py-24 bg-muted/30">
                        <div className="container mx-auto px-4">
                            <div className="mb-12 text-left">
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                    {t("studentWorks.subtitle")}
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                    {t("studentWorks.title")}
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {course.studentWorks.map((work) => (
                                    <Card key={work.id} className="group overflow-hidden">
                                        <div className="aspect-video bg-gradient-to-br from-zinc-700 to-zinc-800 relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <h3 className="font-semibold text-white mb-1">{work.title}</h3>
                                                <p className="text-sm text-zinc-300">{work.author}</p>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">{work.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            } */}

            {/* ============================================ */}
            {/* SECTION 7: FREE MASTERCLASSES */}
            {/* ============================================ */}
            {
                sections.masterclasses && course.masterclasses && course.masterclasses.length > 0 && (
                    <section id="masterclasses" className="py-24">
                        <div className="container mx-auto px-4">
                            <div className="mb-12 text-left">
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                    {t("masterclasses.subtitle")}
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                    {t("masterclasses.title")}
                                </h2>
                            </div>

                            <div className="max-w-6xl mx-auto">
                                <VideoPlaylistPlayer
                                    videos={course.masterclasses.map(mc => ({
                                        id: mc.id,
                                        title: mc.title,
                                        url: mc.videoUrl || "",
                                        duration: mc.duration,
                                        thumbnail: mc.thumbnail,
                                        type: "youtube" // Defaulting to youtube/generic for now, player handles detection
                                    }))}
                                    title={t("masterclasses.playlistTitle") || "Clases Disponibles"}
                                />
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 8: LICENSE CTA */}
            {/* ============================================ */}
            {
                sections.licenseCta && (
                    <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20">
                        <div className="container mx-auto px-4">
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Building2 className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{t("license.title")}</h3>
                                        <p className="text-muted-foreground">{t("license.subtitle")}</p>
                                    </div>
                                </div>
                                <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                                    <Link href="/contact">
                                        {t("license.cta")}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                )
            }



            {/* ============================================ */}
            {/* SECTION 10: COURSE DETAILS */}
            {/* ============================================ */}
            {
                sections.courseDetails && (
                    <section className="py-24 bg-zinc-100 dark:bg-zinc-900/50">
                        <div className="container mx-auto px-4">
                            <div className="max-w-6xl mx-auto">
                                <div className="mb-12">
                                    <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                        INFORMACIÓN COMPLETA
                                    </p>
                                    <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                        DETALLES DEL CURSO
                                    </h2>
                                    <p className="text-lg text-muted-foreground">
                                        Todo lo que necesitas saber antes de comenzar
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Card 1: Detalles Completos */}
                                    <Card className="border-none shadow-lg">
                                        <CardContent className="p-8 md:p-10">
                                            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                                INFORMACIÓN DEL CURSO
                                            </p>
                                            <h3 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-white">
                                                Detalles Completos
                                            </h3>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">SISTEMA:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Online</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">FORMATO:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Videos bajo demanda</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">DISPOSITIVOS:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">PC, Tablet, Móviles</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">CERTIFICADO:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">De curso realizado</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">REQUISITOS:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                                        {course.details.requirements.length > 0 ? course.details.requirements.join(", ") : "Sin conocimientos previos requeridos"}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Card 2: Tu Suscripción */}
                                    <Card className="border-none shadow-lg">
                                        <CardContent className="p-8 md:p-10">
                                            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                                ACCESO Y DURACIÓN
                                            </p>
                                            <h3 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-white">
                                                Tu Suscripción
                                            </h3>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">TIPO:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Acceso anual ilimitado</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">DURACIÓN:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">365 días desde la suscripción</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">CARÁCTER:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Individual e intransferible</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">ACCESO:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">100% online, disponible 24/7</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">VELOCIDAD:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Aprende a tu ritmo, cuantas veces quieras</span>
                                                </div>
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
                                                    <span className="text-sm font-bold text-zinc-500 uppercase">CONTENIDO:</span>
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Descargas, videos, y material complementario</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* ORIGINAL GRID CONTENT RESTORED */}
                                <div className="mt-16 pt-16 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                        {[
                                            { icon: Clock, label: t("details.duration"), value: course.details.duration },
                                            { icon: Video, label: t("details.format"), value: course.details.format },
                                            { icon: TrendingUp, label: t("details.level"), value: course.details.level },
                                            { icon: Globe, label: t("details.language"), value: course.details.language },
                                        ].map((item) => (
                                            <Card key={item.label}>
                                                <CardContent className="p-6 text-center">
                                                    <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                                                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                                                    <p className="font-semibold">{item.value}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        {[
                                            { icon: Award, label: t("details.certificate"), active: course.details.certificate },
                                            { icon: Infinity, label: t("details.lifetime"), active: course.details.lifetime },
                                            { icon: RefreshCw, label: t("details.updates"), active: course.details.updates },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                    item.active ? "bg-primary/10" : "bg-muted"
                                                )}>
                                                    <item.icon className={cn("h-5 w-5", item.active ? "text-primary" : "text-muted-foreground")} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.active ? t("details.included") : t("details.notIncluded")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 11: FINAL CTA */}
            {/* ============================================ */}
            {
                sections.finalCta && (
                    <section className="py-24 bg-gradient-to-b from-zinc-900 to-background relative overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[200px]" />

                        <div className="container mx-auto px-4 relative z-10">
                            <div className="text-center max-w-3xl mx-auto">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                                    {t("finalCta.title")}
                                </h2>
                                <p className="text-xl text-zinc-400 mb-8">
                                    {t("finalCta.subtitle")}
                                </p>

                                {/* Price recap */}
                                <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 mb-8">
                                    {course.originalPrice && (
                                        <span className="text-xl text-zinc-500 line-through">
                                            ${course.originalPrice}
                                        </span>
                                    )}
                                    <span className="text-4xl font-bold text-white">
                                        ${course.price}
                                    </span>
                                    <span className="text-zinc-400">{course.currency}</span>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-16 px-12 text-xl font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-105"
                                    >
                                        <Link href={checkoutHref}>
                                            {t("finalCta.cta")}
                                            <ArrowRight className="ml-3 h-6 w-6" />
                                        </Link>
                                    </Button>

                                    <p className="text-sm text-zinc-500">
                                        {t("finalCta.guarantee")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 12: TRUSTED BY */}
            {/* ============================================ */}
            {
                sections.trustedBy && (
                    <section className="py-16 border-b">
                        <div className="container mx-auto px-4">
                            <p className="text-center text-sm text-muted-foreground uppercase tracking-wider mb-8">
                                {t("trustedBy.title")}
                            </p>
                            <div className="flex flex-wrap justify-center items-center gap-12">
                                {course.trustedCompanies.map((company) => (
                                    <div key={company.name} className="opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="h-8 w-24 bg-muted rounded flex items-center justify-center">
                                            <span className="text-xs font-medium text-muted-foreground">{company.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ============================================ */}
            {/* SECTION 13: FAQs */}
            {/* ============================================ */}
            {
                sections.faqs && (
                    <section className="py-24">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                    {t("faqs.title")}
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    {t("faqs.subtitle")}
                                </p>
                            </div>

                            <div className="max-w-3xl mx-auto">
                                <Accordion type="single" collapsible className="space-y-4">
                                    {course.faqs.map((faq) => (
                                        <AccordionItem key={faq.id} value={faq.id} className="border rounded-xl px-6 bg-card">
                                            <AccordionTrigger className="hover:no-underline py-6 text-left">
                                                {faq.questionKey}
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-6 text-muted-foreground">
                                                {faq.answerKey}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </section>
                )
            }



            {/* ============================================ */}
            {/* SECTION 11: TESTIMONIALS */}
            {/* ============================================ */}
            {
                sections.testimonials && (
                    <section id="testimonials" className="py-24 relative overflow-hidden">
                        {/* Background Blobs for specific "innovation" feel */}
                        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
                        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-chart-2/10 rounded-full blur-[128px] pointer-events-none" />

                        <div className="container mx-auto px-4 relative z-10">
                            <div className="mb-16 text-left max-w-3xl">
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                    {t("testimonials.subtitle")}
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-zinc-800 dark:text-white mb-4">
                                    {t("testimonials.title")}
                                </h2>
                            </div>

                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                {course.testimonials.map((testimonial) => (
                                    <Card key={testimonial.id} className="relative break-inside-avoid bg-zinc-900/40 backdrop-blur-md border-white/10 hover:border-primary/30 transition-all duration-300 shadow-xl overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <CardContent className="p-8 relative">
                                            {/* Quote icon - large and subtle bg */}
                                            <Quote className="h-12 w-12 text-primary/10 absolute top-4 right-4 fill-primary/5" />

                                            {/* Author Header */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shrink-0">
                                                    {testimonial.author_avatar_url ? (
                                                        <img
                                                            src={testimonial.author_avatar_url}
                                                            alt={testimonial.author_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-bold">
                                                            {testimonial.author_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-100 leading-tight">{testimonial.author_name}</p>
                                                    {testimonial.author_title && (
                                                        <p className="text-xs text-primary font-medium mt-0.5">
                                                            {testimonial.author_title}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex gap-0.5 mb-4">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-3.5 w-3.5",
                                                            i < (testimonial.rating || 5)
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "fill-zinc-800 text-zinc-800"
                                                        )}
                                                    />
                                                ))}
                                            </div>

                                            {/* Content */}
                                            <p className="text-zinc-300 leading-relaxed text-sm italic">
                                                "{testimonial.content}"
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }
        </div >
    );
}
