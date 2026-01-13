"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Play, PlayCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export interface PlaylistVideo {
    id: string;
    title: string;
    url: string;
    duration?: string;
    thumbnail?: string;
    type?: "youtube" | "vimeo" | "custom";
}

interface VideoPlaylistPlayerProps {
    videos: PlaylistVideo[];
    title?: string;
    className?: string;
    autoPlay?: boolean;
}

export function VideoPlaylistPlayer({
    videos,
    title,
    className,
    autoPlay = false
}: VideoPlaylistPlayerProps) {
    const [currentVideo, setCurrentVideo] = useState<PlaylistVideo | null>(videos[0] || null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Reset if videos change
    useEffect(() => {
        if (videos.length > 0 && !videos.find(v => v.id === currentVideo?.id)) {
            setCurrentVideo(videos[0]);
        }
    }, [videos, currentVideo]);

    if (!videos || videos.length === 0) {
        return null;
    }

    const getEmbedUrl = (video: PlaylistVideo) => {
        if (!video.url) return "";

        // Simple helper to try and extract ID or use convert URL
        // Improve this logic based on real usage patterns
        let embedUrl = video.url;

        if (video.url.includes("youtube.com") || video.url.includes("youtu.be")) {
            const videoId = video.url.includes("v=")
                ? video.url.split("v=")[1].split("&")[0]
                : video.url.split("/").pop();
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0`;
        } else if (video.url.includes("vimeo.com")) {
            const videoId = video.url.split("/").pop();
            embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${isPlaying ? 1 : 0}`;
        }

        return embedUrl;
    };

    return (
        <Card className={cn(
            "overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl",
            className
        )}>
            <div className="grid lg:grid-cols-3 h-[600px] lg:h-[500px]">
                {/* Main Player Area */}
                <div className="lg:col-span-2 relative bg-black flex flex-col">
                    <div className="flex-1 relative">
                        {currentVideo ? (
                            <iframe
                                src={getEmbedUrl(currentVideo)}
                                title={currentVideo.title}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                                <PlayCircle className="h-16 w-16 opacity-20" />
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gradient-to-t from-zinc-900 to-transparent absolute bottom-0 left-0 right-0 pt-16 pointer-events-none">
                        <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-md line-clamp-2">
                            {currentVideo?.title}
                        </h3>
                        {currentVideo?.duration && (
                            <p className="text-sm text-zinc-300 mt-2 flex items-center gap-2 font-medium">
                                <PlayCircle className="h-4 w-4 text-primary" />
                                {currentVideo.duration}
                            </p>
                        )}
                    </div>
                </div>

                {/* Playlist Sidebar */}
                <div className="flex flex-col bg-zinc-900/50 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-white/5">
                    <div className="p-4 border-b border-white/5 bg-zinc-900/50">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                            {title || "Lista de Reproducción"}
                        </h4>
                    </div>
                    <ScrollArea className="flex-1 h-full">
                        <div className="p-3 space-y-2">
                            {videos.map((video, idx) => {
                                const isActive = currentVideo?.id === video.id;
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => {
                                            setCurrentVideo(video);
                                            setIsPlaying(true);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group",
                                            isActive
                                                ? "bg-primary/10 hover:bg-primary/20 ring-1 ring-primary/20"
                                                : "hover:bg-white/5 hover:ring-1 hover:ring-white/10"
                                        )}
                                    >
                                        <div className="relative w-24 aspect-video rounded-md bg-zinc-800 flex-shrink-0 overflow-hidden shadow-lg border border-white/5">
                                            {video.thumbnail ? (
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className={cn(
                                                        "w-full h-full object-cover transition-transform duration-500",
                                                        isActive ? "scale-110" : "group-hover:scale-105"
                                                    )}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                    <Play className="h-6 w-6 text-zinc-700" />
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <Play className="h-4 w-4 text-primary-foreground ml-0.5 fill-current" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <p className={cn(
                                                "text-sm font-semibold line-clamp-2 leading-snug mb-1.5 transition-colors",
                                                isActive ? "text-primary" : "text-zinc-200 group-hover:text-white"
                                            )}>
                                                {video.title}
                                            </p>
                                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 flex items-center gap-1.5">
                                                <PlayCircle className="h-3 w-3" />
                                                {video.duration || "Video"}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary mr-1" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </Card>
    );
}
