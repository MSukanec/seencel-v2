"use client";

import * as React from "react";
import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "@/i18n/routing";
import { useFeatureFlags } from "@/providers/feature-flags-provider";
import { SidebarNavButton } from "./sidebar-nav-button";

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
        <SidebarNavButton
            icon={Hammer}
            label="Admin"
            href={"/admin" as any}
            isActive={isActive}
            isExpanded={isExpanded}
            onClick={() => router.push('/admin' as any)}
        />
    );
}
