"use client";

import * as React from "react";

/**
 * Encapsulates the imperative DOM events for resizing the sidebar
 * and handles the LocalStorage hydration cleanly.
 */
export function useSidebarResize(
    defaultWidth: number,
    minWidth: number,
    maxWidth: number,
    storageKey: string = 'context-sidebar-width'
) {
    const [mounted, setMounted] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(defaultWidth);
    const [isResizing, setIsResizing] = React.useState(false);
    const sidebarRef = React.useRef<HTMLDivElement>(null);

    // Mount and load saved width from localStorage
    React.useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const width = parseInt(saved, 10);
            if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
                setSidebarWidth(width);
            }
        }
    }, [storageKey, minWidth, maxWidth]);

    // Save width to localStorage (only after mounted)
    React.useEffect(() => {
        if (mounted && !isResizing) {
            localStorage.setItem(storageKey, String(sidebarWidth));
        }
    }, [sidebarWidth, isResizing, mounted, storageKey]);

    // Handle mouse events imperatively outside of React render cycles
    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = startX - e.clientX;
            const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [sidebarWidth, minWidth, maxWidth]);

    return {
        sidebarWidth,
        isResizing,
        handleMouseDown,
        sidebarRef
    };
}
