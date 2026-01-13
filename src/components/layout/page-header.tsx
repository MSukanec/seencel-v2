"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProjectSelectorWrapper } from "@/components/layout/project-selector-wrapper";


export interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Breadcrumb items - only the LAST item is displayed as page title */
    breadcrumbs: BreadcrumbItem[]
    /** Action buttons on the right */
    actions?: React.ReactNode
    /** Tab navigation below the title */
    tabs?: React.ReactNode
}

import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname } from "next/navigation"; // Standard Next for checking path
import { useLayoutStore } from "@/store/layout-store"; // If needed for mobile nav trigger

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Breadcrumb items - only the LAST item is displayed as page title */
    breadcrumbs: BreadcrumbItem[]
    /** Action buttons on the right */
    actions?: React.ReactNode
    /** Tab navigation below the title */
    tabs?: React.ReactNode
    /** User profile for mobile nav */
    // We might need to pass User here or fetch it. Since this is client component, we might need context or props.
    // Ideally PageHeader shouldn't deal with fetch. For now let's assume we can rely on what we have.
}

export function PageHeader({
    breadcrumbs,
    actions,
    tabs,
    className,
    children,
    ...props
}: PageHeaderProps) {
    const pathname = usePathname();
    const { contexts, getNavItems } = useSidebarNavigation();

    // 1. Resolve Desktop Icon
    // Helper to find the matching item in all contexts
    const findActiveItem = () => {
        for (const ctx of contexts) {
            const items = getNavItems(ctx.id);
            const match = items.find(item => pathname === item.href);
            if (match) return match;
        }
        return null; // Fallback
    };

    const activeItem = findActiveItem();
    const PageIcon = activeItem?.icon;
    const titleItem = breadcrumbs[breadcrumbs.length - 1];

    return (
        <div
            className={cn(
                "sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
                className
            )}
            {...props}
        >
            {/* DESKTOP LAYOUT (Hidden on Mobile) */}
            <div className="hidden md:block px-8 pt-2 pb-0">
                <div className="flex items-center justify-between gap-4">
                    {/* Page Title & Icon */}
                    <div className="flex items-center gap-3">
                        {PageIcon && (
                            <PageIcon className="h-6 w-6 text-primary" />
                        )}
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {/* Prefer activeItem title if it matches user intent of 'sidebar title', else breadcrumb */}
                            {activeItem?.title || titleItem?.label}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <ProjectSelectorWrapper />

                        {/* Actions */}
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Tabs */}
                {tabs && (
                    <div className="-mb-[2px] mt-2">
                        {tabs}
                    </div>
                )}

                {children}
            </div>
        </div>
    )
}
