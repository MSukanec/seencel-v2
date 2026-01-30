import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, HelpCircle } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PurchaseCleanupTool } from "@/features/admin/support/components/purchase-cleanup-tool";
import { TestUserStatusDashboard } from "@/features/admin/support/components/test-user-status-dashboard";
import { SystemErrorsViewer } from "@/features/admin/support/components/system-errors-viewer";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function SupportPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    return (
        <Tabs defaultValue="tickets" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Soporte"
                icon={<MessageCircle />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="tickets"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                <span>Tickets</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="faq"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                <span>FAQ</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="tickets" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="space-y-6">
                            {/* Estado actual del usuario de prueba */}
                            <TestUserStatusDashboard />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Herramienta de Cleanup */}
                                <PurchaseCleanupTool />

                                {/* Visor de errores del sistema */}
                                <SystemErrorsViewer />
                            </div>

                            {/* Placeholder para futuros tickets */}
                            <div className="flex items-center justify-center h-40 border-2 border-dashed border-border rounded-lg">
                                <div className="text-center text-muted-foreground">
                                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Más herramientas de soporte próximamente...</p>
                                </div>
                            </div>
                        </div>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="faq" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                            <div className="text-center text-muted-foreground">
                                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Preguntas Frecuentes</p>
                                <p className="text-sm">Gestiona las FAQ y centro de ayuda</p>
                            </div>
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
