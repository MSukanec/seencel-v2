import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, Bug, Monitor, ShieldAlert, ToggleLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { getFeatureFlags, getFlagCategories } from "@/actions/feature-flags";
import { FeatureFlagsManager } from "@/features/admin/components/feature-flags-manager";
import { SupportToolsContainer } from "@/features/admin/support/components/support-tools-container";
import { SystemErrorsViewer } from "@/features/admin/support/components/system-errors-viewer";
import { MonitoringDashboardView } from "@/features/admin/support/components/monitoring-dashboard-view";
import { OpsAlertsViewer } from "@/features/admin/support/components/ops-alerts-viewer";

export default async function AdminSystemPage() {
    const flags = await getFeatureFlags();
    const categories = await getFlagCategories();

    return (
        <Tabs defaultValue="panel" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Plataforma"
                icon={<Monitor />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="panel"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span>Panel</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="alerts"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" />
                                <span>Alertas OPS</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="errors"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Errores</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="debug"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Bug className="h-4 w-4" />
                                <span>Debug</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="flags"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <ToggleLeft className="h-4 w-4" />
                                <span>Feature Flags</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                {/* Tab: Panel de Control (ex Monitoreo) */}
                <TabsContent value="panel" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <MonitoringDashboardView />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Alertas OPS */}
                <TabsContent value="alerts" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <OpsAlertsViewer />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Errores del Sistema */}
                <TabsContent value="errors" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <SystemErrorsViewer />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Herramientas de Debug */}
                <TabsContent value="debug" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <SupportToolsContainer />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Feature Flags (último) */}
                <TabsContent value="flags" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <FeatureFlagsManager initialFlags={flags} categories={categories} />
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
