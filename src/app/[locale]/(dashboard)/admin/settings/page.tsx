import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { Settings, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UIPlaygroundView } from "@/features/admin/views/ui-playground-view";

export default function AdminSettingsPage() {
    return (
        <Tabs defaultValue="ui" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Plantillas"
                icon={<Settings />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="ui"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                <span>UI Playground</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="ui" className="m-0 h-full focus-visible:outline-none overflow-y-auto">
                    <UIPlaygroundView />
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
