"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
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
        <div className={cn("flex flex-col w-full bg-background border-b border-border/40 md:hidden sticky top-0 z-50", className)} {...props}>
            {/* Row 1: Title + Burger */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/40 bg-background/95 backdrop-blur-sm">
                <h1 className="text-lg font-semibold truncate pr-2">
                    {displayTitle}
                </h1>
                <div className="flex items-center gap-2">
                    {/* Mobile Actions could go here, but usually just the menu */}
                    <MobileNav user={user} />
                </div>
            </div>

            {/* Row 2: Chips (Tabs) */}
            {tabs && (
                <div className="w-full overflow-x-auto px-4 py-3 no-scrollbar bg-background">
                    <div className="flex flex-nowrap min-w-max">
                        {tabs}
                    </div>
                </div>
            )}
        </div>
    );
}
