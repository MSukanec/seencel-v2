"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    videoId: string;
    title?: string;
    className?: string;
    autoPlay?: boolean;
    startTime?: number; // Start time in seconds
}

export function VideoPlayer({ videoId, title, className, autoPlay = false, startTime }: VideoPlayerProps) {
    const [provider, setProvider] = useState<"vimeo" | "youtube" | null>(null);

    useEffect(() => {
        if (!videoId) {
            setProvider(null);
            return;
        }

        // Simple heuristic: YouTube IDs are usually 11 chars (alphanumeric + _-), 
        // Vimeo IDs are usually numeric (sometimes with hash).
        // Let's assumme if it's purely numeric, it's Vimeo. 
        // If it contains letters, it's likely YouTube.
        // This isn't perfect but works for general cases.

        // Better Regex check:
        const isVimeo = /^\d+$/.test(videoId) || /^\d+\/[a-zA-Z0-9]+$/.test(videoId); // numeric or numeric/hash

        if (isVimeo) {
            setProvider("vimeo");
        } else {
            setProvider("youtube");
        }
    }, [videoId]);

    // Build the iframe src with start time support
    const iframeSrc = useMemo(() => {
        if (!videoId || !provider) return null;

        if (provider === "vimeo") {
            // Vimeo uses #t=XXs format for start time
            const timeParam = startTime ? `#t=${startTime}s` : "";
            return `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479${autoPlay ? '&autoplay=1' : ''}${timeParam}`;
        } else {
            // YouTube uses start=XX parameter
            const startParam = startTime ? `&start=${startTime}` : "";
            return `https://www.youtube.com/embed/${videoId}?rel=0${autoPlay ? '&autoplay=1' : ''}${startParam}`;
        }
    }, [videoId, provider, startTime, autoPlay]);

    if (!videoId) {
        return (
            <div className={cn("aspect-video bg-black/90 flex items-center justify-center text-white", className)}>
                <p>No video available</p>
            </div>
        );
    }

    // Don't render iframe until provider is detected and src is ready
    if (!provider || !iframeSrc) {
        return (
            <div className={cn("aspect-video bg-black/90 flex items-center justify-center text-white animate-pulse", className)}>
                <p>Cargando video...</p>
            </div>
        );
    }

    return (
        <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border shadow-md", className)}>
            {provider === "vimeo" ? (
                <iframe
                    key={`vimeo-${videoId}-${startTime}`}
                    src={iframeSrc}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    className="absolute top-0 left-0 w-full h-full"
                    title={title || "Video Player"}
                />
            ) : (
                <iframe
                    key={`youtube-${videoId}-${startTime}`}
                    src={iframeSrc}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    title={title || "Video Player"}
                />
            )}
        </div>
    );
}

