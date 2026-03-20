"use client";

import * as React from "react"
import { cn } from "@/lib/utils";
import { useLayoutStore, usePendingPathname } from "@/stores/layout-store";
import { SidebarContent } from "./sidebar-content";
import { UserProfile } from "@/types/user";
import { usePathname } from "@/i18n/routing";

// URL path segments that ALWAYS force the sidebar panel visible
const ALWAYS_VISIBLE_PATHS = ['/settings'];

interface SidebarProps {
    user?: UserProfile | null;
}

export function Sidebar({ user }: SidebarProps) {
    const { activeContext } = useLayoutStore();
    const pathname = usePathname();
    const pendingPathname = usePendingPathname();
    const effectivePathname = pendingPathname ?? pathname;

    // Hub context: no detail panel needed (the page IS the hub)
    // BUT force visible for paths that always need sidebar (e.g., Settings)
    const forceVisible = ALWAYS_VISIBLE_PATHS.some(p => effectivePathname.includes(p));
    const showPanel = forceVisible || activeContext !== 'home';

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
