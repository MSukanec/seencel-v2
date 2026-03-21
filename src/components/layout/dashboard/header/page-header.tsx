"use client";

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Link } from "@/i18n/routing";
import { PageHeaderButton } from "./page-header-button";
import { PageHeaderTabs } from "./page-header-tabs";
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
import { usePathname } from "@/i18n/routing";

export interface BreadcrumbItem {
    label: string | React.ReactNode
    href?: string
}

// ─── Action Portal ─────────────────────────────────
// Renders children into #page-header-actions via React portal.
export function PageHeaderActionPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const portalRoot = document.getElementById("page-header-actions");
    if (!portalRoot) return null;
    return createPortal(children, portalRoot);
}

// ─── Tabs Portal ─────────────────────────────────
// Renders tab content into #page-header-tabs via React portal.
// Use for pages that don't own a PageWrapper (e.g. settings sub-pages).
export function PageHeaderTabsPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const portalRoot = document.getElementById("page-header-tabs");
    if (!portalRoot) return null;
    return createPortal(
        <PageHeaderTabs>{children}</PageHeaderTabs>,
        portalRoot
    );
}

// ─── Header More Button (private) ─────────────────────────
function HeaderMoreButton() {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();
    const docsSlug = getDocsSlugForPath(pathname);
    const { pushOverlay, hasOverlay } = useContextSidebarOverlay();
    const { openPanel } = usePanel();

    const itemClass = "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-secondary cursor-pointer w-full text-left";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <PageHeaderButton title="Más opciones" active={open}>
                    <MoreHorizontal className="h-4 w-4" />
                </PageHeaderButton>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" sideOffset={4} className="w-[180px] p-1">
                {docsSlug && (
                    <button onClick={() => { setOpen(false); if (!hasOverlay) pushOverlay(<DocsInlinePanel slug={docsSlug} />, { title: "Documentación" }); }} className={itemClass}>
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Documentación
                    </button>
                )}
                <button onClick={() => { setOpen(false); openPanel('feedback-form'); }} className={itemClass}>
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    Reportar un Problema
                </button>
            </PopoverContent>
        </Popover>
    );
}

// ─── Page Header ─────────────────────────────────
// Pure renderer. Receives breadcrumbs already resolved.
// Does NOT auto-detect context — that's the caller's job.

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Breadcrumb items — rendered as: label1 / label2 / ... / labelN (last is bold) */
    breadcrumbs: BreadcrumbItem[]
    /** Action buttons on the right */
    actions?: React.ReactNode
    /** Tab navigation (replaces breadcrumbs in the left zone) */
    tabs?: React.ReactNode
    /** Route-based tabs — rendered as second line in header */
    routeTabs?: React.ReactNode
    /** Optional back button (rendered before breadcrumbs) */
    backButton?: React.ReactNode
    /** Optional page icon — rendered before the title with primary color */
    icon?: React.ReactElement
}

export function PageHeader({
    breadcrumbs,
    actions,
    tabs,
    routeTabs,
    className,
    backButton,
    icon,
    ...props
}: PageHeaderProps) {
    return (
        <div
            className={cn("sticky top-0 z-10 w-full", className)}
            {...props}
        >
            {/* DESKTOP LAYOUT (Hidden on Mobile) */}
            <div className="hidden md:block relative">
                <div className="px-8 h-[50px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Left: Breadcrumb or Tabs */}
                    <div className="flex items-center gap-2 justify-self-start">
                        {backButton}
                        {tabs ? (
                            <PageHeaderTabs>{tabs}</PageHeaderTabs>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                {/* Page icon */}
                                {icon && (
                                    <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">
                                        {icon}
                                    </span>
                                )}
                                {breadcrumbs.map((item, index) => {
                                    const isLast = index === breadcrumbs.length - 1;
                                    return (
                                        <React.Fragment key={index}>
                                            {index > 0 && (
                                                <span className="text-sm text-muted-foreground/50">/</span>
                                            )}
                                            {item.href && !isLast ? (
                                                <Link
                                                    href={item.href as any}
                                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className={cn(
                                                    "text-sm truncate max-w-[300px]",
                                                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Center: Portal target for content tabs + Route Tabs */}
                    <div id="page-header-tabs" className="flex items-start justify-center h-full pt-0">
                        {/* Route Tabs — Notch design: extends from header top into header body */}
                        {routeTabs && (
                            <div 
                                className="flex items-start relative z-10"
                                style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3)) drop-shadow(0px 1px 1px rgba(0,0,0,0.2))" }}
                            >
                                {/* Left inverted corner */}
                                <div 
                                    className="w-3 h-3 relative"
                                    style={{
                                        background: 'radial-gradient(circle at 0% 100%, transparent 11.5px, var(--shell) 12px)'
                                    }}
                                />
                                
                                {/* Notch Body */}
                                <div className="bg-shell px-2 pb-1.5 pt-1 rounded-b-xl flex items-center justify-center -mx-[0.5px]">
                                    <PageHeaderTabs>{routeTabs}</PageHeaderTabs>
                                </div>
                                
                                {/* Right inverted corner */}
                                <div 
                                    className="w-3 h-3 relative"
                                    style={{
                                        background: 'radial-gradient(circle at 100% 100%, transparent 11.5px, var(--shell) 12px)'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div id="page-header-actions" className="flex items-center gap-1.5 justify-self-end">
                        {actions}
                        <HeaderMoreButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
