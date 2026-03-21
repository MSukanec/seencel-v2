"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// SIDEBAR NAV BUTTON — Unified navigation button
// ============================================================================
// Two variants:
//   "nav"     → Sidebar navigation: icon (14px) + expandable label + badge
//   "compact" → Activity bar: icon-only (18px) + active left-bar indicator
//
// Supports: disabled, isLocked, badge, href with prefetch, status
// ============================================================================

interface SidebarNavButtonProps {
    icon: React.ElementType;
    label: string;
    href?: string;
    isExpanded?: boolean;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    badge?: React.ReactNode;
    disabled?: boolean;
    isLocked?: boolean;
    /** "nav" = sidebar nav (default), "compact" = activity bar icon-only */
    variant?: 'nav' | 'compact';
    /** Optional status for feature flag visual treatment */
    status?: string;
    /** Whether the item is hidden (only visible to admins with muted visual) */
    hidden?: boolean;
}

export function SidebarNavButton({
    icon: Icon,
    label,
    href,
    isExpanded = false,
    isActive = false,
    onClick,
    className,
    badge,
    disabled,
    isLocked,
    variant = 'nav',
    status,
    hidden,
}: SidebarNavButtonProps) {
    const router = useRouter();
    const isCompact = variant === 'compact';
    const hasRestriction = !!status && status !== 'active';
    const restrictedClass = (isLocked || hasRestriction || hidden) ? "opacity-40 grayscale" : "";

    // Prefetch on hover for faster navigation
    const handleMouseEnter = React.useCallback(() => {
        if (href && !disabled) {
            router.prefetch(href as any);
        }
    }, [href, disabled, router]);

    // Build the inner visual structure
    const innerContent = isCompact ? (
        <>
            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />}
            <Icon className={cn("h-[18px] w-[18px]", restrictedClass)} />
            {badge && !isExpanded && <span className="absolute top-1 right-1 z-10">{badge}</span>}
        </>
    ) : (
        <>
            <div className={cn("w-7 h-7 flex items-center justify-center shrink-0", isActive ? "text-foreground" : "text-muted-foreground/50 group-hover:text-muted-foreground", restrictedClass)}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <span className={cn("text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left", isExpanded ? "flex-1 opacity-100 ml-1" : "w-0 opacity-0 ml-0", restrictedClass)}>
                {label}
            </span>
            {isExpanded && badge && <div className="absolute right-1 top-0.5 z-10">{badge}</div>}
        </>
    );

    // Build the outer classes
    const outerClasses = isCompact ? cn(
        "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 cursor-pointer",
        "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.04]",
        isActive && "text-foreground bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.2)]",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
        className
    ) : cn(
        "group relative flex items-center w-full rounded-lg transition-all duration-150 p-0 min-h-[28px]",
        isActive
            ? "bg-white/[0.04] text-foreground border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]"
            : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03] border border-transparent",
        disabled && "cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/60",
        className
    );

    if (disabled) {
        return <div className={cn(outerClasses, "cursor-not-allowed")}>{innerContent}</div>;
    }

    if (href) {
        return (
            <Link href={href as any} onClick={onClick} onMouseEnter={handleMouseEnter} className={outerClasses}>
                {innerContent}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={cn(outerClasses, !isCompact && "w-full text-left")}>
            {innerContent}
        </button>
    );
}
