"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// NAV BUTTON - Single line navigation button
// ============================================================================
// Used for page navigation within contexts (Finanzas, Catálogo, etc.)
// Shows: Icon (16x16) + Title (single line, left-aligned)
// Tooltip is handled externally by SidebarTooltip component.
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
    isLocked
}: SidebarNavButtonProps) {
    const router = useRouter();
    const lockedClass = isLocked ? "opacity-40 grayscale text-muted-foreground" : "";

    // Prefetch on hover for faster navigation
    const handleMouseEnter = React.useCallback(() => {
        if (href && !disabled) {
            router.prefetch(href as any);
        }
    }, [href, disabled, router]);

    const content = (
        <div
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-150",
                isActive
                    ? "bg-white/[0.04] text-foreground border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_3px_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03] border border-transparent",
                "p-0 min-h-[32px]",
                disabled && "cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/60",
                className
            )}
        >
            {/* Icon - 16x16 */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0",
                isActive ? "text-foreground" : "text-muted-foreground/50 group-hover:text-muted-foreground",
                lockedClass
            )}>
                <Icon className="h-4 w-4" />
            </div>

            {/* Label - Single line, left-aligned */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-opacity duration-200 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0",
                lockedClass
            )}>
                {label}
            </span>

            {/* Badge - Absolute at top-right - NOT affected by locked styles */}
            {isExpanded && badge && (
                <div className="absolute right-1 top-0.5 z-10">
                    {badge}
                </div>
            )}
        </div>
    );

    // If disabled, return non-clickable div
    if (disabled) {
        return <div className="w-full">{content}</div>;
    }

    // If href is provided, wrap in Link with prefetch on hover
    if (href) {
        return (
            <Link href={href as any} onClick={onClick} onMouseEnter={handleMouseEnter} className="w-full block">
                {content}
            </Link>
        );
    }

    // Otherwise, return as button
    return (
        <button onClick={onClick} className="w-full text-left">
            {content}
        </button>
    );
}
