import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Database } from "lucide-react";

export default function AdminSystemPage() {
    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Admin <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Plataforma</span>
                </span>
            } />

            <Tabs defaultValue="status" className="w-full flex-1 flex flex-col">
                <HeaderPortal>
                    <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                        <TabsTrigger
                            value="status"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span>Estado del Sistema</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="audit"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldIcon className="h-4 w-4" />
                                <span>Auditoría</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="logs"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                <span>Logs</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                <div className="flex-1 bg-muted/5 p-8">
                    <TabsContent value="status" className="m-0 max-w-5xl mx-auto space-y-6">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Activity className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Health Checks</h3>
                            <p className="text-muted-foreground text-sm mt-1">Uptime de base de datos, API y almacenamiento.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="audit" className="m-0 max-w-5xl mx-auto space-y-6">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <ShieldIcon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Logs de Auditoría</h3>
                            <p className="text-muted-foreground text-sm mt-1">Registro inmutable de acciones administrativas.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="m-0 max-w-5xl mx-auto space-y-6">
                        <div className="p-8 border border-dashed rounded-lg bg-background text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Logs de Sistema</h3>
                            <p className="text-muted-foreground text-sm mt-1">Errores de servidor y trazas de stack.</p>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function ShieldIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    )
}
