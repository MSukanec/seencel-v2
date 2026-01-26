"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// BASE EXPANDABLE BUTTON
// ============================================================================
// Layout: [Left Zone] [Center Zone] [Right Zone]
// - Left: Fixed width (icon or avatar)
// - Center: Expandable (title + optional subtitle)
// - Right: Optional action (chevron, badge, etc)
// ============================================================================

export interface SidebarExpandableButtonBaseProps {
    /** Whether the sidebar is expanded */
    isExpanded?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional className */
    className?: string;
    /** Left zone content (icon, avatar, etc) */
    leftContent: React.ReactNode;
    /** Primary text (title/name) */
    title: string;
    /** Secondary text (description/email) - optional */
    subtitle?: string | null;
    /** Right zone content (chevron, badge, etc) - optional */
    rightContent?: React.ReactNode;
    /** Badge/Status indicator - optional */
    badge?: React.ReactNode;
    /** Whether the item is visually locked */
    isLocked?: boolean;
    /** Height of the button */
    height?: "sm" | "md" | "lg";
}

const heightClasses = {
    sm: "min-h-[32px]",
    md: "min-h-[40px]",
    lg: "min-h-[48px]"
};

export function SidebarExpandableButtonBase({
    isExpanded = false,
    onClick,
    className,
    leftContent,
    title,
    subtitle,
    rightContent,
    badge,
    height = "md",
    isLocked
}: SidebarExpandableButtonBaseProps) {
    const lockedClass = isLocked ? "opacity-40 grayscale text-muted-foreground" : "";

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-colors duration-0",
                "hover:bg-secondary/80 text-foreground",
                "p-0",
                heightClasses[height],
                className
            )}
        >
            {/* Left Zone - Fixed width */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-0",
                lockedClass
            )}>
                {leftContent}
            </div>

            {/* Center Zone - Expandable text content */}
            <div className={cn(
                "flex flex-col items-start justify-center min-w-0 overflow-hidden transition-all duration-150 ease-in-out ml-2",
                isExpanded ? "flex-1 opacity-100" : "w-0 opacity-0 ml-0",
                lockedClass
            )}>
                <span className="font-semibold text-sm text-foreground truncate w-full text-left">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-xs text-muted-foreground truncate w-full text-left group-hover:text-muted-foreground/80">
                        {subtitle}
                    </span>
                )}
            </div>

            {/* Badge - Absolute Positioned - NOT AFFECTED BY LOCKED CLASS */}
            {isExpanded && badge && (
                <div className="absolute right-8 top-1 z-10">
                    {badge}
                </div>
            )}

            {/* Right Zone - Optional action */}
            {rightContent && (
                <div className={cn(
                    "flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-all duration-150",
                    isExpanded ? "w-8 opacity-100" : "w-0 opacity-0",
                    lockedClass
                )}>
                    {rightContent}
                </div>
            )}
        </button>
    );
}

