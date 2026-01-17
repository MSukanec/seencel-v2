"use client";

import { OrganizationSettingsData } from "@/types/organization";
import { TabsContent } from "@/components/ui/tabs";
import { MembersTab } from "./members-tab";
import { PermissionsTab } from "./permissions-tab";
import { ActivityTab } from "./activity-tab";
import { BillingTab } from "./billing-tab";
import { FinanceTab } from "./finance-tab";

interface SettingsClientProps {
    data: OrganizationSettingsData;
    organizationId: string;
}

export function SettingsClient({ data, organizationId }: SettingsClientProps) {
    return (
        <>
            <TabsContent value="members" className="m-0 h-full focus-visible:outline-none">
                <MembersTab
                    members={data.members}
                    invitations={data.invitations}
                    roles={data.roles}
                />
            </TabsContent>
            <TabsContent value="permissions" className="m-0 h-full focus-visible:outline-none">
                <PermissionsTab
                    roles={data.roles}
                    permissions={data.permissions}
                    rolePermissions={data.rolePermissions}
                />
            </TabsContent>
            <TabsContent value="activity" className="m-0 h-full focus-visible:outline-none">
                <ActivityTab logs={data.activityLogs || []} />
            </TabsContent>
            <TabsContent value="billing" className="m-0 h-full focus-visible:outline-none">
                <BillingTab
                    subscription={data.subscription}
                    billingCycles={data.billingCycles}
                />
            </TabsContent>
            <TabsContent value="finance" className="m-0 h-full focus-visible:outline-none">
                <FinanceTab
                    organizationId={organizationId}
                    preferences={data.preferences}
                    orgCurrencies={data.contactCurrencies}
                    orgWallets={data.contactWallets}
                    availableCurrencies={data.availableCurrencies}
                    availableWallets={data.availableWallets}
                    subscription={data.subscription}
                />
            </TabsContent>
        </>
    );
}
