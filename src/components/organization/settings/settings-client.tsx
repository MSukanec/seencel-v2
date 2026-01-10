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

interface SettingsClientProps {
    data: OrganizationSettingsData;
    initialTab?: string;
    organizationId: string;
}

export function SettingsClient({ data, initialTab = "members", organizationId }: SettingsClientProps) {
    return (
        <div className="flex flex-col h-full relative">
            <HeaderTitleUpdater title="Configuración" />

            <Tabs defaultValue={initialTab} className="w-full flex-1 flex flex-col overflow-hidden">
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

                <TabsContent value="members" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
                    <div className="space-y-6 pb-6">
                        <MembersTab
                            members={data.members}
                            invitations={data.invitations}
                            roles={data.roles}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="permissions" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
                    <div className="space-y-6 pb-6">
                        <PermissionsTab
                            roles={data.roles}
                            permissions={data.permissions}
                            rolePermissions={data.rolePermissions}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="activity" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
                    <div className="space-y-6 pb-6">
                        <ActivityTab logs={data.activityLogs || []} />
                    </div>
                </TabsContent>
                <TabsContent value="billing" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
                    <div className="space-y-6 pb-6">
                        <BillingTab
                            subscription={data.subscription}
                            billingCycles={data.billingCycles}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="finance" className="mt-6 flex-1 focus-visible:outline-none relative min-h-0 overflow-auto">
                    <div className="space-y-6 pb-6">
                        <FinanceTab
                            organizationId={organizationId}
                            preferences={data.preferences}
                            orgCurrencies={data.contactCurrencies}
                            orgWallets={data.contactWallets}
                            availableCurrencies={data.availableCurrencies}
                            availableWallets={data.availableWallets}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
