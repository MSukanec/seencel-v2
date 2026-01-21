"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "../navigation/mobile-nav";
import { BreadcrumbItem } from "./page-header";

interface MobileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    breadcrumbs?: BreadcrumbItem[];
    tabs?: React.ReactNode;
    actions?: React.ReactNode;
    user?: any;
}

export function MobileHeader({
    title,
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
                <h1 className="text-[17px] font-semibold truncate pr-2">
                    {displayTitle}
                </h1>
                <div className="flex items-center gap-2">
                    <MobileNav />
                </div>
            </div>

            {/* Row 2: Tabs (if present) */}
            {tabs && (
                <div className="w-full overflow-x-auto px-4 py-2 no-scrollbar bg-background border-t border-border/20">
                    <div className="flex flex-nowrap min-w-max gap-3">
                        {tabs}
                    </div>
                </div>
            )}
        </div>
    );
}

