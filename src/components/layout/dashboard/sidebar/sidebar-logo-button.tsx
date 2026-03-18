"use client";

import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout-store";
import { useRouter } from "@/i18n/routing";
import { contextRoutes } from "@/hooks/use-sidebar-navigation";

// ============================================================================
// SIDEBAR LOGO BUTTON — Seencel logo → Hub
// ============================================================================
// Standalone button (like SidebarUserButton).
// Shows the Seencel logo at the same size as the user avatar.
// Click navigates to Hub.
// ============================================================================

export function SidebarLogoButton() {
    const router = useRouter();
    const activeContext = useLayoutStore((s) => s.activeContext);
    const setActiveContext = useLayoutStore((s) => s.actions.setActiveContext);

    const handleClick = () => {
        setActiveContext('home');
        router.push(contextRoutes.home as any);
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center justify-center w-9 h-9 mx-auto rounded-full transition-transform duration-150 cursor-pointer hover:scale-110 active:scale-95"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/logo.png"
                alt="Seencel"
                className="w-8 h-8 rounded-full"
            />
        </button>
    );
}
