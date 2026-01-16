"use client";

import { SiteLog } from "@/types/sitelog";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, CloudSun, MapPin, Quote, CloudRain, Sun, Cloud, AlertTriangle, CloudFog, FileText, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface SitelogFeedProps {
    logs: SiteLog[];
}

import * as React from "react";
// ... imports
import { MediaLightbox, MediaItem } from "@/components/shared/media-lightbox";

// ... SitelogFeed component start

export function SitelogFeed({ logs }: SitelogFeedProps) {
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
        // ... empty state logic
        return (
            <div className="h-[60vh]">
                <EmptyState
                    title="Bitácora vacía"
                    description="Aún no hay registros en la bitácora de este proyecto. Comienza creando el primero."
                    icon={Quote}
                    variant="dashed"
                />
            </div>
        );
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
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                {sortedDates.map((date) => (
                    <div key={date} className="relative">
                        {/* Date Header Sticky */}
                        <div className="sticky top-0 z-10 flex items-center justify-center mb-8 pointer-events-none">
                            <div className="bg-background/80 backdrop-blur-md border border-border shadow-sm px-4 py-1.5 rounded-full flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium capitalize text-foreground">
                                    {format(new Date(date), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            </div>
                        </div>

                        {/* Timeline Spine */}
                        <div className="absolute left-8 top-12 bottom-0 w-px bg-border/50 hidden md:block" />

                        <div className="space-y-6">
                            {groupedLogs[date].map((log) => (
                                <LogCard
                                    key={log.id}
                                    log={log}
                                    onMediaClick={openLightbox}
                                />
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

function LogCard({ log, onMediaClick }: { log: SiteLog, onMediaClick: (items: any[], index: number) => void }) {
    // ... LogCard render logic

    const authorName = log.author?.user?.full_name || log.author?.user?.email || "Desconocido";
    const authorAvatar = log.author?.user?.avatar_url;
    const typeName = log.entry_type?.name;

    return (
        <div className="relative pl-0 md:pl-20 group">
            {/* Timeline Node */}
            <div className={`absolute left-8 top-6 -translate-x-1/2 hidden md:flex h-3 w-3 rounded-full border-2 border-background z-10 group-hover:scale-125 transition-transform ${getSeverityColor(log.severity)}`} />

            <Card className="overflow-hidden border-border/60 hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
                {/* Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start justify-between bg-muted/20 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
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

                    <div className="flex gap-2">
                        {/* Weather Badge */}
                        {log.weather && log.weather !== 'none' && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 border border-border px-2.5 py-1 rounded-full">
                                {getWeatherIcon(log.weather)}
                                <span className="capitalize">{translateWeather(log.weather)}</span>
                            </div>
                        )}

                        {typeName && (
                            <Badge variant="outline" className="w-fit bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                                {typeName}
                            </Badge>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                            {log.media.map((file, idx) => {
                                const isImage = file.type === 'image' || file.type.startsWith('image/');
                                const isVideo = file.type === 'video' || file.type.startsWith('video/');

                                if (isImage) {
                                    return (
                                        <div
                                            key={file.id || idx}
                                            className="group/img aspect-square relative rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-zoom-in"
                                            onClick={() => onMediaClick(log.media!, idx)}
                                        >
                                            <img
                                                src={file.url}
                                                alt={file.name || `Adjunto ${idx + 1}`}
                                                className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            {/* Hover Overlay Icon */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-black/40 p-2 rounded-full text-white backdrop-blur-sm">
                                                    <Eye className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isVideo) {
                                    return (
                                        <div
                                            key={file.id || idx}
                                            className="group/vid aspect-square relative rounded-xl overflow-hidden bg-black border border-border/50 shadow-sm cursor-pointer"
                                            onClick={() => onMediaClick(log.media!, idx)}
                                        >
                                            <video
                                                src={file.url}
                                                className="object-cover w-full h-full opacity-80 group-hover/vid:scale-105 transition-transform duration-500"
                                                muted
                                                preload="metadata"
                                                playsInline
                                            />
                                            {/* Play Icon Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-black/40 p-3 rounded-full text-white backdrop-blur-sm group-hover/vid:bg-primary group-hover/vid:text-primary-foreground transition-colors">
                                                    <Play className="h-5 w-5 fill-current" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                                                VIDEO
                                            </div>
                                        </div>
                                    );
                                }

                                // Fallback for files
                                return (
                                    <div
                                        key={file.id || idx}
                                        className="aspect-square relative rounded-xl overflow-hidden bg-background border border-border p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors group/file cursor-pointer"
                                        onClick={() => onMediaClick(log.media!, idx)}
                                    >
                                        <div className="p-3 rounded-full bg-primary/5 text-primary mb-2 group-hover/file:scale-110 transition-transform">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate w-full px-2 font-medium">
                                            {file.name || "Archivo adjunto"}
                                        </span>
                                        <span className="text-[10px] uppercase text-muted-foreground/60 mt-1">
                                            {file.type}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* AI Summary Highlight */}
                    {log.ai_summary && (
                        <div className="mt-4 p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-sm">
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
    )
}

// Helpers
function getSeverityColor(severity: string | null) {
    switch (severity) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-primary';
    }
}

function getWeatherIcon(weather: string) {
    const w = weather.toLowerCase();
    if (w.includes('sun') || w.includes('sunny') || w.includes('clear')) return <Sun className="h-3.5 w-3.5 text-orange-500" />;
    if (w.includes('cloud')) return <Cloud className="h-3.5 w-3.5 text-blue-400" />;
    if (w.includes('rain')) return <CloudRain className="h-3.5 w-3.5 text-blue-600" />;
    if (w.includes('fog') || w.includes('mist')) return <CloudFog className="h-3.5 w-3.5 text-gray-400" />;
    return <CloudSun className="h-3.5 w-3.5 text-yellow-500" />;
}

function translateWeather(weather: string) {
    const map: Record<string, string> = {
        'sunny': 'Soleado',
        'cloudy': 'Nublado',
        'rainy': 'Lluvioso',
        'stormy': 'Tormenta',
        'windy': 'Ventoso',
        'snowy': 'Nieve',
        'foggy': 'Niebla',
        'clear': 'Despejado',
        'none': ''
    };
    return map[weather.toLowerCase()] || weather;
}
