import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Shield, Monitor, ToggleLeft, Palette } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { getFeatureFlags, getFlagCategories } from "@/actions/feature-flags";
import { FeatureFlagsManager } from "@/features/admin/components/feature-flags-manager";
import { UIPlaygroundView } from "@/features/admin/views/ui-playground-view";

export default async function AdminSystemPage() {
    const flags = await getFeatureFlags();
    const categories = await getFlagCategories();

    return (
        <Tabs defaultValue="flags" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Plataforma"
                icon={<Monitor />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="flags"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <ToggleLeft className="h-4 w-4" />
                                <span>Feature Flags</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="status"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span>Estado del Sistema</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="audit"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <span>Auditoría</span>
                            </div>
                        </TabsTrigger>
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
                <TabsContent value="flags" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <FeatureFlagsManager initialFlags={flags} categories={categories} />
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="status" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Activity className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Health Checks</h3>
                            <p className="text-muted-foreground text-sm mt-1">Uptime de base de datos, API y almacenamiento.</p>
                        </div>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="audit" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Logs de Auditoría</h3>
                            <p className="text-muted-foreground text-sm mt-1">Registro inmutable de acciones administrativas.</p>
                        </div>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="ui" className="m-0 h-full focus-visible:outline-none overflow-y-auto">
                    <UIPlaygroundView />
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
