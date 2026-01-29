"use client";

import { motion } from "framer-motion";
import {
    Briefcase,
    GraduationCap,
    Users,
    Building,
    ArrowRight,
    Calendar,
    Clock,
    Lock,
    Crown,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { getStorageUrl } from "@/lib/storage-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeaderNotificationsButton } from "@/components/shared/header-notifications-button";
import { HeroCarousel, type HeroSlide } from "@/components/shared/hero-carousel";
import type { UserProfile } from "@/types/user";
import type { HeroSection } from "@/features/hero-sections/queries";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { useOrganization } from "@/context/organization-context";

interface HubViewProps {
    user: UserProfile | null;
    activeOrgId?: string;
    activeOrgName?: string;
    activeOrgLogo?: string | null;
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

export function HubView({
    user,
    activeOrgId,
    activeOrgName,
    activeOrgLogo,
    heroSlides = [],
    userTimezone,
    recentCourses = [],
    communityOrgsCount = 0
}: HubViewProps) {
    // Feature flags integration - same logic as sidebar
    const { statuses, isAdmin } = useFeatureFlags();
    const { isFounder } = useOrganization();

    // Helper to compute card status from feature flags
    const getCardStatus = (flagKey: string): { status: 'active' | 'maintenance' | 'founders' | 'hidden'; disabled: boolean } => {
        const flag = statuses[flagKey] || 'active';

        if (flag === 'hidden') {
            return { status: 'hidden', disabled: !isAdmin };
        }
        if (flag === 'maintenance') {
            return { status: 'maintenance', disabled: !isAdmin };
        }
        if (flag === 'founders') {
            return { status: 'founders', disabled: !(isAdmin || isFounder) };
        }
        return { status: 'active', disabled: false };
    };

    // Card statuses based on feature flags
    const workspaceStatus = getCardStatus('context_workspace_enabled');
    const portalStatus = getCardStatus('context_portal_enabled');
    const academyStatus = getCardStatus('context_academy_enabled');
    const communityStatus = getCardStatus('context_community_enabled');

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
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Work Card - Conditionally rendered based on workspace flag */}
                    {workspaceStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Espacio de Trabajo"
                            description={activeOrgName || "Gestiona tus obras y proyectos"}
                            icon={Briefcase}
                            href="/organization"
                            actionLabel={activeOrgId ? "Ir a Obras" : "Crear Organización"}
                            news={[]}
                            variants={itemVariants}
                            status={workspaceStatus.status}
                            disabled={workspaceStatus.disabled}
                        />
                    )}

                    {/* Portal de Clientes Card - between Workspace and Academy */}
                    {portalStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Portal de Clientes"
                            description="Accede a tu portal como cliente"
                            icon={Building}
                            href="/portal"
                            actionLabel="Ir a Mi Portal"
                            news={[
                                { title: "Tus proyectos y pagos", date: "Disponible" },
                            ]}
                            variants={itemVariants}
                            status={portalStatus.status}
                            disabled={portalStatus.disabled}
                        />
                    )}

                    {/* Academy Card - Conditionally rendered based on academy flag */}
                    {academyStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Academia Seencel"
                            description="Cursos y formación continua"
                            icon={GraduationCap}
                            href="/academy/my-courses"
                            actionLabel="Mis Cursos"
                            news={academyNews}
                            variants={itemVariants}
                            status={academyStatus.status}
                            disabled={academyStatus.disabled}
                        />
                    )}

                    {/* Community Card - Conditionally rendered based on community flag */}
                    {communityStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Comunidad"
                            description="Conecta con otros profesionales"
                            icon={Users}
                            href="/community"
                            actionLabel={communityStatus.status === 'active' ? "Ver Comunidad" : "Próximamente"}
                            news={communityNews}
                            variants={itemVariants}
                            status={communityStatus.status}
                            disabled={communityStatus.disabled}
                        />
                    )}
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
    status?: 'active' | 'maintenance' | 'founders' | 'hidden';
    disabled?: boolean;
}

function DashboardCard({
    title,
    description,
    icon: Icon,
    href,
    actionLabel,
    news,
    variants,
    status = 'active',
    disabled = false
}: DashboardCardProps) {
    const isLocked = disabled || status === 'maintenance' || status === 'founders';

    // Badge based on status
    const renderBadge = () => {
        if (status === 'maintenance') {
            return (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                    <Lock className="h-3 w-3 mr-1" />
                    Mantenimiento
                </Badge>
            );
        }
        if (status === 'founders') {
            return (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    <Crown className="h-3 w-3 mr-1" />
                    Fundadores
                </Badge>
            );
        }
        return null;
    };

    const CardContentWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div variants={variants} className="h-full">
            <Card className={cn(
                "h-full transition-all duration-300 border-border/50 overflow-hidden relative group",
                !isLocked && "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 cursor-pointer",
                isLocked && "opacity-60 grayscale-[30%]"
            )}>
                {/* Background Gradient on Hover */}
                {!isLocked && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr from-primary to-transparent" />
                )}

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        isLocked ? "bg-muted" : "bg-primary/10"
                    )}>
                        <Icon className={cn(
                            "h-6 w-6",
                            isLocked ? "text-muted-foreground" : "text-primary"
                        )} />
                    </div>
                    {renderBadge()}
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

                    {!isLocked && (
                        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                            {actionLabel}
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    if (isLocked) {
        return <CardContentWrapper>...</CardContentWrapper>;
    }

    return (
        <Link href={href as any}>
            <CardContentWrapper>...</CardContentWrapper>
        </Link>
    );
}
