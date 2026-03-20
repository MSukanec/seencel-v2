"use client";

import { usePathname } from "@/i18n/routing";
import { PageWrapper } from "@/components/layout";
import { BackButton } from "@/components/shared/back-button";
import { TaskDetailTabs } from "./task-detail-tabs";

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

    // Detect recipe detail routes (/recipe/[uuid] or /receta/[uuid])
    const isRecipeDetail = /\/(recipe|receta)\/[^/]+/.test(pathname);

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
        >
            <TaskDetailTabs />
            {children}
        </PageWrapper>
    );
}
