"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, ContentLayout } from "@/components/layout";

import { ConstructionTasksView } from "./construction-tasks-view";
import { TasksCatalogView } from "@/features/tasks/views/tasks-catalog-view";
import { ConstructionTaskView } from "../types";
import { TasksByDivision, Unit, TaskDivision, TaskKind } from "@/features/tasks/types";

const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface ConstructionTasksPageViewProps {
    projectId: string;
    organizationId: string;
    tasks: ConstructionTaskView[];
    defaultTab?: string;
    // Catalog data (optional)
    catalogGroupedTasks?: TasksByDivision[];
    catalogUnits?: Unit[];
    catalogDivisions?: TaskDivision[];
    catalogKinds?: TaskKind[];
}

export function ConstructionTasksPageView({
    projectId,
    organizationId,
    tasks,
    defaultTab = "tasks",
    catalogGroupedTasks = [],
    catalogUnits = [],
    catalogDivisions = [],
    catalogKinds = [],
}: ConstructionTasksPageViewProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentTab = searchParams.get("view") || defaultTab;
    const [activeTab, setActiveTab] = useState(currentTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without navigation (shallow)
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", value);
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };

    // Check if catalog data is available
    const hasCatalogData = catalogGroupedTasks.length > 0 || catalogDivisions.length > 0;

    const tabs = (
        <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
            <TabsTrigger value="tasks" className={tabTriggerClass}>Tareas del Proyecto</TabsTrigger>
            {hasCatalogData && (
                <TabsTrigger value="catalog" className={tabTriggerClass}>Catálogo</TabsTrigger>
            )}
        </TabsList>
    );

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Tareas"
                tabs={tabs}
                icon={<ClipboardList />}
            >
                <TabsContent value="tasks" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <ConstructionTasksView
                            projectId={projectId}
                            organizationId={organizationId}
                            tasks={tasks}
                        />
                    </ContentLayout>
                </TabsContent>
                {hasCatalogData && (
                    <TabsContent value="catalog" className="m-0 flex-1 h-full flex flex-col focus-visible:outline-none overflow-hidden">
                        <TasksCatalogView
                            groupedTasks={catalogGroupedTasks}
                            orgId={organizationId}
                            units={catalogUnits}
                            divisions={catalogDivisions}
                            kinds={catalogKinds}
                            isAdminMode={false}
                        />
                    </TabsContent>
                )}
            </PageWrapper>
        </Tabs>
    );
}
