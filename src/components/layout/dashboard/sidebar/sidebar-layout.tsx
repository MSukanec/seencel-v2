"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { UserProfile } from "@/types/user";
import { useContextSidebar } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
    children: React.ReactNode;
    user?: UserProfile | null;
}

const MIN_WIDTH = 56; // Minimum sidebar width - same as collapsed left sidebar
const COMPACT_THRESHOLD = 120; // Below this, show compact mode
const MAX_WIDTH = 400; // Maximum sidebar width in pixels
const DEFAULT_WIDTH = 224; // w-56 equivalent

export function SidebarLayout({ children, user }: SidebarLayoutProps) {
    const { state } = useContextSidebar();
    const hasContextSidebar = !!state.content;

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
                {/* Desktop Sidebar - Hidden on Mobile */}
                <div className="hidden md:block h-full shrink-0">
                    <Sidebar user={user} />
                </div>

                {/* Main Content — Canvas */}
                <main className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background rounded-tl-2xl">
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
                        <aside className="flex flex-col h-full border-l bg-sidebar overflow-hidden ml-2">
                            {state.title && (
                                <div className="p-3 border-b shrink-0">
                                    <h3 className={cn(
                                        "text-sm font-medium text-muted-foreground",
                                        isCompact && "text-center"
                                    )}>
                                        {isCompact ? state.title.slice(0, 2).toUpperCase() : state.title}
                                    </h3>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto">
                                {/* Pass isCompact to children via context or data attribute */}
                                <div data-compact={isCompact ? "true" : "false"}>
                                    {state.content}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
