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
    height = "md"
}: SidebarExpandableButtonBaseProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-200",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0",
                heightClasses[height],
                className
            )}
        >
            {/* Left Zone - Fixed width */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {leftContent}
            </div>

            {/* Center Zone - Expandable text content */}
            <div className={cn(
                "flex flex-col items-start justify-center min-w-0 overflow-hidden transition-all duration-150 ease-in-out ml-2",
                isExpanded ? "flex-1 opacity-100" : "w-0 opacity-0 ml-0"
            )}>
                <span className="font-semibold text-sm text-foreground truncate w-full text-left">
                    {title}
                </span>
                {subtitle && (
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                        {subtitle}
                    </span>
                )}
            </div>

            {/* Right Zone - Optional action */}
            {rightContent && (
                <div className={cn(
                    "flex items-center justify-center shrink-0 text-muted-foreground transition-all duration-150",
                    isExpanded ? "w-8 opacity-100" : "w-0 opacity-0"
                )}>
                    {rightContent}
                </div>
            )}
        </button>
    );
}

