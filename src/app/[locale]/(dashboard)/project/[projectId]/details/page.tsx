import { ProjectDetailsClient } from "@/features/projects/components/project-details-client";
import { getProjectById } from "@/features/projects/queries";
import { getProjectFiles } from "@/features/projects/file-queries";
import { saveLastActiveProject } from "@/features/projects/actions";
import { notFound } from "next/navigation";
import { PageWrapper } from "@/components/layout/page-wrapper";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface PageProps {
    params: Promise<{
        projectId: string;
        locale: string;
    }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
    const { projectId } = await params;

    const [project, files] = await Promise.all([
        getProjectById(projectId),
        getProjectFiles(projectId)
    ]);

    if (project) {
        await saveLastActiveProject(projectId);
    } else {
        notFound();
    }

    return (
        <Tabs defaultValue="general" className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Información"
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="general" className={tabTriggerClass}>
                            Perfil
                        </TabsTrigger>
                        <TabsTrigger value="location" className={tabTriggerClass}>
                            Ubicación
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <ProjectDetailsClient project={project} />
            </PageWrapper>
        </Tabs>
    );
}
