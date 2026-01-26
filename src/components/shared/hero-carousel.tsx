"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

// ============================================================================
// TYPES
// ============================================================================

export interface HeroSlide {
    id: string;
    title?: string | null;
    description?: string | null;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | 'gif' | null;
    primaryButton?: {
        text: string;
        action: string;
        actionType: 'url' | 'route' | 'action';
    } | null;
    secondaryButton?: {
        text: string;
        action: string;
        actionType: 'url' | 'route' | 'action';
    } | null;
}

interface HeroCarouselProps {
    slides: HeroSlide[];
    autoPlay?: boolean;
    interval?: number; // ms
    className?: string;
    showDots?: boolean;
    showArrows?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HeroCarousel({
    slides,
    autoPlay = true,
    interval = 4000,
    className,
    showDots = true,
    showArrows = true,
}: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

    // Filter out empty slides
    const validSlides = slides.filter(s => s.title || s.description || s.mediaUrl);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % validSlides.length);
    }, [validSlides.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + validSlides.length) % validSlides.length);
    }, [validSlides.length]);

    // Autoplay
    useEffect(() => {
        if (!isAutoPlaying || validSlides.length <= 1) return;

        const timer = setInterval(goNext, interval);
        return () => clearInterval(timer);
    }, [isAutoPlaying, interval, goNext, validSlides.length]);

    // Pause on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(autoPlay);

    if (validSlides.length === 0) return null;

    const currentSlide = validSlides[currentIndex];

    // Slide animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <div
            className={cn(
                "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10",
                "min-h-[300px] md:min-h-[400px]",
                className
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                {currentSlide.mediaUrl && (
                    <>
                        {currentSlide.mediaType === 'video' ? (
                            <video
                                key={currentSlide.id}
                                src={currentSlide.mediaUrl}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                key={currentSlide.id}
                                src={currentSlide.mediaUrl}
                                alt={currentSlide.title || 'Hero'}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* Overlay for readability */}
                        <div className="absolute inset-0 bg-black/60" />
                    </>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center h-full min-h-[300px] md:min-h-[400px] p-8 md:p-12 lg:p-16">
                <AnimatePresence mode="wait" custom={1}>
                    <motion.div
                        key={currentSlide.id}
                        custom={1}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="max-w-2xl"
                    >
                        {currentSlide.title && (
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
                                {currentSlide.title}
                            </h2>
                        )}
                        {currentSlide.description && (
                            <p className="text-sm md:text-base text-muted-foreground mb-6 leading-snug line-clamp-3">
                                {currentSlide.description}
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-4">
                            {currentSlide.primaryButton?.text && (
                                <Button asChild size="lg" className="rounded-full">
                                    <Link href={currentSlide.primaryButton.action as any}>
                                        {currentSlide.primaryButton.text}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            {currentSlide.secondaryButton?.text && (
                                <Button asChild variant="outline" size="lg" className="rounded-full">
                                    <Link href={currentSlide.secondaryButton.action as any}>
                                        {currentSlide.secondaryButton.text}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {showArrows && validSlides.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                        onClick={goPrev}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                        onClick={goNext}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}

            {/* Dots Navigation */}
            {showDots && validSlides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {validSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                index === currentIndex
                                    ? "w-8 bg-primary"
                                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
