"use client";

import { ContentCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import {
    Play,
    FileText,
    MessageSquare,
    Bookmark,
    ArrowRight,
    Medal,
    Trophy,
    Stars,
    Rocket,
    Zap,
    TrendingUp,
    CalendarDays
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ContentLayout } from "@/components/layout/dashboard/shell";
import { ForumThread } from "@/actions/forum";

interface FoundersOverviewViewProps {
    latestThreads?: ForumThread[];
    memberSinceDate: string;
    contributionsCount: number;
}

// Helper to format relative date locally
function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
}

export function FoundersOverviewView({
    latestThreads = [],
    memberSinceDate,
    contributionsCount,
}: FoundersOverviewViewProps) {
    // Ideally we'd have translations for this specific page, but we'll use a mix of hardcoded and existing for now
    const tForum = useTranslations("Forum");

    // Mock data
    const mockUpdates = [
        { id: 1, title: "Nuevo módulo de Finanzas", date: "2026-03-20T10:00:00Z" },
        { id: 2, title: "Soporte Multidivisa activado", date: "2026-03-15T14:30:00Z" },
        { id: 3, title: "App Móvil en beta cerrada", date: "2026-03-10T09:15:00Z" },
    ];

    const mockRoadmap = [
        { id: 1, title: "Integración con bancos locales", status: "En progreso" },
        { id: 2, title: "Gestión avanzada de permisos", status: "Planificado" },
        { id: 3, title: "Asistente IA para presupuestos", status: "Planificado" },
    ];

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-zinc-900 border-border">
                    {/* Gradients to look premium */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-zinc-900 to-zinc-950" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                    {/* Content */}
                    <div className="relative p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Medal className="w-8 h-8 text-primary" />
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard de Fundador</h1>
                        </div>
                        <p className="text-white/70 max-w-xl mb-6">
                            Bienvenido al panel exclusivo para los pioneros de Seencel. Acá podés ver tus aportes, enterarte de las novedades y guiar el rumbo del producto.
                        </p>

                        <Link href={"/founders/forum" as any}>
                            <Button variant="default">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Ingresar al Foro
                            </Button>
                        </Link>

                        {/* KPI Row inside Hero */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5"><Trophy className="w-3 h-3 text-amber-500" /> Rango</p>
                                <p className="text-2xl md:text-3xl font-bold text-white">
                                    Fundador
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-blue-400" /> Miembro desde</p>
                                <p className="text-2xl md:text-3xl font-bold text-white uppercase text-lg md:text-xl mt-1">
                                    {new Date(memberSinceDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5"><Stars className="w-3 h-3 text-emerald-400" /> Aportes al foro</p>
                                <p className="text-2xl md:text-3xl font-bold text-white">
                                    {contributionsCount}
                                </p>
                                <p className="text-xs text-emerald-400 mt-1">
                                    {contributionsCount > 0 ? "Gracias por aportar" : "¡Animáte a participar!"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Forum Card - REAL DATA */}
                    <ContentCard
                        title="Últimos posts del foro"
                        icon={<MessageSquare className="w-4 h-4 text-primary" />}
                        headerAction={
                            <Link href={"/founders/forum" as any} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                                Ver todos <ArrowRight className="w-3 h-3" />
                            </Link>
                        }
                    >
                        {latestThreads.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center h-[200px] border border-dashed rounded-lg bg-muted/20">
                                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">Todavía no hay posts en el foro global.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {latestThreads.slice(0, 4).map((thread) => (
                                    <Link
                                        key={thread.id}
                                        href={{ pathname: '/founders/forum', query: { thread: thread.id } } as any}
                                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{thread.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Por {thread.author?.full_name || tForum("anonymous")}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-medium text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                                            {formatRelativeDate(thread.created_at)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </ContentCard>

                    {/* Changelog Card - MOCK DATA */}
                    <ContentCard
                        title="Novedades Recientes"
                        icon={<Zap className="w-4 h-4 text-amber-500" />}
                        headerAction={
                            <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-not-allowed opacity-50">
                                Ver todas <ArrowRight className="w-3 h-3" />
                            </span>
                        }
                    >
                        {mockUpdates.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center h-[200px]">
                                <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground mb-4">No hay novedades registradas.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {mockUpdates.map((update) => (
                                    <div
                                        key={update.id}
                                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="mt-0.5 bg-amber-500/10 p-1.5 rounded-md text-amber-500">
                                            <Zap className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium line-clamp-1">{update.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                Actualización de plataforma
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-medium text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                                            {formatRelativeDate(update.date)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ContentCard>

                    {/* Roadmap Card - MOCK DATA */}
                    <ContentCard
                        title="Próximos Lanzamientos"
                        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                        headerAction={
                            <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-not-allowed opacity-50">
                                Ver Roadmap <ArrowRight className="w-3 h-3" />
                            </span>
                        }
                    >
                        {mockRoadmap.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center h-[200px]">
                                <Bookmark className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">Nada planeado por ahora.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {mockRoadmap.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="mt-0.5 bg-emerald-500/10 p-1.5 rounded-md text-emerald-500">
                                            <Rocket className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium line-clamp-1">
                                                {item.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                    {item.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ContentCard>
                </div>
            </div>
        </ContentLayout>
    );
}
