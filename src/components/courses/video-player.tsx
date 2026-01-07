"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    videoId: string;
    title?: string;
    className?: string;
    autoPlay?: boolean;
}

export function VideoPlayer({ videoId, title, className, autoPlay = false }: VideoPlayerProps) {
    const [provider, setProvider] = useState<"vimeo" | "youtube" | null>(null);

    useEffect(() => {
        if (!videoId) return;

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

    if (!videoId) {
        return (
            <div className={cn("aspect-video bg-black/90 flex items-center justify-center text-white", className)}>
                <p>No video available</p>
            </div>
        );
    }

    return (
        <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border shadow-md", className)}>
            {provider === "vimeo" ? (
                <iframe
                    src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479${autoPlay ? '&autoplay=1' : ''}`}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" // Standard Vimeo permissions
                    className="absolute top-0 left-0 w-full h-full"
                    title={title || "Video Player"}
                />
            ) : (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0${autoPlay ? '&autoplay=1' : ''}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    title={title || "Video Player"}
                />
            )}
        </div>
    );
}
