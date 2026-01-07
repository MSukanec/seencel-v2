"use client";

import { useLayoutStore } from "@/store/layout-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderPortal } from "@/components/layout/header-portal";
import { ProjectProfileTab } from "./project-profile-tab";
import { ProjectLocationTab } from "./project-location-tab";
import { useEffect } from "react";

// Assuming types
interface ProjectData {
    id: string;
    // ...
}

export function ProjectDetailsClient({ project }: { project: any }) {
    const { actions } = useLayoutStore();

    useEffect(() => {
        // Ensure context is set if landing directly here
        actions.setActiveContext('project');
        actions.setActiveProjectId(project.id);
    }, [project.id, actions]);

    return (
        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col">
            <HeaderPortal>
                {/* Tabs portalled up to Global Header */}
                <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                    <TabsTrigger
                        value="general"
                        className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                    >
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger
                        value="location"
                        className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                    >
                        Ubicación
                    </TabsTrigger>
                </TabsList>
            </HeaderPortal>

            {/* Content Areas */}
            <div className="flex-1 bg-muted/5 p-0">
                <TabsContent value="general" className="m-0 mt-8 max-w-4xl space-y-6 px-8">
                    <ProjectProfileTab project={project} />
                </TabsContent>

                <TabsContent value="location" className="m-0 flex-1 h-full min-h-[600px]">
                    <ProjectLocationTab project={project} />
                </TabsContent>
            </div>
        </Tabs>
    );
}
