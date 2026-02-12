"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PageSkeletonProps {
    /** Page title to display in the header */
    title?: string;
    /** Rotating messages shown during loading */
    messages?: string[];
    /** Interval between messages in ms (default: 2800) */
    interval?: number;
}

/**
 * PageSkeleton — Branded loading screen for dashboard pages.
 * Shows the Seencel logo with rotating contextual messages
 * centered in the viewport, giving personality and reducing
 * perceived wait time.
 */
export function PageSkeleton({
    title,
    messages,
    interval = 2800,
}: PageSkeletonProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!messages?.length) return;

        const timer = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, interval);

        return () => clearInterval(timer);
    }, [messages, interval]);

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            {/* Centered loading content */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 -mt-16">
                {/* Seencel logo with pulse animation */}
                <div className="relative">
                    <Image
                        src="/logo.png"
                        alt="Seencel"
                        width={72}
                        height={72}
                        className="opacity-30 animate-pulse"
                        priority
                    />
                </div>

                {/* Rotating message */}
                {messages && messages.length > 0 && (
                    <p
                        key={messageIndex}
                        className={cn(
                            "text-lg text-foreground/70 font-light tracking-wide",
                            "animate-in fade-in slide-in-from-bottom-2 duration-500"
                        )}
                    >
                        {messages[messageIndex]}
                    </p>
                )}
            </div>
        </div>
    );
}
