import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, Bug, ScrollText } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportToolsContainer } from "@/features/admin/support/components/support-tools-container";
import { SystemErrorsViewer } from "@/features/admin/support/components/system-errors-viewer";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function MonitoringPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    return (
        <Tabs defaultValue="errors" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Monitoreo"
                icon={<Activity />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
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
                            value="logs"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <ScrollText className="h-4 w-4" />
                                <span>Logs</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
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

                {/* Tab: Logs */}
                <TabsContent value="logs" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <ScrollText className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Logs de Actividad</h3>
                            <p className="text-muted-foreground text-sm mt-1">Registro detallado de acciones y eventos del sistema.</p>
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
