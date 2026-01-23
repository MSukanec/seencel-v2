"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Download, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export interface MediaItem {
    id: string;
    url: string;
    type: string;
    name?: string | null;
}

interface MediaLightboxProps {
    items: MediaItem[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export function MediaLightbox({ items, initialIndex, isOpen, onClose }: MediaLightboxProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
    const [isLoading, setIsLoading] = React.useState(true);

    // Sync state when opening with a new index
    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setIsLoading(true);
        }
    }, [isOpen, initialIndex]);

    const currentItem = items[currentIndex];

    // Derived state
    const isImage = currentItem?.type.startsWith('image') || currentItem?.type === 'image';
    const isVideo = currentItem?.type.startsWith('video') || currentItem?.type === 'video';
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === items.length - 1;

    // Navigation
    const next = React.useCallback(() => {
        if (!isLast) {
            setCurrentIndex(prev => prev + 1);
            setIsLoading(true);
        }
    }, [isLast]);

    const prev = React.useCallback(() => {
        if (!isFirst) {
            setCurrentIndex(prev => prev - 1);
            setIsLoading(true);
        }
    }, [isFirst]);

    // Keyboard support
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, next, prev, onClose]);


    if (!currentItem) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col justify-center items-center focus:outline-none [&>button]:hidden"
            // Prevent generic close button from interfering or looking ugly
            // We implement our own UI
            >
                {/* Accessibility: Dialog must have a title */}
                <VisuallyHidden.Root>
                    <DialogTitle>{currentItem.name || "Media visualizer"}</DialogTitle>
                    <DialogDescription>Viewing file {currentIndex + 1} of {items.length}</DialogDescription>
                </VisuallyHidden.Root>

                {/* --- BACKDROP / OVERLAY UI --- */}

                {/* Top Bar (Counter + Close) */}
                <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-50">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-medium">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>

                {/* Close Button (Fixed Top Right) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Navigation Arrows */}
                {!isFirst && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 h-12 w-12 hidden sm:flex"
                        onClick={prev}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                )}

                {!isLast && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 h-12 w-12 hidden sm:flex"
                        onClick={next}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                )}

                {/* --- MAIN CONTENT --- */}
                <div
                    className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300"
                    // Animation reset on index change
                    key={currentItem.id}
                >
                    {isImage && (
                        <>
                            {/* Loader */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <img
                                src={currentItem.url}
                                alt={currentItem.name || "Vista previa"}
                                className={cn(
                                    "max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl transition-opacity duration-300",
                                    isLoading ? "opacity-0" : "opacity-100"
                                )}
                                onLoad={() => setIsLoading(false)}
                            />
                        </>
                    )}

                    {isVideo && (
                        <video
                            src={currentItem.url}
                            controls
                            autoPlay
                            className="max-h-[85vh] max-w-[90vw] rounded-md shadow-2xl bg-black"
                        />
                    )}

                    {!isImage && !isVideo && (
                        <div className="flex flex-col items-center justify-center text-white bg-neutral-900/90 p-12 rounded-2xl border border-white/10">
                            <FileText className="h-20 w-20 opacity-50 mb-6" />
                            <h3 className="text-xl font-bold mb-2 max-w-md text-center break-words">{currentItem.name || "Archivo"}</h3>
                            <p className="text-white/60 mb-8 uppercase text-xs tracking-wider font-mono">{currentItem.type}</p>

                            <Button asChild variant="secondary" size="lg">
                                <a href={currentItem.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar / Abrir
                                </a>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bottom Bar (Caption / Name) */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    {currentItem.name && (
                        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full text-white/90 text-sm font-medium max-w-[80vw] truncate">
                            {currentItem.name}
                        </div>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
}

