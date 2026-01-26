"use client";

import { motion } from "framer-motion";
import {
    Briefcase,
    GraduationCap,
    Users,
    ArrowRight,
    Calendar,
    Clock,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeaderNotificationsButton } from "@/components/shared/header-notifications-button";
import { HeroCarousel, type HeroSlide } from "@/components/shared/hero-carousel";
import type { UserProfile } from "@/types/user";
import type { HeroSection } from "@/features/hero-sections/queries";

interface DashboardHomeViewProps {
    user: UserProfile | null;
    activeOrgId?: string;
    activeOrgName?: string;
    heroSlides?: HeroSection[];
    userTimezone?: string; // IANA timezone e.g. "America/Argentina/Buenos_Aires"
    recentCourses?: { id: string; slug: string; title: string; status: string; created_at: string }[];
    communityOrgsCount?: number; // New orgs in last 30 days + offset
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
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? 's' : ''}`;
    return `Hace ${Math.floor(diffDays / 30)} mes${diffDays >= 60 ? 'es' : ''}`;
}

export function DashboardHomeView({
    user,
    activeOrgId,
    activeOrgName,
    heroSlides = [],
    userTimezone,
    recentCourses = [],
    communityOrgsCount = 0
}: DashboardHomeViewProps) {

    // Transform courses to news format
    const academyNews = recentCourses.map(c => ({
        title: c.title,
        date: c.status === 'coming_soon' ? 'Próximamente' : formatRelativeDate(c.created_at)
    }));

    // Community news with real data
    const communityNews = [
        { title: `${communityOrgsCount} nuevas organizaciones`, date: "Últimos 30 días" },
        { title: "Foro de discusión en desarrollo", date: "Próximamente" },
    ];

    // Transform hero sections to HeroSlide format
    const slides: HeroSlide[] = heroSlides.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        mediaUrl: s.media_url,
        mediaType: s.media_type as any,
        primaryButton: s.primary_button_text ? {
            text: s.primary_button_text,
            action: s.primary_button_action || '',
            actionType: (s.primary_button_action_type as any) || 'route',
        } : null,
        secondaryButton: s.secondary_button_text ? {
            text: s.secondary_button_text,
            action: s.secondary_button_action || '',
            actionType: (s.secondary_button_action_type as any) || 'route',
        } : null,
    }));

    const getGreeting = () => {
        // Use user's timezone if available, otherwise fallback to local time
        let hour: number;
        if (userTimezone) {
            try {
                const formatter = new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    hour12: false,
                    timeZone: userTimezone
                });
                hour = parseInt(formatter.format(new Date()), 10);
            } catch {
                hour = new Date().getHours();
            }
        } else {
            hour = new Date().getHours();
        }

        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="h-full w-full bg-gradient-to-br from-background via-muted/10 to-background relative overflow-y-auto">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none -translate-x-1/3 translate-y-1/3" />

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Hero Carousel (if slides exist) */}
                {slides.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroCarousel slides={slides} autoPlay={true} interval={4000} />
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-1">
                            <Calendar className="h-4 w-4" />
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                            {getGreeting()}, <span className="text-primary">{user?.first_name || 'Arquitecto'}</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Bienvenido a tu centro de control Seencel.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <HeaderNotificationsButton />
                    </div>
                </motion.div>

                {/* 3 Main Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Work Card */}
                    <DashboardCard
                        title="Espacio de Trabajo"
                        description={activeOrgName || "Gestiona tus obras y proyectos"}
                        icon={Briefcase}
                        href="/organization"
                        actionLabel={activeOrgId ? "Ir a Obras" : "Crear Organización"}
                        news={[]} // No mock news for workspace
                        variants={itemVariants}
                    />

                    {/* Academy Card */}
                    <DashboardCard
                        title="Academia Seencel"
                        description="Cursos y formación continua"
                        icon={GraduationCap}
                        href="/academy/my-courses"
                        actionLabel="Mis Cursos"
                        news={academyNews}
                        variants={itemVariants}
                    />

                    {/* Community Card - Always visible, with "Próximamente" */}
                    <DashboardCard
                        title="Comunidad"
                        description="Conecta con otros profesionales"
                        icon={Users}
                        href="/community"
                        actionLabel="Próximamente"
                        isComingSoon={true}
                        news={communityNews}
                        variants={itemVariants}
                    />
                </motion.div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

interface NewsItem {
    title: string;
    date: string;
}

interface DashboardCardProps {
    title: string;
    description: string;
    icon: any;
    href: string;
    actionLabel: string;
    news: NewsItem[];
    variants: any;
    isComingSoon?: boolean;
}

function DashboardCard({
    title,
    description,
    icon: Icon,
    href,
    actionLabel,
    news,
    variants,
    isComingSoon = false
}: DashboardCardProps) {

    const CardContentWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div variants={variants} className="h-full">
            <Card className={cn(
                "h-full transition-all duration-300 border-border/50 overflow-hidden relative group",
                !isComingSoon && "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 cursor-pointer",
                isComingSoon && "opacity-90"
            )}>
                {/* Background Gradient on Hover */}
                {!isComingSoon && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr from-primary to-transparent" />
                )}

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {isComingSoon && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Próximamente
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div>
                        <CardTitle className="text-xl mb-1">{title}</CardTitle>
                        <CardDescription className="text-base line-clamp-1">
                            {description}
                        </CardDescription>
                    </div>

                    {/* News Section inside card */}
                    <div className="border-t border-border/50 pt-3 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Novedades</p>
                        {news.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-foreground/80 truncate max-w-[70%]">{item.title}</span>
                                <span className="text-xs text-muted-foreground">{item.date}</span>
                            </div>
                        ))}
                    </div>

                    {!isComingSoon && (
                        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                            {actionLabel}
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    if (isComingSoon) {
        return <CardContentWrapper>...</CardContentWrapper>;
    }

    return (
        <Link href={href as any}>
            <CardContentWrapper>...</CardContentWrapper>
        </Link>
    );
}
