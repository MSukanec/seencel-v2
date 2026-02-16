"use client";

import { SiteLog } from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, CloudSun, MapPin, Quote, CloudRain, Sun, Cloud, AlertTriangle, CloudFog, FileText, Eye, EyeOff, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Star, Trash } from "lucide-react";

interface SitelogFeedProps {
    logs: SiteLog[];
    onEdit?: (log: SiteLog) => void;
    onDelete?: (log: SiteLog) => void;
    onToggleFavorite?: (log: SiteLog) => Promise<void>;
    showProjectName?: boolean;
}

import * as React from "react";
// ... imports
import { MediaLightbox, MediaItem } from "@/components/shared/media-lightbox";
import { WEATHER_CONFIG } from "../constants";

// ... SitelogFeed component start

export function SitelogFeed({ logs, onEdit, onDelete, onToggleFavorite, showProjectName }: SitelogFeedProps) {
    const [lightboxOpen, setLightboxOpen] = React.useState(false);
    const [currentMediaItems, setCurrentMediaItems] = React.useState<MediaItem[]>([]);
    const [initialMediaIndex, setInitialMediaIndex] = React.useState(0);

    const openLightbox = (items: any[], index: number) => {
        // Map to match MediaItem interface roughly (assuming SiteLog['media'] matches mostly)
        setCurrentMediaItems(items);
        setInitialMediaIndex(index);
        setLightboxOpen(true);
    };

    if (!logs || logs.length === 0) {
        return null;
    }

    // Group logs logic ... (same)
    const groupedLogs = logs.reduce((acc, log) => {
        const dateKey = log.log_date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(log);
        return acc;
    }, {} as Record<string, SiteLog[]>);

    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <>
            <div className="w-full pb-20">
                {sortedDates.map((date) => (
                    <div key={date} className="relative grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        {/* Timeline/Date Column (1/4) - Left */}
                        <div className="relative md:col-span-1 hidden md:block">
                            <div className="sticky top-24 flex flex-col items-end text-right pr-4">
                                {/* Date Badge */}
                                <div className="border border-border/60 rounded-md px-3 py-1.5 inline-block bg-background/50 backdrop-blur-sm shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                    <span className={cn(
                                        "block text-sm font-semibold capitalize text-foreground",
                                        "font-heading"
                                    )}>
                                        {format(new Date(date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content Column (3/4) - Right */}
                        <div className="md:col-span-3 space-y-8 md:pl-16 border-l-0 md:border-l-2 border-dashed border-border/60 relative">
                            {groupedLogs[date].map((log) => (
                                <div key={log.id} className="relative group/timeline">
                                    {/* Timeline Node - Desktop Only */}
                                    <div className={cn(
                                        "hidden md:block absolute top-8 -left-[70px] h-3 w-3 rounded-full ring-4 ring-background z-10 transition-transform group-hover/timeline:scale-125",
                                        getSeverityColor(log.severity)
                                    )} />

                                    <LogCard
                                        log={log}
                                        onMediaClick={openLightbox}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleFavorite={onToggleFavorite}
                                        showProjectName={showProjectName}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <MediaLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                items={currentMediaItems}
                initialIndex={initialMediaIndex}
            />
        </>
    );
}

function LogCard({
    log,
    onMediaClick,
    onEdit,
    onDelete,
    onToggleFavorite,
    showProjectName
}: {
    log: SiteLog,
    onMediaClick: (items: any[], index: number) => void,
    onEdit?: (log: SiteLog) => void;
    onDelete?: (log: SiteLog) => void;
    onToggleFavorite?: (log: SiteLog) => Promise<void>;
    showProjectName?: boolean;
}) {
    // ... LogCard render logic

    const authorName = log.author?.user?.full_name || log.author?.user?.email || "Desconocido";
    const authorAvatar = log.author?.user?.avatar_url;
    const typeName = log.entry_type?.name;
    const projectName = (log as any).project?.name;

    return (
        <div className="relative group pl-0">
            <Card className="overflow-hidden border-border/60 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                {/* Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarImage src={authorAvatar || undefined} />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{authorName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {format(new Date(log.created_at), "HH:mm a")}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">

                        {/* Status Indicators */}
                        {log.is_favorite && (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500/10" title="Marcado como favorito">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            </div>
                        )}

                        {/* Visibility Badge */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 border border-border px-2.5 py-1 rounded-full">
                            {log.is_public ? (
                                <>
                                    <Eye className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="hidden sm:inline">Visible cliente</span>
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-3.5 w-3.5 text-red-500" />
                                    <span className="hidden sm:inline">Interno</span>
                                </>
                            )}
                        </div>

                        {/* Weather Badge */}
                        {log.weather && log.weather !== 'none' && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 border border-border px-2.5 py-1 rounded-full">
                                {getWeatherIcon(log.weather)}
                                <span className="capitalize">{translateWeather(log.weather)}</span>
                            </div>
                        )}

                        {showProjectName && projectName && (
                            <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                {projectName}
                            </Badge>
                        )}

                        {typeName && (
                            <Badge variant="outline" className="w-fit bg-primary/5 text-primary border-primary/20">
                                {typeName}
                            </Badge>
                        )}

                        {/* Actions Menu — Always visible, at the END */}
                        {(onEdit || onDelete || onToggleFavorite) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Acciones</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(log)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                    )}
                                    {onToggleFavorite && (
                                        <DropdownMenuItem onClick={() => onToggleFavorite(log)}>
                                            <Star className={cn("mr-2 h-4 w-4", log.is_favorite ? "fill-yellow-400 text-yellow-400" : "")} />
                                            {log.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
                                        </DropdownMenuItem>
                                    )}
                                    {(onEdit || onToggleFavorite) && onDelete && <DropdownMenuSeparator />}
                                    {onDelete && (
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(log)}>
                                            <Trash className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4">
                    {/* Main Text */}
                    {log.comments && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                            <p className="whitespace-pre-wrap">{log.comments}</p>
                        </div>
                    )}

                    {/* Media Grid */}
                    {log.media && log.media.length > 0 && (
                        <div className="p-4 border-t border-border/40 bg-muted/5">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {log.media.slice(0, 5).map((file, idx) => {
                                    const isImage = file.type === 'image' || file.type.startsWith('image/');
                                    const isVideo = file.type === 'video' || file.type.startsWith('video/');
                                    const mediaItems = log.media || [];

                                    return (
                                        <div
                                            key={file.id || idx}
                                            className="group/item aspect-square relative rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-zoom-in"
                                            onClick={() => onMediaClick(mediaItems, idx)}
                                        >
                                            {isImage && (
                                                <img
                                                    src={file.url}
                                                    alt={file.name || `Adjunto ${idx + 1}`}
                                                    className="object-cover w-full h-full group-hover/item:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            )}
                                            {isVideo && (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                    <div className="w-full h-full relative">
                                                        <video
                                                            src={file.url}
                                                            className="w-full h-full object-cover opacity-80"
                                                            muted
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                                                <Play className="h-5 w-5 text-white fill-current" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {!isImage && !isVideo && (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-background p-2 text-center group-hover/item:bg-muted transition-colors">
                                                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground w-full truncate px-1">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Remaining Count Indicator */}
                                {log.media.length > 5 && (
                                    <div
                                        className="aspect-square relative rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-pointer flex items-center justify-center hover:bg-muted/80 transition-colors"
                                        onClick={() => onMediaClick(log.media!, 5)}
                                    >
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            +{log.media.length - 5}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Summary Highlight */}
                    {log.ai_summary && (
                        <div className="mt-4 p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-sm mx-4 mb-4">
                            <div className="flex items-center gap-2 mb-2 text-violet-700 dark:text-violet-400 font-medium">
                                <Quote className="h-4 w-4" />
                                <span>Resumen IA</span>
                            </div>
                            <p className="text-muted-foreground italic">
                                "{log.ai_summary}"
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// Helpers
// Helpers
function getSeverityColor(severity: string | null) {
    switch (severity) {
        case 'high': return 'bg-destructive';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-primary'; // Use accent color
        default: return 'bg-primary';
    }
}

function getWeatherIcon(weather: string) {
    const w = weather.toLowerCase().trim();
    const config = WEATHER_CONFIG.find(c => c.value === w);

    if (config) {
        const Icon = config.icon;
        return <Icon className={cn("h-3.5 w-3.5", config.color)} />;
    }

    // Legacy fallback
    if (w.includes('sun') || w.includes('sunny') || w.includes('clear')) return <Sun className="h-3.5 w-3.5 text-yellow-500" />;
    return <CloudSun className="h-3.5 w-3.5 text-yellow-500" />;
}

function translateWeather(weather: string) {
    const w = weather.toLowerCase().trim();
    const config = WEATHER_CONFIG.find(c => c.value === w);
    return config ? config.label : weather;
}

