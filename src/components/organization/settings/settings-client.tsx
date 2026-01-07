"use client";

import { OrganizationSettingsData } from "@/types/organization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTab } from "./members-tab";
import { PermissionsTab } from "./permissions-tab";
import { ActivityTab } from "./activity-tab";
import { BillingTab } from "./billing-tab";
import { FinanceTab } from "./finance-tab";
import { HeaderPortal } from "@/components/layout/header-portal";
import { HeaderTitleUpdater } from "@/components/layout/header-title-updater";

export function SettingsClient({ data }: { data: OrganizationSettingsData }) {
    return (
        <div className="flex flex-col h-full">
            <HeaderTitleUpdater title="Configuración" />

            <Tabs defaultValue="members" className="flex flex-col h-full">
                <HeaderPortal>
                    <TabsList className="bg-transparent border-b rounded-none h-12 w-full justify-start p-0 space-x-6">
                        <TabsTrigger
                            value="members"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Miembros
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Permisos
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Actividad
                        </TabsTrigger>
                        <TabsTrigger
                            value="billing"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Facturación
                        </TabsTrigger>
                        <TabsTrigger
                            value="finance"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 h-12 font-medium"
                        >
                            Finanzas
                        </TabsTrigger>
                    </TabsList>
                </HeaderPortal>

                <div className="flex-1 w-full space-y-6 pt-6">
                    <TabsContent value="members" className="m-0 h-full border-none p-0 outline-none">
                        <MembersTab
                            members={data.members}
                            invitations={data.invitations}
                            roles={data.roles}
                        />
                    </TabsContent>
                    <TabsContent value="permissions" className="m-0 h-full border-none p-0 outline-none">
                        <PermissionsTab
                            roles={data.roles}
                            permissions={data.permissions}
                            rolePermissions={data.rolePermissions}
                        />
                    </TabsContent>
                    <TabsContent value="activity" className="m-0 h-full border-none p-0 outline-none">
                        <ActivityTab logs={data.activityLogs || []} />
                    </TabsContent>
                    <TabsContent value="billing" className="m-0 h-full border-none p-0 outline-none">
                        <BillingTab
                            subscription={data.subscription}
                            billingCycles={data.billingCycles}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
