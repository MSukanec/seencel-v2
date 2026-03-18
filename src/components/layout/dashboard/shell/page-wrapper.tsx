"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader, BreadcrumbItem } from "../header/page-header"
import { MobileHeader } from "../mobile/mobile-header"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname } from "@/i18n/routing";

interface PageWrapperProps {
    /** Page title */
    title?: string | React.ReactNode
    /** Tab navigation */
    tabs?: React.ReactNode
    /** Action buttons */
    actions?: React.ReactNode
    /** Page content */
    children: React.ReactNode
    /** Additional className for the wrapper */
    className?: string
    /** Current user for mobile nav context */
    user?: any
    /** Optional icon to override header icon */
    icon?: React.ReactElement
    /** Optional back button for navigation */
    backButton?: React.ReactNode
    /** Parent page label for detail mode breadcrumb (e.g. "Proyectos") */
    parentLabel?: string
    /** Desktop toolbar - renders as second row in header */
    toolbar?: React.ReactNode
}

export function PageWrapper({
    title,
    tabs,
    actions,
    children,
    className,
    user,
    icon,
    backButton,
    parentLabel,
    toolbar,
}: PageWrapperProps) {
    const pathname = usePathname();
    const { getNavGroups } = useSidebarNavigation();

    // ─── Resolve breadcrumbs ─────────────────────────────────
    // Build the breadcrumb array from context, so PageHeader stays dumb.
    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(() => {
        // Detail page mode: "← Parent / Entity"
        if (backButton && parentLabel && title) {
            return [
                { label: parentLabel },
                { label: title },
            ];
        }

        // Sub-page detection: scan sidebar nav for items with children
        const contextsToSearch: ('organization' | 'admin' | 'settings')[] = pathname.includes('/settings')
            ? ['settings']
            : pathname.includes('/admin')
            ? ['admin']
            : ['organization'];

        for (const ctx of contextsToSearch) {
            const groups = getNavGroups(ctx);
            for (const group of groups) {
                for (const item of group.items) {
                    if (item.children && item.children.length > 0) {
                        const matchingChild = item.children.find((child: { href: string }) => pathname === child.href);
                        if (matchingChild) {
                            return [
                                { label: item.title, href: item.href },
                                { label: matchingChild.title },
                            ];
                        }
                        // On the parent page itself — show only parent title
                        if (pathname === item.href) {
                            return [{ label: item.title }];
                        }
                    }
                }
            }
        }

        // Simple title fallback
        if (title) return [{ label: title }];
        return [];
    }, [pathname, title, backButton, parentLabel, getNavGroups]);

    // In detail mode (parentLabel present), tabs go in content, not header
    const headerTabs = parentLabel ? undefined : tabs;

    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {/* Mobile Header: ALWAYS visible */}
            <MobileHeader
                title={title}
                icon={icon}
                tabs={tabs}
                actions={actions}
                user={user}
            />

            {/* Desktop Header */}
            {title && (
                <PageHeader
                    breadcrumbs={breadcrumbs}
                    tabs={headerTabs}
                    actions={actions}
                    backButton={backButton}
                />
            )}

            {/* Content area - flex context for children to fill height */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    )
}
