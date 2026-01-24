"use client";

import { OrganizationSettingsData } from "@/types/organization";
import { TabsContent } from "@/components/ui/tabs";
import {
    MembersSettingsView,
    PermissionsSettingsView,
    ActivitySettingsView,
    BillingSettingsView,
    FinanceSettingsView
} from "@/features/organization/views";

interface SettingsClientProps {
    data: OrganizationSettingsData;
    organizationId: string;
}

export function SettingsClient({ data, organizationId }: SettingsClientProps) {
    return (
        <>
            <TabsContent value="members" className="m-0 h-full focus-visible:outline-none">
                <MembersSettingsView
                    members={data.members}
                    invitations={data.invitations}
                    roles={data.roles}
                />
            </TabsContent>
            <TabsContent value="permissions" className="m-0 h-full focus-visible:outline-none">
                <PermissionsSettingsView
                    organizationId={organizationId}
                    roles={data.roles}
                    permissions={data.permissions}
                    rolePermissions={data.rolePermissions}
                />
            </TabsContent>
            <TabsContent value="activity" className="m-0 h-full focus-visible:outline-none">
                <ActivitySettingsView logs={data.activityLogs || []} />
            </TabsContent>
            <TabsContent value="billing" className="m-0 h-full focus-visible:outline-none">
                <BillingSettingsView
                    subscription={data.subscription}
                    billingCycles={data.billingCycles}
                />
            </TabsContent>
            <TabsContent value="finance" className="m-0 h-full focus-visible:outline-none">
                <FinanceSettingsView
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

