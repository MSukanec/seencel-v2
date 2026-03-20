"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { PageHeader, BreadcrumbItem } from "../header/page-header"
import { MobileHeader } from "../mobile/mobile-header"
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";

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

    // Detect active tab by matching pathname
    // Sort by href length (longest first) for most-specific matching
    const sortedTabs = React.useMemo(() =>
        [...tabs].sort((a, b) => b.href.length - a.href.length),
        [tabs]
    );

    const activeTab = React.useMemo(() => {
        const match = sortedTabs.find(t => pathname === t.href || pathname.startsWith(t.href + '/'));
        return match?.value ?? tabs[0]?.value ?? '';
    }, [pathname, sortedTabs, tabs]);

    const handleTabChange = React.useCallback((value: string) => {
        const tab = tabs.find(t => t.value === value);
        if (tab) {
            router.push(tab.href as any);
        }
    }, [tabs, router]);

    return (
        <DetailContentTabs>
            <TabsPrimitive.Root value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    {tabs.map(tab => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            disabled={tab.disabled}
                            className={tab.icon ? "gap-2" : undefined}
                        >
                            {tab.icon}
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </TabsPrimitive.Root>
        </DetailContentTabs>
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

        // Sub-page detection: scan sidebar nav for items with children
        const contextsToSearch: ('organization' | 'admin' | 'settings')[] = (pathname.includes('/settings') && !pathname.includes('/organization'))
            ? ['settings']
            : pathname.includes('/admin')
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

            {/* Route Tabs — portal to header center */}
            {routeTabs && routeTabs.length > 0 && (
                <RouteTabsRenderer tabs={routeTabs} />
            )}

            {/* Content area - flex context for children to fill height */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    )
}

