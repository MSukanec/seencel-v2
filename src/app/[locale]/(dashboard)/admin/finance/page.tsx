import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, FileText, PieChart } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

export default function AdminFinancePage() {
    return (
        <Tabs defaultValue="subscriptions" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Finanzas"
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="subscriptions"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                <span>Suscripciones</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="invoices"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Facturación</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="plans"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <PieChart className="h-4 w-4" />
                                <span>Planes</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value="subscriptions" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Suscripciones Activas</h3>
                            <p className="text-muted-foreground text-sm mt-1">Monitor de MRR/ARR y estado de suscripciones.</p>
                        </div>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="invoices" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Historial de Facturas</h3>
                            <p className="text-muted-foreground text-sm mt-1">Registro de todas las transacciones generadas.</p>
                        </div>
                    </ContentLayout>
                </TabsContent>

                <TabsContent value="plans" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <PieChart className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Planes de Precios</h3>
                            <p className="text-muted-foreground text-sm mt-1">Configuración de Tiers (Free, Pro, Enterprise).</p>
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
