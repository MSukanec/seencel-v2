"use client";

import { RouteTab } from "@/components/layout";
import { DetailContentTabs } from "@/components/shared/detail-content-tabs";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import { Settings, ScrollText } from "lucide-react";

// ─── Tab Config ─────────────────────────────────────
function useTaskDetailTabs(): RouteTab[] {
    const params = useParams<{ taskId: string }>();
    const taskId = params.taskId;

    return useMemo(() => [
        {
            value: "general",
            label: "General",
            href: `/organization/catalog/task/${taskId}` as any,
            icon: <Settings className="h-3.5 w-3.5" />,
        },
        {
            value: "recipe",
            label: "Recetas",
            href: `/organization/catalog/task/${taskId}/recipe` as any,
            icon: <ScrollText className="h-3.5 w-3.5" />,
        },
    ], [taskId]);
}

// ─── Tabs Renderer (portals to header center) ───────
export function TaskDetailTabs() {
    const pathname = usePathname();
    const router = useRouter();
    const tabs = useTaskDetailTabs();

    const activeTab = useMemo(() => {
        const isRecipe = pathname.endsWith('/recipe') || pathname.endsWith('/receta');
        return isRecipe ? 'recipe' : 'general';
    }, [pathname]);

    // Hide tabs when viewing a specific recipe detail (/recipe/[recipeId])
    const isRecipeDetail = useMemo(() => {
        return /\/(recipe|receta)\/[^/]+/.test(pathname);
    }, [pathname]);

    if (isRecipeDetail) return null;

    const handleTabChange = useCallback((value: string) => {
        const tab = tabs.find(t => t.value === value);
        if (tab) {
            router.push(tab.href as any);
        }
    }, [router, tabs]);

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
