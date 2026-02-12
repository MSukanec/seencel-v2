import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building } from "lucide-react";
import { getAdminUsers, getAdminOrganizations } from "@/features/admin/queries";
import { UsersTable } from "@/features/admin/components/users-table";
import { OrganizationsTable } from "@/features/admin/components/organizations-table";
import { PageWrapper } from "@/components/layout";
import { ContentLayout } from "@/components/layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Directorio | Admin | SEENCEL",
        description: "Gestión de usuarios y organizaciones del sistema",
        robots: "noindex, nofollow",
    };
}

export default async function AdminDirectoryPage() {
    try {
        const [users, organizations] = await Promise.all([
            getAdminUsers(),
            getAdminOrganizations()
        ]);

        return (
            <Tabs defaultValue="users" className="w-full h-full flex flex-col">
                <PageWrapper
                    type="page"
                    title="Directorio"
                    icon={<Users />}
                    tabs={
                        <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                            <TabsTrigger
                                value="users"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Usuarios</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="organizations"
                                className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span>Organizaciones</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    }
                >
                    <TabsContent value="users" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <UsersTable users={users} />
                        </ContentLayout>
                    </TabsContent>

                    <TabsContent value="organizations" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                        <ContentLayout variant="wide">
                            <OrganizationsTable organizations={organizations} />
                        </ContentLayout>
                    </TabsContent>
                </PageWrapper>
            </Tabs>
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar el directorio"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
