"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname } from "next/navigation";
import { CurrencyModeSelector } from "@/components/shared/currency-mode-selector";
import { HeaderOrgProjectSelector } from "@/components/layout/dashboard/shared/header-org-project-selector";
import { HeaderAvatarButton } from "@/components/layout/dashboard/shared/header-avatar-button";
import { HeaderIconButton } from "@/components/layout/dashboard/shared/header-icon-button";
import { SidebarNotificationsButton } from "@/components/layout/dashboard/sidebar/buttons/sidebar-notifications-button";
import { CalendarDays, Users, BookOpen } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { getDocsSlugForPath } from "@/features/docs/lib/docs-mapping";

export interface BreadcrumbItem {
    label: string | React.ReactNode
    href?: string
}

// ─── Header Docs Button ─────────────────────────────────
// Auto-detects the docs page for the current route.
// Only renders when a matching docs slug exists.

function HeaderDocsButton() {
    const pathname = usePathname();
    const locale = useLocale();
    const docsSlug = getDocsSlugForPath(pathname);

    if (!docsSlug) return null;

    return (
        <a href={`/${locale}/docs/${docsSlug}`} target="_blank" rel="noopener noreferrer">
            <HeaderIconButton title="Documentación">
                <BookOpen className="h-4 w-4" />
            </HeaderIconButton>
        </a>
    );
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
                "sticky top-0 z-10 w-full bg-shell",
                className
            )}
            {...props}
        >
            {/* DESKTOP LAYOUT (Hidden on Mobile) */}
            <div className="hidden md:block">
                {/* Row 1: Title + Tabs (centered) + Actions */}
                <div className="px-8 h-[50px] flex items-center justify-between gap-4 relative">
                    {/* Left: Breadcrumb + Title */}
                    <div className="flex items-center gap-0 h-full">
                        {/* Breadcrumb: Org / Project */}
                        <HeaderOrgProjectSelector />

                        {/* Breadcrumb separator */}
                        <span className="text-sm text-muted-foreground mx-1.5">/</span>

                        <div className="flex items-center gap-1.5">
                            {backButton}
                            <h1 className="text-sm font-medium text-foreground">
                                {activeItem?.title || titleItem?.label}
                            </h1>
                        </div>
                    </div>

                    {/* Center: Tabs — chip style, absolutely centered */}
                    {tabs && (
                        <div className={cn(
                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                            "flex items-center",
                            // Container pill background
                            "[&_[role=tablist]]:!bg-muted/50 [&_[role=tablist]]:!backdrop-blur-sm",
                            "[&_[role=tablist]]:!p-1 [&_[role=tablist]]:!gap-0.5",
                            "[&_[role=tablist]]:!h-auto [&_[role=tablist]]:!items-center",
                            "[&_[role=tablist]]:!rounded-full [&_[role=tablist]]:!border [&_[role=tablist]]:!border-border/30",
                            // TabTrigger - Base: chip style
                            "[&_[role=tab]]:!relative [&_[role=tab]]:!h-auto",
                            "[&_[role=tab]]:!rounded-full",
                            "[&_[role=tab]]:!bg-transparent [&_[role=tab]]:!border-none",
                            "[&_[role=tab]]:!px-4 [&_[role=tab]]:!py-1.5 [&_[role=tab]]:!text-xs [&_[role=tab]]:!font-medium",
                            "[&_[role=tab]]:!text-muted-foreground [&_[role=tab]]:!shadow-none",
                            "[&_[role=tab]]:!cursor-pointer [&_[role=tab]]:!transition-all [&_[role=tab]]:!duration-200",
                            "[&_[role=tab]:hover]:!text-foreground [&_[role=tab]:hover]:!bg-muted/80",
                            // TabTrigger - Active: solid chip
                            "[&_[role=tab][data-state=active]]:!text-foreground [&_[role=tab][data-state=active]]:!bg-background",
                            "[&_[role=tab][data-state=active]]:!shadow-sm",
                        )}>
                            {tabs}
                        </div>
                    )}

                    {/* Right: Quick Access + Actions + Avatar */}
                    <div id="page-header-actions" className="flex items-center gap-1.5">
                        <CurrencyModeSelector />
                        {actions}

                        {/* Quick Access — unified HeaderIconButton */}
                        {/* BLOQUEADO TEMPORALMENTE - Planificador y Equipo */}
                        <HeaderIconButton title="Planificador" className="opacity-40 pointer-events-none">
                            <CalendarDays className="h-4 w-4" />
                        </HeaderIconButton>
                        <HeaderIconButton title="Equipo" className="opacity-40 pointer-events-none">
                            <Users className="h-4 w-4" />
                        </HeaderIconButton>
                        <HeaderDocsButton />
                        <SidebarNotificationsButton variant="header" />

                        {/* User Avatar — always last */}
                        <HeaderAvatarButton />
                    </div>
                </div>

                {/* Row 2 removed — toolbar now renders inline in content */}

                {children}
            </div>
        </div>
    )
}
