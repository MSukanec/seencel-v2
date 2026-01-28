"use client";

import * as React from "react";
import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "@/i18n/routing";
import { useFeatureFlags } from "@/providers/feature-flags-provider";

// ============================================================================
// SIDEBAR ADMIN BUTTON
// ============================================================================
// Small button for Admin access in sidebar footer (visible only to admins)
// Matches the styling of SidebarNotificationsButton
// ============================================================================

interface SidebarAdminButtonProps {
    isExpanded?: boolean;
    className?: string;
}

export function SidebarAdminButton({
    isExpanded = false,
    className
}: SidebarAdminButtonProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAdmin } = useFeatureFlags();

    // Only render for admins
    if (!isAdmin) return null;

    const isActive = pathname.startsWith('/admin');

    return (
        <button
            onClick={() => router.push('/admin' as any)}
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-0",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                isActive && "bg-secondary/50 text-foreground",
                className
            )}
            title="Panel de Administración"
        >
            {/* Icon */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0 relative",
                "text-muted-foreground group-hover:text-foreground",
                isActive && "text-primary"
            )}>
                <Hammer className="h-4 w-4" />
            </div>

            {/* Label */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                Admin
            </span>
        </button>
    );
}
