"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout-store";
import { SidebarContent } from "./sidebar-content";
import { UserProfile } from "@/types/user";

interface SidebarProps {
    user?: UserProfile | null;
}

export function Sidebar({ user }: SidebarProps) {
    const { sidebarMode } = useLayoutStore();

    // Local state for hover expansion
    const [isHovered, setIsHovered] = React.useState(false);

    const isExpanded =
        sidebarMode === 'docked' ||
        (sidebarMode === 'expanded_hover' && isHovered);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl z-40 h-full shrink-0 transition-all duration-300 ease-in-out",
                isExpanded ? "w-[240px]" : "w-[50px]",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <SidebarContent isExpanded={isExpanded} user={user} />
        </aside>
    );
}

