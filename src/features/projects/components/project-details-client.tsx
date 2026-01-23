"use client";

import { useLayoutStore } from "@/store/layout-store";
import { TabsContent } from "@/components/ui/tabs";
import { ProjectProfileTab } from "./project-profile-tab";
import { ProjectLocationTab } from "./project-location-tab";
import { useEffect } from "react";
import { ContentLayout } from "@/components/layout";

export function ProjectDetailsClient({ project }: { project: any }) {
    const { actions } = useLayoutStore();

    useEffect(() => {
        actions.setActiveContext('project');
        actions.setActiveProjectId(project.id);
    }, [project.id, actions]);

    return (
        <>
            <TabsContent value="general" className="m-0 h-full focus-visible:outline-none p-0 outline-none ring-0">
                <ContentLayout variant="narrow">
                    <div className="space-y-6">
                        <ProjectProfileTab project={project} />
                    </div>
                </ContentLayout>
            </TabsContent>

            <TabsContent value="location" className="m-0 h-full focus-visible:outline-none p-0 outline-none ring-0">
                <ContentLayout variant="full">
                    <ProjectLocationTab project={project} />
                </ContentLayout>
            </TabsContent>
        </>
    );
}

