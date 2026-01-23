"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ============================================================================
// NAV BUTTON - Single line navigation button
// ============================================================================
// Used for page navigation within contexts (Finanzas, Catálogo, etc.)
// Shows: Icon (16x16) + Title (single line, left-aligned)
// ============================================================================

interface SidebarNavButtonProps {
    icon: React.ElementType;
    label: string;
    href?: string;
    isExpanded?: boolean;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}

export function SidebarNavButton({
    icon: Icon,
    label,
    href,
    isExpanded = false,
    isActive = false,
    onClick,
    className
}: SidebarNavButtonProps) {
    const content = (
        <div
            className={cn(
                "group relative flex items-center w-full rounded-lg transition-all duration-200",
                "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                "p-0 min-h-[32px]",
                isActive && "bg-secondary text-foreground",
                className
            )}
        >
            {/* Icon - 16x16 */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
            </div>

            {/* Label - Single line, left-aligned */}
            <span className={cn(
                "text-[13px] font-medium truncate transition-all duration-150 ease-in-out text-left",
                isExpanded ? "flex-1 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
            )}>
                {label}
            </span>
        </div>
    );

    // If href is provided, wrap in Link
    if (href) {
        return (
            <Link href={href as any} onClick={onClick} className="w-full block">
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

