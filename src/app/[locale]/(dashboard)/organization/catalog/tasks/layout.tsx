"use client";

import { RouteTab } from "@/components/layout";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { usePathname, useRouter } from "@/i18n/routing";
import { useMemo, useCallback } from "react";
import { ClipboardList, FolderTree } from "lucide-react";

// ─── Tab Config ─────────────────────────────────────
const TASK_CATALOG_TABS: RouteTab[] = [
    {
        value: "tasks",
        label: "Tareas",
        href: "/organization/catalog/tasks",
        icon: <ClipboardList className="h-3.5 w-3.5" />,
    },
    {
        value: "divisions",
        label: "Rubros",
        href: "/organization/catalog/tasks/divisions",
        icon: <FolderTree className="h-3.5 w-3.5" />,
    },
];

// ─── Tabs Renderer (portals to header center) ───────
function TaskCatalogTabs() {
    const pathname = usePathname();
    const router = useRouter();

    const activeTab = useMemo(() => {
        // Sort by href length (longest first) for most-specific matching
        const sorted = [...TASK_CATALOG_TABS].sort((a, b) => b.href.length - a.href.length);
        const match = sorted.find(t => pathname === t.href || pathname.startsWith(t.href + '/'));
        return match?.value ?? TASK_CATALOG_TABS[0]?.value ?? '';
    }, [pathname]);

    const handleTabChange = useCallback((value: string) => {
        const tab = TASK_CATALOG_TABS.find(t => t.value === value);
        if (tab) {
            router.push(tab.href as any);
        }
    }, [router]);

    return (
        <DetailContentTabs>
            <TabsPrimitive.Root value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    {TASK_CATALOG_TABS.map(tab => (
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

// ─── Layout ─────────────────────────────────────────
export default function TasksCatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <TaskCatalogTabs />
            {children}
        </>
    );
}
