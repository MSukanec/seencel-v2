"use client";

/**
 * Organization Dashboard View — Static Cards Pattern
 * 
 * Row 1: Hero card (org identity — logo, name, plan, members)
 * Row 2: 4 Content Cards (projects, events, gallery, activity)
 * 
 * Replaces the old DashboardWidgetGrid + WIDGET_REGISTRY approach.
 * Each card auto-fetches its own data with optional server-prefetched initialData.
 */

import { useState, useEffect, useMemo, useRef, useCallback, useTransition } from "react";
import { ContentCard } from "@/components/cards";
import { cn } from "@/lib/utils";
import {
    FolderKanban, Calendar, CalendarDays, CheckSquare, FolderOpen,
    Activity, MapPin, ImageOff, Play, Image as ImageIcon, Video, FileText, File,
    ArrowRight,
} from "lucide-react";
import {
    getOverviewHeroData,
    getRecentProjects,
    getUpcomingEvents,
    getRecentFiles,
    getActivityFeedItems,
    type RecentProject,
    type UpcomingEventItem,
    type RecentFileItem,
    type ActivityFeedItem,
} from "@/actions/widget-actions";
import { moduleConfigs, actionConfigs, getActionVerb, moduleRoutes } from "@/config/audit-logs";
import { PlanBadge } from "@/components/shared/plan-badge";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { format, isToday, isTomorrow, isThisWeek, addWeeks, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/toolbar";

// ============================================================================
// TYPES
// ============================================================================

interface HeroData {
    name: string;
    avatarUrl: string | null;
    planName: string | null;
    planSlug: string | null;
    isFounder: boolean;
    memberCount: number;
    projectCount: number;
    members: { name: string; image: string | null; email?: string }[];
}

interface OrganizationDashboardViewProps {
    prefetchedData?: Record<string, any>;
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export function OrganizationDashboardView({ prefetchedData }: OrganizationDashboardViewProps) {
    return (
        <ContentLayout variant="wide">
            <Toolbar portalToHeader />
            <div className="space-y-4">
                {/* Row 1: Hero */}
                <HeroCard initialData={prefetchedData?.org_pulse} />

                {/* Row 2: 4 Content Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <RecentProjectsCard initialData={prefetchedData?.org_recent_projects} />
                    <UpcomingEventsCard initialData={prefetchedData?.upcoming_events} />
                    <GalleryCard initialData={prefetchedData?.recent_files_gallery} />
                    <ActivityCard initialData={prefetchedData?.activity_kpi} />
                </div>
            </div>
        </ContentLayout>
    );
}

// ============================================================================
// HERO CARD — Org Identity (Clean, no map)
// ============================================================================

function HeroCard({ initialData }: { initialData?: HeroData }) {
    const [data, setData] = useState<HeroData | null>(initialData ?? null);

    useEffect(() => {
        if (data) return;
        getOverviewHeroData(null)
            .then((result) => { if (result) setData(result); })
            .catch(() => {});
    }, [data]);

    if (!data) {
        return (
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>
        );
    }

    const initials = data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="relative rounded-xl border bg-card overflow-hidden">
            {/* Subtle SVG grid background */}
            <div className="absolute inset-0 overflow-hidden">
                <svg
                    className="absolute inset-0 w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ opacity: 0.03 }}
                >
                    <defs>
                        <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/3" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 flex items-center gap-5">
                {/* Avatar */}
                <div className="h-16 w-16 rounded-full border-2 border-border/50 shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-muted">
                    {data.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={data.avatarUrl}
                            alt={data.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-bold text-muted-foreground">{initials}</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1.5 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate leading-tight">
                        {data.name}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <PlanBadge planSlug={data.planSlug || data.planName} compact />
                        <span className="text-xs text-muted-foreground">
                            {data.projectCount} {data.projectCount === 1 ? "proyecto" : "proyectos"}
                        </span>
                    </div>
                    {data.members && data.members.length > 0 && (
                        <div className="mt-0.5">
                            <AvatarStack members={data.members} max={6} size={7} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// RECENT PROJECTS CARD
// ============================================================================

function RecentProjectsCard({ initialData }: { initialData?: RecentProject[] }) {
    const [projects, setProjects] = useState<RecentProject[] | null>(initialData ?? null);

    useEffect(() => {
        if (initialData) return;
        getRecentProjects(6).then(setProjects);
    }, [initialData]);

    return (
        <ContentCard
            title="Proyectos Recientes"
            description="Tus proyectos activos"
            icon={<FolderKanban className="w-4 h-4" />}
            headerAction={
                <Link href="/organization/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
            }
        >
            {projects === null ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Sin proyectos activos
                </div>
            ) : (
                <div className="space-y-2">
                    {projects.slice(0, 4).map((project) => (
                        <ProjectMiniCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </ContentCard>
    );
}

function ProjectMiniCard({ project }: { project: RecentProject }) {
    const imageUrl = project.image_bucket && project.image_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${project.image_bucket}/${project.image_path}`
        : project.image_url;

    const location = [project.city, project.country].filter(Boolean).join(", ");

    return (
        <div className="relative rounded-lg overflow-hidden h-[60px] group">
            {/* Background */}
            {imageUrl ? (
                <Image src={imageUrl} alt={project.name} fill unoptimized className="object-cover" />
            ) : (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                    <ImageOff className="h-5 w-5 text-muted-foreground/30" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center p-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate drop-shadow-md">{project.name}</p>
                    {location && (
                        <p className="text-[11px] text-white/70 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            {location}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// UPCOMING EVENTS CARD
// ============================================================================

const PRIORITY_COLORS: Record<string, string> = {
    urgent: "border-red-500",
    high: "border-orange-500",
    medium: "border-yellow-500",
    low: "border-green-500",
    none: "border-muted-foreground/30",
};

function groupByDate(items: UpcomingEventItem[]): { label: string; items: UpcomingEventItem[] }[] {
    const groups: Map<string, UpcomingEventItem[]> = new Map();
    for (const item of items) {
        const date = parseISO(item.date);
        let label: string;
        if (isToday(date)) {
            label = "Hoy";
        } else if (isTomorrow(date)) {
            label = "Mañana";
        } else if (isThisWeek(date, { weekStartsOn: 1 })) {
            label = format(date, "EEEE", { locale: es });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        } else {
            const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
            const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
            if (date >= nextWeekStart && date <= nextWeekEnd) {
                label = "Próxima semana";
            } else {
                label = format(date, "d 'de' MMMM", { locale: es });
            }
        }
        const group = groups.get(label) || [];
        group.push(item);
        groups.set(label, group);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function UpcomingEventsCard({ initialData }: { initialData?: UpcomingEventItem[] }) {
    const [items, setItems] = useState<UpcomingEventItem[] | null>(initialData ?? null);

    useEffect(() => {
        if (initialData) return;
        getUpcomingEvents("all", 8).then(setItems);
    }, [initialData]);

    const groups = useMemo(() => {
        if (!items) return [];
        return groupByDate(items);
    }, [items]);

    return (
        <ContentCard
            title="Próximos Eventos"
            description="Fechas y vencimientos"
            icon={<Calendar className="w-4 h-4" />}
            headerAction={
                <Link href="/organization/planner" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Planificador <ArrowRight className="w-3 h-3" />
                </Link>
            }
        >
            {items === null ? (
                <div className="space-y-3 py-2">
                    <Skeleton className="h-3 w-12" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Calendar className="h-8 w-8 text-muted-foreground/30" />
                    <p>Sin eventos próximos</p>
                    <p className="text-xs">Los eventos de calendario y tareas con fecha aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const date = parseISO(item.date);
                                    const dayNum = format(date, "dd");
                                    const dayAbbr = format(date, "EEE", { locale: es }).toUpperCase();
                                    const timeStr = item.isAllDay ? null : format(date, "HH:mm", { locale: es });

                                    return (
                                        <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-1.5">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 bg-muted/50",
                                                    item.type === "kanban" && "border-l-2",
                                                    item.type === "kanban" && (PRIORITY_COLORS[item.priority || "none"] || "border-muted-foreground/30"),
                                                )}
                                                style={item.type === "calendar" ? { borderLeft: `2px solid ${item.color || "#3b82f6"}` } : undefined}
                                            >
                                                <span className="text-xs font-bold leading-none text-foreground">{dayNum}</span>
                                                <span className="text-[9px] font-medium leading-none text-muted-foreground mt-0.5">{dayAbbr}</span>
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                <p className="text-sm font-medium truncate text-foreground">{item.title}</p>
                                                {item.type === "kanban" ? (
                                                    <CheckSquare className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                                ) : (
                                                    <CalendarDays className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                                )}
                                            </div>
                                            {timeStr && (
                                                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{timeStr}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ContentCard>
    );
}

// ============================================================================
// GALLERY CARD
// ============================================================================

function getFileCategory(fileType: string): string {
    if (fileType === "image" || fileType.startsWith("image/")) return "image";
    if (fileType === "video" || fileType.startsWith("video/")) return "video";
    if (fileType === "pdf" || fileType === "application/pdf") return "pdf";
    return "document";
}

function getFileIconConfig(fileType: string) {
    const cat = getFileCategory(fileType);
    switch (cat) {
        case "image": return { icon: ImageIcon, color: "text-blue-400" };
        case "video": return { icon: Video, color: "text-purple-400" };
        case "pdf": return { icon: FileText, color: "text-red-400" };
        default: return { icon: File, color: "text-muted-foreground" };
    }
}

function GalleryCard({ initialData }: { initialData?: RecentFileItem[] }) {
    const [files, setFiles] = useState<RecentFileItem[] | null>(initialData ?? null);

    useEffect(() => {
        if (initialData) return;
        getRecentFiles("media", "organization", 12).then(setFiles);
    }, [initialData]);

    return (
        <ContentCard
            title="Galería"
            description="Fotos y videos recientes"
            icon={<FolderOpen className="w-4 h-4" />}
            headerAction={
                <Link href="/organization/files" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
            }
        >
            {files === null ? (
                <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-md" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
                    <p>Sin archivos recientes</p>
                    <p className="text-xs">Subí archivos para verlos aquí</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1">
                    {files.slice(0, 9).map((file) => {
                        const category = getFileCategory(file.file_type);
                        const isImage = category === "image";
                        const isVideo = category === "video";
                        const iconConfig = getFileIconConfig(file.file_type);
                        const IconComponent = iconConfig.icon;

                        return (
                            <div
                                key={file.id}
                                className="relative aspect-square rounded-md overflow-hidden group cursor-pointer bg-muted/30"
                                onClick={() => {
                                    const url = file.signed_url || file.url;
                                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                                }}
                            >
                                {isImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={file.thumbnail_url || file.signed_url || file.url}
                                        alt={file.file_name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : isVideo ? (
                                    <>
                                        <video
                                            src={file.signed_url || file.url}
                                            muted
                                            preload="metadata"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                                <Play className="h-3.5 w-3.5 text-white ml-0.5" fill="white" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted/50 group-hover:bg-muted/70 transition-colors">
                                        <IconComponent className={cn("h-7 w-7", iconConfig.color)} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </ContentCard>
    );
}

// ============================================================================
// ACTIVITY CARD
// ============================================================================

function getDetailText(item: ActivityFeedItem): string {
    const metadata = item.metadata || {};
    return metadata.name || metadata.title || metadata.description || "";
}

function ActivityCard({ initialData }: { initialData?: ActivityFeedItem[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [navigatingId, setNavigatingId] = useState<string | null>(null);
    const [items, setItems] = useState<ActivityFeedItem[] | null>(initialData ?? null);

    useEffect(() => {
        if (initialData) return;
        getActivityFeedItems("organization", 5).then(setItems);
    }, [initialData]);

    useEffect(() => {
        if (!isPending) setNavigatingId(null);
    }, [isPending]);

    const handleNavigate = (item: ActivityFeedItem) => {
        const route = moduleRoutes[item.target_table];
        if (!route) return;
        setNavigatingId(item.id);
        startTransition(() => {
            router.push(route as any);
        });
    };

    return (
        <ContentCard
            title="Actividad General"
            description="Actividad reciente"
            icon={<Activity className="w-4 h-4" />}
            headerAction={
                <Link href="/organization/settings/activity" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Ver todo <ArrowRight className="w-3 h-3" />
                </Link>
            }
        >
            {items === null ? (
                <div className="space-y-4 py-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3.5 w-3/4" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Activity className="h-8 w-8 text-muted-foreground/30" />
                    <p>Sin actividad</p>
                    <p className="text-xs">Las acciones de tu equipo aparecerán aquí</p>
                </div>
            ) : (
                <div className="flex flex-col divide-y divide-border/30">
                    {items.map((item) => {
                        const verb = getActionVerb(item.action);
                        const actionCfg = actionConfigs[verb];
                        const moduleCfg = moduleConfigs[item.target_table];
                        const actionLabel = actionCfg?.label || verb;
                        const moduleLabel = moduleCfg?.displayLabel || item.target_table;
                        const detail = getDetailText(item);
                        const description = detail
                            ? `${actionLabel} ${moduleLabel} › ${detail}`
                            : `${actionLabel} ${moduleLabel}`;
                        const initials = (item.full_name || "?")
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();
                        const hasRoute = !!moduleRoutes[item.target_table];
                        const isNav = navigatingId === item.id;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center gap-3 py-2",
                                    hasRoute && "cursor-pointer hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors",
                                    isNav && "opacity-60",
                                )}
                                onClick={() => hasRoute && !isNav && handleNavigate(item)}
                            >
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarImage src={item.avatar_url || undefined} />
                                                <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="text-xs">
                                            {item.full_name || "Sistema"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(item.created_at), {
                                            addSuffix: true,
                                            locale: es,
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ContentCard>
    );
}
