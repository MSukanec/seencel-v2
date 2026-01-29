"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Global navigation progress bar that shows when navigating between pages.
 * Provides instant visual feedback that something is happening.
 */
export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    // Track navigation start
    React.useEffect(() => {
        const handleStart = () => {
            setIsNavigating(true);
            setProgress(0);
        };

        // Listen for click events on links
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href]') as HTMLAnchorElement;

            if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey) {
                const url = new URL(link.href);
                // Only trigger for internal navigation
                if (url.origin === window.location.origin && url.pathname !== pathname) {
                    handleStart();
                }
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pathname]);

    // Progress animation while navigating
    React.useEffect(() => {
        if (!isNavigating) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                // Slow down as we approach 90%
                if (prev >= 90) return prev;
                if (prev >= 70) return prev + 0.5;
                if (prev >= 50) return prev + 1;
                return prev + 3;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isNavigating]);

    // Complete on route change
    React.useEffect(() => {
        if (isNavigating) {
            setProgress(100);
            const timeout = setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [pathname, searchParams]);

    if (!isNavigating && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-transparent">
            <div
                className={cn(
                    "h-full bg-primary transition-all duration-200 ease-out",
                    progress === 100 && "opacity-0"
                )}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
