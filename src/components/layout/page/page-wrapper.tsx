"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader, BreadcrumbItem } from "../dashboard/header/page-header"
import { MobileHeader } from "../dashboard/mobile/mobile-header"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSelectedLayoutSegment } from "next/navigation";

// ─── Route Tab Type ─────────────────────────────────────
export interface RouteTab {
    /** Unique tab identifier */
    value: string
    /** Display label */
    label: string
    /** Route href (without locale prefix) */
    href: string
    /** Optional icon */
    icon?: React.ReactElement
    /** Disabled state */
    disabled?: boolean
}

// ─── Route Tabs Renderer (internal) ─────────────────────
function RouteTabsRenderer({ tabs }: { tabs: RouteTab[] }) {
    const pathname = usePathname();
    const router = useRouter();
    const segment = useSelectedLayoutSegment();

    // Detect active tab 
    const sortedTabs = React.useMemo(() =>
        [...tabs].sort((a, b) => b.href.length - a.href.length),
        [tabs]
    );

    const activeValue = React.useMemo(() => {
        // Priority 1: Match by Next.js unlocalized physical segment (bulletproof for i18n dynamic routes)
        if (segment) {
            const segmentMatch = tabs.find(t => 
                t.value === segment || 
                t.href.endsWith(`/${segment}`)
            );
            if (segmentMatch) return segmentMatch.value;
        }

        // Priority 2: In root layout (segment is null), usually the first tab is the default index
        if (!segment && tabs.length > 0) {
            // Priority 3 will handle this safely if the exact pathname matches, but segment=null is a strong signal for base path
        }

        // Priority 3: Fallback logic using next-intl pathname (can be flaky on deeply dynamic translated routes)
        const match = sortedTabs.find(t => pathname === t.href || pathname.startsWith(t.href + '/'));
        
        // If segment is null and no other match, default to first tab safely
        return match?.value ?? (!segment ? tabs[0]?.value : '') ?? tabs[0]?.value ?? '';
    }, [pathname, sortedTabs, tabs, segment]);

    return (
        <div role="tablist">
            {tabs.map(tab => (
                <button
                    key={tab.value}
                    role="tab"
                    data-state={activeValue === tab.value ? "active" : "inactive"}
                    onClick={() => router.push(tab.href as any)}
                    disabled={tab.disabled}
                    className={cn(
                        tab.disabled && "opacity-50 cursor-not-allowed",
                        tab.icon && "gap-1.5"
                    )}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ─── Page Wrapper ───────────────────────────────────────

interface PageWrapperProps {
    /** Page title */
    title?: string | React.ReactNode
    /** Tab navigation (legacy: raw ReactNode) */
    tabs?: React.ReactNode
    /** Route-based tabs — declarative config. Renders tabs in header automatically. */
    routeTabs?: RouteTab[]
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
    routeTabs,
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

        // Sub-page detection: scan sidebar nav for items with children (or flat items)
        const contextsToSearch: ('organization' | 'admin' | 'settings')[] = pathname.startsWith('/settings')
            ? ['settings']
            : pathname.startsWith('/admin')
            ? ['admin']
            : ['organization'];

        for (const ctx of contextsToSearch) {
            const groups = getNavGroups(ctx);
            for (const group of groups) {
                for (const item of group.items) {
                    if (item.children && item.children.length > 0) {
                        // Find the matching child by exact match OR longest prefix match
                        const sortedChildren = [...item.children].sort((a, b) => b.href.length - a.href.length);
                        const matchingChild = sortedChildren.find((child: { href: string }) => 
                            pathname === child.href || pathname.startsWith(child.href + '/')
                        );
                        if (matchingChild) {
                            return [
                                { label: item.title, href: item.href },
                                { label: matchingChild.title },
                            ];
                        }
                        // On the parent page itself
                        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
                            return [{ label: item.title }];
                        }
                    } else {
                        // FLAT ITEM: No children (e.g., Settings sections)
                        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
                            // If a root layout title was passed (e.g. "Configuración") and it's different from the item title, prepend it
                            if (title && title !== item.title) {
                                return [
                                    { label: title },
                                    { label: item.title }
                                ];
                            }
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
                    icon={icon}
                    routeTabs={routeTabs && routeTabs.length > 0 ? <RouteTabsRenderer tabs={routeTabs} /> : undefined}
                />
            )}

            {/* Content area - flex context for children to fill height */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    )
}

