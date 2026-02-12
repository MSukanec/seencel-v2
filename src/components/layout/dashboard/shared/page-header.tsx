"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname } from "next/navigation";
import { CurrencyModeSelector } from "@/components/shared/currency-mode-selector";
import { HeaderOrgProjectSelector } from "@/components/layout/dashboard/shared/header-org-project-selector";

export interface BreadcrumbItem {
    label: string | React.ReactNode
    href?: string
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Breadcrumb items - only the LAST item is displayed as page title */
    breadcrumbs: BreadcrumbItem[]
    /** Action buttons on the right */
    actions?: React.ReactNode
    /** Tab navigation (inline with title) */
    tabs?: React.ReactNode
    /** Optional manual icon override */
    icon?: React.ReactElement
    /** Optional back button (rendered before icon) */
    backButton?: React.ReactNode
    /** Desktop toolbar - renders as second row in header */
    toolbar?: React.ReactNode
    /** Hide feedback button (default: false) */
    hideFeedback?: boolean
}

export function PageHeader({
    breadcrumbs,
    actions,
    tabs,
    className,
    children,
    icon,
    backButton,
    toolbar,
    hideFeedback = false,
    ...props
}: PageHeaderProps) {
    const pathname = usePathname();
    const { contexts, getNavItems } = useSidebarNavigation();


    // Helper to find the matching item in all contexts
    const findActiveItem = () => {
        for (const ctx of contexts) {
            const items = getNavItems(ctx.id);
            const match = items.find(item => pathname === item.href);
            if (match) return match;
        }
        return null;
    };

    const activeItem = findActiveItem();
    const ActiveIcon = activeItem?.icon;
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
            <div className="hidden md:block">
                {/* Row 1: Title + Tabs + Actions */}
                <div className="px-8 h-[50px] flex items-center justify-between gap-4">
                    {/* Left: Page Title & Icon & Tabs */}
                    <div className="flex items-center gap-6 h-full">
                        <div className="flex items-center gap-3">
                            {backButton}
                            {icon ? (
                                React.cloneElement(icon as any, {
                                    className: cn("h-5 w-5 text-primary", (icon as any).props?.className)
                                })
                            ) : ActiveIcon ? (
                                <ActiveIcon className="h-5 w-5 text-primary" />
                            ) : null}
                            <h1 className="text-base font-semibold tracking-tight text-foreground">
                                {activeItem?.title || titleItem?.label}
                            </h1>
                        </div>

                        {/* Tabs inline with title - Full Height */}
                        {tabs && (
                            <div className={cn(
                                "flex items-center border-l border-border/50 pl-6 h-full",
                                // FORCE OVERRIDES using !important and direct descendant specific selectors
                                // TabList
                                "[&_[role=tablist]]:!bg-transparent [&_[role=tablist]]:!p-0 [&_[role=tablist]]:!gap-0 [&_[role=tablist]]:!h-full",
                                // TabTrigger - Base
                                "[&_[role=tab]]:!relative [&_[role=tab]]:!h-full [&_[role=tab]]:!rounded-none [&_[role=tab]]:!bg-transparent",
                                "[&_[role=tab]]:!px-6 [&_[role=tab]]:!text-muted-foreground [&_[role=tab]]:!shadow-none [&_[role=tab]]:!border-none",
                                "[&_[role=tab]]:!cursor-pointer",
                                // TabTrigger - Active
                                "[&_[role=tab][data-state=active]]:!text-foreground [&_[role=tab][data-state=active]]:!bg-transparent",
                                "[&_[role=tab][data-state=active]]:!shadow-none",
                                // Pseudo-elements: Line on TOP + gradient going DOWN (short)
                                "[&_[role=tab]]:after:absolute [&_[role=tab]]:after:top-0 [&_[role=tab]]:after:left-0 [&_[role=tab]]:after:right-0",
                                "[&_[role=tab]]:after:h-[2px] [&_[role=tab]]:after:scale-x-0 [&_[role=tab]]:after:bg-primary/80",
                                "[&_[role=tab]]:after:transition-transform [&_[role=tab]]:after:duration-300",
                                "[&_[role=tab][data-state=active]]:after:scale-x-100",
                                // Gradient: from top to bottom, short (60% height)
                                "[&_[role=tab]]:before:absolute [&_[role=tab]]:before:top-0 [&_[role=tab]]:before:left-0 [&_[role=tab]]:before:right-0 [&_[role=tab]]:before:h-[60%]",
                                "[&_[role=tab]]:before:bg-gradient-to-b [&_[role=tab]]:before:from-primary/20 [&_[role=tab]]:before:to-transparent",
                                "[&_[role=tab]]:before:opacity-0 [&_[role=tab]]:before:transition-opacity [&_[role=tab]]:before:duration-300",
                                "[&_[role=tab][data-state=active]]:before:opacity-100"
                            )}>
                                {tabs}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div id="page-header-actions" className="flex items-center gap-2">
                        {/* Org/Project selector + Currency selector */}
                        {(pathname.includes('/organization') || pathname.includes('/organizacion') || pathname.includes('/project') || pathname.includes('/proyecto')) && (
                            <>
                                <HeaderOrgProjectSelector />
                                <CurrencyModeSelector />
                            </>
                        )}
                        {actions}
                    </div>
                </div>

                {/* Row 2: Toolbar Portal Target - Auto-hides when empty */}
                <div
                    id="toolbar-portal-root"
                    className="px-8 py-1.5 empty:hidden empty:p-0"
                />

                {children}
            </div>
        </div>
    )
}
