"use client";

import { OrganizationSettingsData } from "@/types/organization";
import { TabsContent } from "@/components/ui/tabs";
import { TeamMembersView } from "@/features/team/views/team-members-view";
import { TeamPermissionsView } from "@/features/team/views/team-permissions-view";
import { BillingSettingsView } from "@/features/billing/views/billing-settings-view";

interface SettingsClientProps {
    data: OrganizationSettingsData;
    organizationId: string;
    currentUserId: string;
    ownerId: string | null;
}

export function SettingsClient({ data, organizationId, currentUserId, ownerId }: SettingsClientProps) {
    // Get planId from subscription or fallback
    const planId = data.subscription?.plan_id ?? "";

    return (
        <>
            <TabsContent value="members" className="m-0 h-full focus-visible:outline-none">
                <TeamMembersView
                    organizationId={organizationId}
                    planId={planId}
                    members={data.members}
                    invitations={data.invitations}
                    roles={data.roles}
                    currentUserId={currentUserId}
                    ownerId={ownerId}
                />
            </TabsContent>
            <TabsContent value="permissions" className="m-0 h-full focus-visible:outline-none">
                <TeamPermissionsView
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
