"use client";

import { HeaderPortal } from "@/components/layout/header-portal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectGalleryTab } from "./project-gallery-tab";

export function ProjectFilesClient({ files }: { files: any[] }) {
    return (
        <Tabs defaultValue="gallery" className="w-full flex-1 flex flex-col">
            <HeaderPortal>
                <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                    <TabsTrigger
                        value="gallery"
                        className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                    >
                        Galería
                    </TabsTrigger>
                    {/* Future: Documents, Plans, etc. */}
                </TabsList>
            </HeaderPortal>

            <div className="flex-1 bg-muted/5 p-8">
                <TabsContent value="gallery" className="m-0 h-full">
                    <ProjectGalleryTab files={files} />
                </TabsContent>
            </div>
        </Tabs>
    );
}
