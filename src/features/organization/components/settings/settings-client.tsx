"use client";

import { OrganizationSettingsData } from "@/types/organization";
import { TabsContent } from "@/components/ui/tabs";
import { MembersSettingsView } from "@/features/organization/views/organization-members-settings-view";
import { PermissionsSettingsView } from "@/features/organization/views/organization-permissions-settings-view";
import { BillingSettingsView } from "@/features/organization/views/organization-billing-settings-view";

interface SettingsClientProps {
    data: OrganizationSettingsData;
    organizationId: string;
}

export function SettingsClient({ data, organizationId }: SettingsClientProps) {
    // Get planId from subscription or fallback
    const planId = data.subscription?.plan_id ?? "";

    return (
        <>
            <TabsContent value="members" className="m-0 h-full focus-visible:outline-none">
                <MembersSettingsView
                    organizationId={organizationId}
                    planId={planId}
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
            <TabsContent value="billing" className="m-0 h-full focus-visible:outline-none">
                <BillingSettingsView
                    subscription={data.subscription}
                    billingCycles={data.billingCycles}
                />
            </TabsContent>
        </>
    );
}
