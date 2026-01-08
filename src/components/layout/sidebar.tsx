"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout-store";
import { SidebarContent } from "@/components/layout/sidebar-content";

export function Sidebar() {
    const { sidebarMode } = useLayoutStore();

    // Local state for hover expansion
    const [isHovered, setIsHovered] = React.useState(false);

    // Logic for outer width expansion
    // Note: We don't know isDropdownOpen here easily, but isHovered usually covers it for the container width.
    // If user clicks dropdown, they are hovering.
    const isExpanded =
        sidebarMode === 'docked' ||
        (sidebarMode === 'expanded_hover' && isHovered);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300 z-40 h-full shrink-0",
                isExpanded ? "w-[240px]" : "w-[60px]",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <SidebarContent isHovered={isHovered} />
        </aside>
    );
}
