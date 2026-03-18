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
    /** Optional back button (rendered before breadcrumbs) */
    backButton?: React.ReactNode
}

export function PageHeader({
    breadcrumbs,
    actions,
    tabs,
    className,
    backButton,
    ...props
}: PageHeaderProps) {
    return (
        <div
            className={cn("sticky top-0 z-10 w-full", className)}
            {...props}
        >
            {/* DESKTOP LAYOUT (Hidden on Mobile) */}
            <div className="hidden md:block">
                <div className="px-8 h-[50px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Left: Breadcrumb or Tabs */}
                    <div className="flex items-center gap-0 justify-self-start">
                        {backButton}
                        {tabs ? (
                            <PageHeaderTabs>{tabs}</PageHeaderTabs>
                        ) : (
                            breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;
                                return (
                                    <React.Fragment key={index}>
                                        {index > 0 && (
                                            <span className="text-sm text-muted-foreground/50 mx-2">/</span>
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
                                                "text-sm",
                                                isLast
                                                    ? "font-medium text-foreground truncate max-w-[300px]"
                                                    : "text-muted-foreground"
                                            )}>
                                                {item.label}
                                            </span>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>

                    {/* Center: Tab portal target */}
                    <div id="page-header-tabs" className="flex items-center justify-center" />

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
