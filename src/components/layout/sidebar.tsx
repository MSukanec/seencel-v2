"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout-store";
import { SidebarContent } from "@/components/layout/sidebar-content";

export function Sidebar() {
    const { sidebarMode } = useLayoutStore();

    // Local state for hover expansion (applies to pages panel)
    const [isHovered, setIsHovered] = React.useState(false);

    // Total sidebar width calculation:
    // Left rail: 60px (always)
    // Right panel: 60px (collapsed) | 180px (expanded)
    // Total: 120px (collapsed) | 240px (expanded)
    const isExpanded =
        sidebarMode === 'docked' ||
        (sidebarMode === 'expanded_hover' && isHovered);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl z-40 h-full shrink-0",
                isExpanded ? "w-[240px]" : "w-[120px]",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <SidebarContent isHovered={isHovered} />
        </aside>
    );
}

