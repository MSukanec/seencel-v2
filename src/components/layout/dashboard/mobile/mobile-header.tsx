"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { BreadcrumbItem } from "../shared/page-header";

interface MobileHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title?: string | React.ReactNode;
    icon?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    tabs?: React.ReactNode;
    actions?: React.ReactNode;
    user?: any;
}

export function MobileHeader({
    title,
    icon,
    breadcrumbs,
    tabs,
    actions,
    className,
    user,
    ...props
}: MobileHeaderProps) {
    // Determine title: explicit title > last breadcrumb > fallback
    const displayTitle = title || (breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "Seencel");

    return (
        <div
            className={cn(
                "flex flex-col w-full bg-background border-b border-border/40 md:hidden sticky top-0 z-50",
                // iOS Safe Area: Adds padding-top for Dynamic Island/Notch
                "pt-[env(safe-area-inset-top)]",
                className
            )}
            {...props}
        >
            {/* Row 1: Title + Burger - Standard iOS nav bar height (44pt) + padding */}
            <div className="flex items-center justify-between px-4 h-11 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
                    <h1 className="text-[17px] font-semibold truncate pr-2">
                        {displayTitle}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <MobileNav />
                </div>
            </div>

            {/* Row 2: Tabs (if present) */}
            {tabs && (
                <div className={cn(
                    "w-full overflow-x-auto no-scrollbar bg-background border-t border-border/20 h-10",
                    // Flex container settings for TabList
                    "[&_[role=tablist]]:!flex [&_[role=tablist]]:!flex-nowrap [&_[role=tablist]]:!w-auto [&_[role=tablist]]:!h-full [&_[role=tablist]]:!bg-transparent [&_[role=tablist]]:!p-0 [&_[role=tablist]]:!gap-0",
                    // Tab Trigger Base
                    "[&_[role=tab]]:!relative [&_[role=tab]]:!flex-shrink-0 [&_[role=tab]]:!h-full [&_[role=tab]]:!rounded-none [&_[role=tab]]:!bg-transparent",
                    "[&_[role=tab]]:!px-5 [&_[role=tab]]:!text-sm [&_[role=tab]]:!font-medium [&_[role=tab]]:!text-muted-foreground [&_[role=tab]]:!shadow-none [&_[role=tab]]:!border-b-0 [&_[role=tab]]:!border-transparent",
                    "[&_[role=tab]]:!data-[state=active]:!text-primary [&_[role=tab]]:!data-[state=active]:!bg-transparent",
                    "[&_[role=tab]]:!data-[state=active]:!shadow-none",
                    // Underline
                    "[&_[role=tab]]:after:absolute [&_[role=tab]]:after:bottom-0 [&_[role=tab]]:after:left-0 [&_[role=tab]]:after:right-0",
                    "[&_[role=tab]]:after:h-[2px] [&_[role=tab]]:after:scale-x-0 [&_[role=tab]]:after:bg-primary",
                    "[&_[role=tab]]:after:transition-transform [&_[role=tab]]:after:duration-300",
                    "[&_[role=tab][data-state=active]]:after:scale-x-100",
                    // Gradient
                    "[&_[role=tab]]:before:absolute [&_[role=tab]]:before:inset-0",
                    "[&_[role=tab]]:before:bg-gradient-to-t [&_[role=tab]]:before:from-primary/10 [&_[role=tab]]:before:to-transparent",
                    "[&_[role=tab]]:before:opacity-0 [&_[role=tab]]:before:transition-opacity [&_[role=tab]]:before:duration-300",
                    "[&_[role=tab][data-state=active]]:before:opacity-100"
                )}>
                    {tabs}
                </div>
            )}
        </div>
    );
}


