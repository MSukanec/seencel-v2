"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout-store";
import { SidebarContent } from "./sidebar-content";
import { UserProfile } from "@/types/user";

interface SidebarProps {
    user?: UserProfile | null;
}

export function Sidebar({ user }: SidebarProps) {
    const { activeContext } = useLayoutStore();

    // Hub context: no detail panel needed (the page IS the hub)
    const showPanel = activeContext !== 'home';

    return (
        <aside
            className={cn(
                "flex flex-col bg-sidebar z-40 h-full shrink-0 transition-all duration-200 ease-in-out overflow-hidden",
                showPanel ? "w-[230px]" : "w-0",
            )}
        >
            {showPanel && (
                <SidebarContent isExpanded={true} user={user} />
            )}
        </aside>
    );
}
