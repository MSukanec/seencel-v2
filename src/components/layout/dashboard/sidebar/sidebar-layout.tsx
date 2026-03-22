"use client";

import * as React from "react"
import { Sidebar } from "./sidebar";
import { ActivityBar } from "./activity-bar";
import { UserProfile } from "@/types/user";
import { useContextSidebarContent, useContextSidebarOverlay } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useSidebarMode, useLayoutStore } from "@/stores/layout-store";
import { SidebarToggleButton } from "./sidebar-toggle-button";

import { useSidebarSync } from "./hooks/use-sidebar-sync";
import { useSidebarHover } from "./hooks/use-sidebar-hover";
import { useSidebarResize } from "./hooks/use-sidebar-resize";

// Component Constraints
const ALWAYS_EXPANDED_PATHS = ['/settings'];
const MIN_WIDTH = 56;
const COMPACT_THRESHOLD = 120;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 224;

interface SidebarLayoutProps {
    children: React.ReactNode;
    user?: UserProfile | null;
}

export function SidebarLayout({ children, user }: SidebarLayoutProps) {
    // 1. Context & Global State Access
    const { content: contextContent, title: contextTitle, action: contextAction, hasOverlay } = useContextSidebarContent();
    const { popOverlay } = useContextSidebarOverlay();
    const { activeContext } = useLayoutStore();
    const sidebarMode = useSidebarMode();

    // 2. Extracted World-Class Hooks (SRP)
    const { effectivePathname } = useSidebarSync();
    const { isHovered, sidebarHovered, handleMouseEnter, handleMouseLeave } = useSidebarHover();
    const { sidebarWidth, isResizing, handleMouseDown, sidebarRef } = useSidebarResize(DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);

    // 3. Derived UI Render State
    const hasContextSidebar = !!contextContent;
    const hideSidebar = activeContext === 'learnings';
    const forceExpanded = ALWAYS_EXPANDED_PATHS.some(p => effectivePathname.includes(p));
    const showSidebarNav = !hideSidebar && (forceExpanded || sidebarMode === 'docked' || (sidebarMode === 'expanded_hover' && isHovered));
    const isCompact = sidebarWidth < COMPACT_THRESHOLD;

    // 4. Pure Declarative Render
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-shell overflow-hidden">
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
                    <SidebarToggleButton isVisible={sidebarHovered && !hideSidebar} />
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
