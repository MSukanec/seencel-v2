"use client";

import * as React from "react";
import { SiteLog, SiteLogType } from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Star, FileText, Play, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EntityContextMenu, type EntityParameter } from "@/components/shared/entity-context-menu";
// Lightbox (YARL) — unified viewer
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download_Plugin from "yet-another-react-lightbox/plugins/download";
import Video from "yet-another-react-lightbox/plugins/video";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// Chips for inline editing
import { SeverityChip } from "@/components/shared/chips/chips/severity-chip";
import { WeatherChip } from "@/components/shared/chips/chips/weather-chip";
import { VisibilityChip } from "@/components/shared/chips/chips/visibility-chip";
import { SelectChip } from "@/components/shared/chips/chips/select-chip";
import { ProjectChip } from "@/components/shared/chips/chips/project-chip";

// ─── Types ───────────────────────────────────────────────

interface SitelogFeedProps {
    logs: SiteLog[];
    onEdit?: (log: SiteLog) => void;
    onDelete?: (log: SiteLog) => void;
    onToggleFavorite?: (log: SiteLog) => Promise<void>;
    showProjectName?: boolean;
    /** Context menu parameters (same as DataTable) */
    parameters?: EntityParameter<SiteLog>[];
    /** Inline update callback */
    onUpdateField?: (row: SiteLog, field: string, value: string | boolean | null) => Promise<void> | void;
    /** Available log types */
    logTypes?: SiteLogType[];
    /** Available projects for inline project chip */
    projectOptions?: { value: string; label: string; color?: string | null; imageUrl?: string | null; status?: string | null }[];
}

// ─── Component ───────────────────────────────────────────

export function SitelogFeed({
    logs,
    onEdit,
    onDelete,
    onToggleFavorite,
    showProjectName,
    parameters,
    onUpdateField,
    logTypes = [],
    projectOptions = [],
}: SitelogFeedProps) {
    const [lightboxIndex, setLightboxIndex] = React.useState(-1);
    const [currentMediaItems, setCurrentMediaItems] = React.useState<any[]>([]);

    const openLightbox = (items: any[], index: number) => {
        // Convert MediaItem-like objects to YARL slides
        const slides = items.map((item: any) => {
            const isImage = item.type?.startsWith('image');
            const isVideo = item.type?.startsWith('video');
            if (isVideo) {
                return {
                    type: 'video' as const,
                    sources: [{ src: item.url, type: item.type || 'video/mp4' }],
                    title: item.name || undefined,
                    download: { url: item.url, filename: item.name || 'video' },
                };
            }
            return {
                type: 'image' as const,
                src: item.url,
                alt: item.name || 'Imagen',
                title: item.name || undefined,
                download: { url: item.url, filename: item.name || 'imagen' },
            };
        });
        setCurrentMediaItems(slides);
        setLightboxIndex(index);
    };

    if (!logs || logs.length === 0) {
        return null;
    }

    // Group logs by date
    const groupedLogs = logs.reduce((acc, log) => {
        const dateKey = log.log_date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(log);
        return acc;
    }, {} as Record<string, SiteLog[]>);

    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <>
            <Card variant="inset">
                <div className="w-full pb-12">
                    {sortedDates.map((date) => (
                        <div key={date} className="relative grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            {/* Timeline/Date Column (1/4) - Left */}
                            <div className="relative md:col-span-1 hidden md:block">
                                <div className="sticky top-24 flex flex-col items-end text-right pr-4">
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

                                        {/* Wrap with EntityContextMenu */}
                                        <EntityContextMenu
                                            data={log}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            parameters={parameters}
                                        >
                                            <div>
                                                <LogCard
                                                    log={log}
                                                    onMediaClick={openLightbox}
                                                    onToggleFavorite={onToggleFavorite}
                                                    showProjectName={showProjectName}
                                                    onUpdateField={onUpdateField}
                                                    logTypes={logTypes}
                                                    projectOptions={projectOptions}
                                                />
                                            </div>
                                        </EntityContextMenu>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                index={lightboxIndex}
                slides={currentMediaItems}
                plugins={[Zoom, Fullscreen, Counter, Download_Plugin, Video, Thumbnails]}
                carousel={{ finite: false }}
                zoom={{ maxZoomPixelRatio: 5, scrollToZoom: true }}
                thumbnails={{ position: "bottom", width: 80, height: 60 }}
            />
        </>
    );
}

// ─── LogCard ─────────────────────────────────────────────

function LogCard({
    log,
    onMediaClick,
    onToggleFavorite,
    showProjectName,
    onUpdateField,
    logTypes,
    projectOptions,
}: {
    log: SiteLog;
    onMediaClick: (items: any[], index: number) => void;
    onToggleFavorite?: (log: SiteLog) => Promise<void>;
    showProjectName?: boolean;
    onUpdateField?: (row: SiteLog, field: string, value: string | boolean | null) => Promise<void> | void;
    logTypes?: SiteLogType[];
    projectOptions?: { value: string; label: string; color?: string | null; imageUrl?: string | null; status?: string | null }[];
}) {
    const authorName = log.author?.user?.full_name || log.author?.user?.email || "Desconocido";
    const authorAvatar = log.author?.user?.avatar_url;
    const typeName = log.entry_type?.name;
    const projectName = (log as any).project?.name;

    const typeOptions = React.useMemo(() =>
        (logTypes || []).map(t => ({ value: t.id, label: t.name })),
        [logTypes]
    );

    return (
        <div className="relative group pl-0">
            <Card variant="island" className="overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    {/* Author */}
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

                    {/* Chips row — inline editable */}
                    <div className="flex gap-1.5 items-center flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {/* Favorite star (non-chip, just visual) */}
                        {log.is_favorite && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500/10" title="Favorito">
                                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            </div>
                        )}

                        {/* Project Chip — FIRST (only in org-wide mode) */}
                        {showProjectName && onUpdateField && projectOptions && projectOptions.length > 0 ? (
                            <ProjectChip
                                value={log.project_id || ""}
                                projects={(projectOptions || []).map(p => ({
                                    id: p.value,
                                    name: p.label,
                                    color: p.color || null,
                                    image_url: p.imageUrl || null,
                                    status: p.status || undefined,
                                }))}
                                onChange={async (newProjectId) => {
                                    await onUpdateField(log, "project_id", newProjectId || null);
                                }}
                            />
                        ) : showProjectName && projectName ? (
                            <ProjectChip
                                value={log.project_id || ""}
                                projects={[{
                                    id: log.project_id,
                                    name: projectName,
                                    color: (log as any).project?.color || null,
                                    image_url: (log as any).project?.image_url || null,
                                }]}
                                onChange={() => {}}
                                readOnly
                            />
                        ) : null}

                        {/* Visibility Chip */}
                        {onUpdateField ? (
                            <VisibilityChip
                                value={!!log.is_public}
                                onChange={async (newIsPublic) => {
                                    await onUpdateField(log, "is_public", newIsPublic);
                                }}
                            />
                        ) : (
                            <VisibilityChip
                                value={!!log.is_public}
                                onChange={() => {}}
                                readOnly
                            />
                        )}

                        {/* Weather Chip */}
                        {onUpdateField ? (
                            <WeatherChip
                                value={log.weather && log.weather !== "none" ? log.weather : ""}
                                onChange={async (newValue) => {
                                    await onUpdateField(log, "weather", newValue || null);
                                }}
                            />
                        ) : (
                            <WeatherChip
                                value={log.weather && log.weather !== "none" ? log.weather : ""}
                                onChange={() => {}}
                                readOnly
                            />
                        )}

                        {/* Severity Chip */}
                        {onUpdateField ? (
                            <SeverityChip
                                value={log.severity || "none"}
                                onChange={async (newValue) => {
                                    await onUpdateField(log, "severity", newValue === "none" ? null : newValue);
                                }}
                            />
                        ) : (
                            <SeverityChip
                                value={log.severity || "none"}
                                onChange={() => {}}
                                readOnly
                            />
                        )}

                        {/* Type Chip */}
                        {onUpdateField && typeOptions.length > 0 ? (
                            <SelectChip
                                value={log.entry_type_id || ""}
                                options={typeOptions}
                                onChange={async (newValue) => {
                                    await onUpdateField(log, "entry_type_id", newValue);
                                }}
                                emptyLabel="Tipo"
                                searchPlaceholder="Buscar tipo..."
                                emptySearchText="No hay tipos"
                            />
                        ) : typeName ? (
                            <SelectChip
                                value={log.entry_type_id || ""}
                                options={typeOptions}
                                onChange={() => {}}
                                readOnly
                            />
                        ) : null}
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                    {/* Main Text */}
                    {log.comments && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                            <p className="whitespace-pre-wrap">{log.comments}</p>
                        </div>
                    )}

                    {/* Media Grid — always 1 row max (5 slots) */}
                    {log.media && log.media.length > 0 && (() => {
                        const mediaItems = log.media || [];
                        const hasOverflow = mediaItems.length > 5;
                        const visibleCount = hasOverflow ? 4 : mediaItems.length;
                        const remaining = mediaItems.length - visibleCount;

                        return (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {mediaItems.slice(0, visibleCount).map((file, idx) => {
                                    const isImage = file.type === 'image' || file.type.startsWith('image/');
                                    const isVideo = file.type === 'video' || file.type.startsWith('video/');

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

                                {/* Remaining Count — 5th slot when overflow */}
                                {hasOverflow && (
                                    <div
                                        className="aspect-square relative rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-pointer flex items-center justify-center hover:bg-muted/80 transition-colors"
                                        onClick={() => onMediaClick(mediaItems, visibleCount)}
                                    >
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            +{remaining}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* AI Summary Highlight */}
                    {log.ai_summary && (
                        <div className="p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-sm">
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

// ─── Helpers ─────────────────────────────────────────────

function getSeverityColor(severity: string | null) {
    switch (severity) {
        case 'high': return 'bg-destructive';
        case 'critical': return 'bg-destructive';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-primary';
        default: return 'bg-primary';
    }
}
