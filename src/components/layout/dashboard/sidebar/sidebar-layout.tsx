"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { ActivityBar } from "./activity-bar";
import { UserProfile } from "@/types/user";
import { useContextSidebarContent, useContextSidebarOverlay } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useSidebarMode, usePendingPathname } from "@/stores/layout-store";
import { SidebarToggleButton } from "./sidebar-toggle-button";
import { usePathname } from "@/i18n/routing";

// URL path segments that ALWAYS force the sidebar expanded
// (they depend on sidebar navigation for sub-pages)
const ALWAYS_EXPANDED_PATHS = ['/settings'];

interface SidebarLayoutProps {
    children: React.ReactNode;
    user?: UserProfile | null;
}

const MIN_WIDTH = 56; // Minimum sidebar width - same as collapsed left sidebar
const COMPACT_THRESHOLD = 120; // Below this, show compact mode
const MAX_WIDTH = 400; // Maximum sidebar width in pixels
const DEFAULT_WIDTH = 224; // w-56 equivalent

export function SidebarLayout({ children, user }: SidebarLayoutProps) {
    const { content: contextContent, title: contextTitle, action: contextAction, hasOverlay } = useContextSidebarContent();
    const { popOverlay } = useContextSidebarOverlay();
    const hasContextSidebar = !!contextContent;
    const sidebarMode = useSidebarMode();
    const pathname = usePathname();
    const pendingPathname = usePendingPathname();
    const effectivePathname = pendingPathname ?? pathname;

    // Settings (and similar) always force sidebar expanded — detected via URL
    // to avoid deadlock: activeContext syncs inside SidebarContent which doesn't mount when collapsed
    const forceExpanded = ALWAYS_EXPANDED_PATHS.some(p => effectivePathname.includes(p));

    // Hover state for expand-on-hover mode + toggle button visibility
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

    // Determine if sidebar nav panel should be shown
    // Force expanded for contexts that depend on sidebar navigation (e.g., Settings)
    const showSidebarNav = forceExpanded || sidebarMode === 'docked' || (sidebarMode === 'expanded_hover' && isHovered);

    // Mounted state to avoid hydration mismatch
    const [mounted, setMounted] = React.useState(false);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = React.useState(false);
    const sidebarRef = React.useRef<HTMLDivElement>(null);

    // Mount and load saved width from localStorage
    React.useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('context-sidebar-width');
        if (saved) {
            const width = parseInt(saved, 10);
            if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
                setSidebarWidth(width);
            }
        }
    }, []);

    // Save width to localStorage (only after mounted)
    React.useEffect(() => {
        if (mounted && !isResizing) {
            localStorage.setItem('context-sidebar-width', String(sidebarWidth));
        }
    }, [sidebarWidth, isResizing, mounted]);

    // Handle resize
    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (e: MouseEvent) => {
            // Moving left increases sidebar width, moving right decreases
            const delta = startX - e.clientX;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [sidebarWidth]);

    // Is sidebar compact (less than threshold)?
    const isCompact = sidebarWidth < COMPACT_THRESHOLD;

    return (
        <div className="h-screen flex flex-col bg-shell overflow-hidden">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop: Activity Bar + Sidebar Detail Panel */}
                <div
                    className="hidden md:flex h-full shrink-0 relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <ActivityBar user={user} />
                    <div className={cn(
                        "transition-all duration-200 ease-in-out overflow-hidden",
                        showSidebarNav ? "opacity-100" : "w-0 opacity-0",
                        // In hover mode, sidebar floats over content (but not when force-expanded)
                        !forceExpanded && sidebarMode === 'expanded_hover' && showSidebarNav && "absolute left-[50px] top-0 bottom-0 z-50 shadow-xl"
                    )}>
                        <Sidebar user={user} />
                    </div>

                    {/* Toggle button — Vercel-style chevron at the edge, visible on sidebar hover */}
                    <SidebarToggleButton isVisible={sidebarHovered} />
                </div>

                {/* Main Content — Canvas (encapsulated inset effect) */}
                <main className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background rounded-2xl my-2 mr-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(0,0,0,0.2)]">
                    {children}
                </main>

                {/* Context Sidebar with manual resize */}
                {hasContextSidebar && (
                    <div
                        ref={sidebarRef}
                        className="hidden md:flex flex-col shrink-0 relative"
                        style={{ width: sidebarWidth }}
                    >
                        {/* Resize Handle */}
                        <div
                            onMouseDown={handleMouseDown}
                            className={cn(
                                "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10",
                                "flex items-center justify-center",
                                "hover:bg-primary/10 transition-colors",
                                isResizing && "bg-primary/20"
                            )}
                        >
                            <div className={cn(
                                "w-0.5 h-10 rounded-full transition-colors",
                                isResizing ? "bg-primary" : "bg-border/50 hover:bg-primary/50"
                            )} />
                        </div>

                        {/* Sidebar Content */}
                        <aside className="flex flex-col h-full bg-sidebar overflow-hidden ml-2">
                            {contextTitle && (
                                <div className="p-3 shrink-0 flex items-center justify-between gap-2">
                                    <h3 className={cn(
                                        "text-sm font-medium text-muted-foreground truncate flex-1",
                                        isCompact && "text-center"
                                    )}>
                                        {isCompact ? contextTitle.slice(0, 2).toUpperCase() : contextTitle}
                                    </h3>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!isCompact && contextAction}
                                        {hasOverlay && !isCompact && (
                                            <button
                                                onClick={popOverlay}
                                                className="flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                title="Cerrar"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto">
                                {/* Pass isCompact to children via context or data attribute */}
                                <div data-compact={isCompact ? "true" : "false"}>
                                    {contextContent}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
