"use client";

import * as React from "react";
import { useSidebarMode } from "@/stores/layout-store";

/**
 * Encapsulates the debounced hover logic to safely expand
 * and collapse the sidebar when in 'expanded_hover' mode.
 */
export function useSidebarHover() {
    const sidebarMode = useSidebarMode();
    const [isHovered, setIsHovered] = React.useState(false);
    const [sidebarHovered, setSidebarHovered] = React.useState(false);
    const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = React.useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setSidebarHovered(true);
        if (sidebarMode === 'expanded_hover') setIsHovered(true);
    }, [sidebarMode]);

    const handleMouseLeave = React.useCallback(() => {
        hoverTimerRef.current = setTimeout(() => {
            setSidebarHovered(false);
            if (sidebarMode === 'expanded_hover') setIsHovered(false);
        }, 200);
    }, [sidebarMode]);

    React.useEffect(() => {
        return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
    }, []);

    return {
        isHovered,
        sidebarHovered,
        handleMouseEnter,
        handleMouseLeave
    };
}
