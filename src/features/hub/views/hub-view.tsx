"use client";

import { motion } from "framer-motion";
import {
    Briefcase,
    GraduationCap,
    Compass,
    Building,
    ArrowRight,
    Calendar,
    Clock,
    Lock,
    Crown,
    Wrench,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { getStorageUrl } from "@/lib/storage-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ContentLayout } from "@/components/layout";
import { HeroCarousel, type HeroSlide } from "@/components/shared/hero-carousel";
import type { UserProfile } from "@/types/user";
import type { HeroSection } from "@/features/hero-sections/queries";
import { useEntitlements, type EntitlementKey } from "@/hooks/use-entitlements";
import { useOrganization } from "@/stores/organization-store";

interface HubViewProps {
    user: UserProfile | null;
    activeOrgId?: string;
    activeOrgName?: string;
    activeOrgLogo?: string | null;
    heroSlides?: HeroSection[];
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
    recentCourses = [],
    communityOrgsCount = 0
}: HubViewProps) {
    // Feature flags integration - same logic as sidebar
    const { check: checkEntitlement } = useEntitlements();
    const { isFounder } = useOrganization();
    const { actions } = useLayoutStore();

    const getCardStatus = (flagKey: EntitlementKey) => {
        const result = checkEntitlement(flagKey);
        
        const cardStatus = (result.rawStatus as any) || 'hidden';
        
        if (result.isShadowMode) {
            return { status: cardStatus, disabled: false, isShadowMode: true };
        }
        
        if (!result.isAllowed) {
            return { status: cardStatus, disabled: true, isShadowMode: false };
        }

        return { status: 'active', disabled: false, isShadowMode: false };
    };

    // Card statuses based on feature flags
    const workspaceStatus = getCardStatus('context:workspace');
    const academyStatus = getCardStatus('context:academy');
    const discoverStatus = getCardStatus('context:discover');

    // Transform courses to news format
    const academyNews = recentCourses.map(c => ({
        title: c.title,
        date: c.status === 'coming_soon' ? 'Próximamente' : formatRelativeDate(c.created_at)
    }));

    // Discover news with real data
    const discoverNews = [
        { title: `${communityOrgsCount} nuevas organizaciones`, date: "Últimos 30 días" },
        { title: "Explorador interactivo de proyectos", date: "Próximamente" },
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
        <ContentLayout 
            variant="wide" 
            className="overflow-x-hidden !pb-6"
        >
            <div className="space-y-8 w-full">
                {/* Hero Carousel - Now FIRST */}
                {slides.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroCarousel slides={slides} autoPlay={true} interval={4000} />
                    </motion.div>
                )}

                {/* 3 Main Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Work Card */}
                    {workspaceStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Espacio de Trabajo"
                            description={activeOrgName || "Gestiona tus obras y proyectos"}
                            icon={Building}
                            href="/organization"
                            actionLabel={activeOrgId ? "Ir a Obras" : "Crear Organización"}
                            news={[]}
                            variants={itemVariants}
                            status={workspaceStatus.status}
                            disabled={workspaceStatus.disabled}
                            isShadowMode={workspaceStatus.isShadowMode}
                            onClick={() => actions.setActiveContext('organization')}
                        />
                    )}

                    {/* Academy Card */}
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
                            isShadowMode={academyStatus.isShadowMode}
                            onClick={() => actions.setActiveContext('learnings')}
                        />
                    )}

                    {/* Discover Card */}
                    {discoverStatus.status !== 'hidden' && (
                        <DashboardCard
                            title="Descubrir"
                            description="Explora proyectos y conecta"
                            icon={Compass}
                            href="/discover"
                            actionLabel={discoverStatus.status === 'active' ? "Explorar" : "Próximamente"}
                            news={discoverNews}
                            variants={itemVariants}
                            status={discoverStatus.status}
                            disabled={discoverStatus.disabled}
                            isShadowMode={discoverStatus.isShadowMode}
                            onClick={() => actions.setActiveContext('discover')}
                        />
                    )}
                </motion.div>
            </div>
        </ContentLayout>
    );
}

// --- Subcomponents ---

interface NewsItem {
    title: string;
    date: string;
}

import { useLayoutStore } from "@/stores/layout-store";

interface DashboardCardProps {
    title: string;
    description: string;
    icon: any;
    href: string;
    actionLabel: string;
    news: NewsItem[];
    variants: any;
    status?: any;
    disabled?: boolean;
    isShadowMode?: boolean;
    onClick?: () => void;
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
    disabled = false,
    isShadowMode = false,
    onClick
}: DashboardCardProps) {
    const isVisuallyLocked = disabled || isShadowMode || status === 'maintenance' || status === 'founders' || status === 'coming_soon' || status === 'hidden';

    // Badge based on status
    const renderBadge = () => {
        if (status === 'maintenance') {
            return (
                <Badge variant="secondary" className="bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20">
                    <Wrench className="h-3 w-3 mr-1" />
                    Mantenimiento
                </Badge>
            );
        }
        if (status === 'coming_soon') {
            return (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Próximamente
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

    const content = (
        <motion.div variants={variants} className="h-full">
            <Card variant="inset" className={cn(
                "h-full transition-colors duration-300 relative group flex flex-col",
                !isVisuallyLocked && "hover:bg-black/25 cursor-pointer",
                isVisuallyLocked && "opacity-60 grayscale-[30%] cursor-not-allowed"
            )}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                    <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        isVisuallyLocked ? "bg-muted" : "bg-primary/10"
                    )}>
                        <Icon className={cn(
                            "h-6 w-6",
                            isVisuallyLocked ? "text-muted-foreground" : "text-primary"
                        )} />
                    </div>
                    {renderBadge()}
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-2 flex-1 flex flex-col">
                    <div>
                        <CardTitle className="text-xl mb-1">{title}</CardTitle>
                        <CardDescription className="text-base line-clamp-1">
                            {description}
                        </CardDescription>
                    </div>

                    {/* News Section inside card */}
                    {news && news.length > 0 && (
                        <div className="mt-auto border-t border-border/10 pt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Novedades</p>
                            {news.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground/80 truncate max-w-[70%]">{item.title}</span>
                                    <span className="text-xs text-muted-foreground">{item.date}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isVisuallyLocked && (
                        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 pt-2">
                            {actionLabel}
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    const handleWrapperClick = (e?: React.MouseEvent) => {
        if (isShadowMode) {
            toast.success("Modo Shadow (Admin)", { description: `Navegando a sección restringida: ${title}` });
        }
        if (onClick) onClick();
    };

    if (disabled) {
        return content;
    }

    return (
        <Link href={href as any} onClick={handleWrapperClick}>
            {content}
        </Link>
    );
}
