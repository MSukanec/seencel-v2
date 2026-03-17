"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname, Link } from "@/i18n/routing";
import { CurrencyModeSelector } from "@/components/shared/currency-mode-selector";
import { HeaderIconButton } from "@/components/layout/dashboard/shared/header-icon-button";
import { MoreHorizontal, BookOpen, Sparkles } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { getDocsSlugForPath } from "@/features/docs/lib/docs-mapping";
import { useContextSidebarOverlay } from "@/stores/sidebar-store";
import { DocsInlinePanel } from "@/features/docs/components/docs-inline-panel";
import { usePanel } from "@/stores/panel-store";

export interface BreadcrumbItem {
    label: string | React.ReactNode
    href?: string
}

// ─── Header More Button ─────────────────────────────────
// "..." button in the header actions area.
// Popover with contextual options:
//   - Documentación (only when docs exist for current route)
//   - Reportar un Problema (opens feedback panel)

function HeaderMoreButton() {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();
    const docsSlug = getDocsSlugForPath(pathname);
    const { pushOverlay, hasOverlay } = useContextSidebarOverlay();
    const { openPanel } = usePanel();

    const itemClass = "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-secondary cursor-pointer w-full text-left";

    const handleDocs = () => {
        setOpen(false);
        if (hasOverlay) return;
        pushOverlay(
            <DocsInlinePanel slug={docsSlug!} />,
            { title: "Documentación" }
        );
    };

    const handleFeedback = () => {
        setOpen(false);
        openPanel('feedback-form');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <HeaderIconButton title="Más opciones" active={open}>
                    <MoreHorizontal className="h-4 w-4" />
                </HeaderIconButton>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={4}
                className="w-[180px] p-1"
            >
                {docsSlug && (
                    <button onClick={handleDocs} className={itemClass}>
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Documentación
                    </button>
                )}
                <button onClick={handleFeedback} className={itemClass}>
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    Reportar un Problema
                </button>
            </PopoverContent>
        </Popover>
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
    /** Label for the parent page in detail mode (e.g. "Proyectos") */
    parentLabel?: string
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
    parentLabel,
    toolbar,
    hideFeedback = false,
    ...props
}: PageHeaderProps) {
    const pathname = usePathname();
    const { contexts, getNavItems, getNavGroups } = useSidebarNavigation();


    // Helper to find the matching item in all contexts
    const findActiveItem = () => {
        // Settings context is NOT in ALL_CONTEXTS (it's a separate portal),
        // so we search it explicitly when the pathname matches
        if (pathname.includes('/settings')) {
            const settingsItems = getNavItems('settings');
            const match = settingsItems.find(item => pathname === item.href);
            if (match) return match;
        }
        for (const ctx of contexts) {
            const items = getNavItems(ctx.id);
            const match = items.find(item => pathname === item.href);
            if (match) return match;
        }
        return null;
    };

    // Detect if current page is a sub-page of a nav item with children
    const findSubPageInfo = () => {
        // Determine which contexts to search
        const contextsToSearch: ('organization' | 'admin' | 'settings')[] = pathname.includes('/settings')
            ? ['settings']
            : ['organization'];

        for (const ctx of contextsToSearch) {
            const groups = getNavGroups(ctx);
            for (const group of groups) {
                for (const item of group.items) {
                    if (item.children && item.children.length > 0) {
                        const matchingChild = item.children.find((child: { href: string }) => pathname === child.href);
                        if (matchingChild) {
                            return { parentTitle: item.title, parentHref: item.href, childTitle: matchingChild.title, isParentPage: false };
                        }
                        // Check if we're on the parent page itself
                        if (pathname === item.href) {
                            return { parentTitle: item.title, parentHref: item.href, childTitle: item.children[0]?.title || '', isParentPage: true };
                        }
                    }
                }
            }
        }
        return null;
    };

    const subPageInfo = findSubPageInfo();

    // Fallback: find active item for pages without sub-items
    const activeItem = !subPageInfo ? findActiveItem() : null;
    const titleItem = breadcrumbs[breadcrumbs.length - 1];

    return (
        <div
            className={cn(
                "sticky top-0 z-10 w-full",
                className
            )}
            {...props}
        >
            {/* DESKTOP LAYOUT (Hidden on Mobile) */}
            <div className="hidden md:block">
                {/* Row 1: Breadcrumb (left) | Command Bar (center) | Actions (right) */}
                <div className="px-8 h-[50px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Left: Breadcrumb */}
                    <div className="flex items-center gap-0 justify-self-start">
                        {backButton && parentLabel ? (
                            /* Detail page mode: ← Parent / Entity */
                            <div className="flex items-center gap-0">
                                {backButton}
                                <span className="text-sm text-muted-foreground">
                                    {parentLabel}
                                </span>
                                <span className="text-sm text-muted-foreground/50 mx-2">/</span>
                                <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
                                    {titleItem?.label}
                                </span>
                            </div>
                        ) : subPageInfo ? (
                            <>
                                {/* Parent page name — clickable link to Visión General */}
                                <Link 
                                    href={subPageInfo.parentHref as any} 
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {subPageInfo.parentTitle}
                                </Link>
                                {!subPageInfo.isParentPage && (
                                    <>
                                        <span className="text-sm text-muted-foreground/50 mx-2">/</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {subPageInfo.childTitle}
                                        </span>
                                    </>
                                )}
                            </>
                        ) : tabs ? (
                            <div className={cn(
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
                        ) : activeItem && titleItem?.label && titleItem.label !== activeItem.title ? (
                            /* activeItem found in a different context (e.g. Settings portal) — breadcrumb */
                            <>
                                <span className="text-sm text-muted-foreground">
                                    {titleItem.label}
                                </span>
                                <span className="text-sm text-muted-foreground/50 mx-2">/</span>
                                <span className="text-sm font-medium text-foreground">
                                    {activeItem.title}
                                </span>
                            </>
                        ) : (
                            /* No sub-page, no tabs — show simple title */
                            <h1 className="text-sm font-medium text-foreground">
                                {activeItem?.title || titleItem?.label}
                            </h1>
                        )}
                    </div>

                    {/* Center: Tab portal target */}
                    <div id="page-header-tabs" className="flex items-center justify-center" />

                    {/* Right: Actions */}
                    <div id="page-header-actions" className="flex items-center gap-1.5 justify-self-end">
                        <CurrencyModeSelector />
                        {actions}
                        <HeaderMoreButton />
                    </div>
                </div>

                {/* Row 2 removed — toolbar now renders inline in content */}

                {children}
            </div>
        </div>
    )
}
