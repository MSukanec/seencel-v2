"use client";

import { usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PageWrapper, RouteTab } from "@/components/layout";
import { BackButton } from "@/components/shared/back-button";

/**
 * Client layout shell for task detail pages.
 *
 * On task pages (general/recipe list): renders full PageWrapper with
 * task name header, breadcrumb, and tabs.
 *
 * On recipe detail sub-routes (/recipe/[uuid]): renders a minimal
 * PageWrapper without title/header, since the recipe detail page
 * provides its own breadcrumb and header.
 */
export function TaskDetailShell({
    taskName,
    children,
}: {
    taskName: string;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const params = useParams<{ taskId: string }>();
    const taskId = params.taskId;

    // Detect recipe detail routes (/recipe/[uuid] or /receta/[uuid])
    const isRecipeDetail = /\/(recipe|receta)\/[^/]+/.test(pathname);

    const routeTabs: RouteTab[] = useMemo(() => [
        { value: "general", label: "General", href: `/organization/catalog/task/${taskId}` },
        { value: "recipe", label: "Recetas", href: `/organization/catalog/task/${taskId}/recipe` },
    ], [taskId]);

    if (isRecipeDetail) {
        // Minimal shell — no header, no tabs. The recipe detail page
        // renders its own breadcrumb and action button.
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <PageWrapper
            title={taskName}
            backButton={
                <BackButton fallbackHref="/organization/catalog/tasks" />
            }
            parentLabel="Catálogo Técnico"
            routeTabs={routeTabs}
        >
            {children}
        </PageWrapper>
    );
}
