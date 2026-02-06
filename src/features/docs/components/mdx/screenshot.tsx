"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ScreenshotProps {
    src: string;
    alt: string;
    caption?: string;
}

export function Screenshot({ src, alt, caption }: ScreenshotProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <>
            <figure className="my-6">
                <div
                    className="relative rounded-lg border border-border overflow-hidden cursor-zoom-in bg-muted"
                    onClick={() => setIsZoomed(true)}
                >
                    <Image
                        src={src}
                        alt={alt}
                        width={800}
                        height={450}
                        className="w-full h-auto"
                    />
                </div>
                {caption && (
                    <figcaption className="text-sm text-muted-foreground text-center mt-2">
                        {caption}
                    </figcaption>
                )}
            </figure>

            {/* Zoom modal */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                        onClick={() => setIsZoomed(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <Image
                        src={src}
                        alt={alt}
                        width={1600}
                        height={900}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                </div>
            )}
        </>
    );
}
