"use client";

import { useLayoutStore } from "@/stores/layout-store";
import { TabsContent } from "@/components/ui/tabs";
import { ProjectProfileView } from "./project-profile-view";
import { ProjectLocationView } from "./project-location-view";
import { useEffect } from "react";
import { ContentLayout } from "@/components/layout";

export function ProjectDetailPage({ project }: { project: any }) {
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
                        <ProjectProfileView project={project} projectTypes={[]} projectModalities={[]} />
                    </div>
                </ContentLayout>
            </TabsContent>

            <TabsContent value="location" className="m-0 h-full focus-visible:outline-none p-0 outline-none ring-0">
                <ContentLayout variant="full">
                    <ProjectLocationView project={project} />
                </ContentLayout>
            </TabsContent>
        </>
    );
}

