import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building } from "lucide-react";
import { getAdminUsers, getAdminOrganizations } from "@/features/admin/queries";
import { UsersTable } from "@/features/admin/components/users-table";
import { OrganizationsTable } from "@/features/admin/components/organizations-table";

export default async function AdminDirectoryPage() {
    const [users, organizations] = await Promise.all([
        getAdminUsers(),
        getAdminOrganizations()
    ]);

    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title={
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Admin <span className="text-muted-foreground/40">/</span> <span className="text-foreground font-medium">Directorio</span>
                </span>
            } />

            <Tabs defaultValue="users" className="w-full flex-1 flex flex-col">
                <HeaderPortal>
                    <TabsList className="h-full bg-transparent p-0 gap-6 flex items-end">
                        <TabsTrigger
                            value="users"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Usuarios</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="organizations"
                            className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>Organizaciones</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                <div className="flex-1 bg-muted/5 p-8">
                    <TabsContent value="users" className="m-0 space-y-6">
                        <UsersTable users={users} />
                    </TabsContent>

                    <TabsContent value="organizations" className="m-0 space-y-6">
                        <OrganizationsTable organizations={organizations} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
