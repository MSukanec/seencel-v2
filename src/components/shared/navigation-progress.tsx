"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Global navigation progress bar — ultra-thin, fast, and subtle.
 * Shows a brief flash of progress at the top during page transitions.
 * Designed to complement (not compete with) loading.tsx skeletons.
 */
export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    // Track navigation start
    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href]') as HTMLAnchorElement;

            if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey) {
                const url = new URL(link.href);
                if (url.origin === window.location.origin && url.pathname !== pathname) {
                    setIsNavigating(true);
                    setProgress(0);
                }
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pathname]);

    // Fast progress animation — reaches 80% quickly then holds briefly
    React.useEffect(() => {
        if (!isNavigating) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 85) return prev;
                if (prev >= 60) return prev + 2;
                return prev + 8;
            });
        }, 40);

        return () => clearInterval(interval);
    }, [isNavigating]);

    // Complete on route change
    React.useEffect(() => {
        if (isNavigating) {
            setProgress(100);
            const timeout = setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [pathname, searchParams]);

    if (!isNavigating && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-transparent pointer-events-none">
            <div
                className={cn(
                    "h-full bg-primary/70 transition-all duration-150 ease-out",
                    progress === 100 && "opacity-0 transition-opacity duration-300"
                )}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
