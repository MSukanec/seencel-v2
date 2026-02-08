import { getActiveOrganizationId } from "@/features/general-costs/actions";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getOrganizationSeatStatus } from "@/features/team/actions";
import { getOrganizationPlanFeatures, getPlans } from "@/actions/plans";
import { getPlanPurchaseFlags } from "@/actions/feature-flags";
import { checkIsAdmin } from "@/features/users/queries";
import { SettingsClient } from "@/features/organization/components/settings/settings-client";
import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/layout";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Reusable tab trigger style
const tabTriggerClass = "relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground";

interface PageProps {
    searchParams: Promise<{ tab?: string }>;
}

export default async function OrganizationSettingsPage({ searchParams }: PageProps) {
    const orgId = await getActiveOrganizationId();
    const params = await searchParams;
    const validTabs = ["members", "permissions", "billing"] as const;
    const requestedTab = params.tab || "members";
    const initialTab = validTabs.includes(requestedTab as any) ? requestedTab : "members";

    if (!orgId) {
        redirect('/');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Resolve public user ID from auth_id (organizations & members use users.id, not auth_id)
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) {
        redirect('/');
    }

    const [data, planFeatures, seatStatusResult, plans, purchaseFlags, isAdmin] = await Promise.all([
        getOrganizationSettingsData(orgId),
        getOrganizationPlanFeatures(orgId),
        getOrganizationSeatStatus(orgId),
        getPlans(),
        getPlanPurchaseFlags(),
        checkIsAdmin(),
    ]);

    const seatStatus = seatStatusResult.success ? seatStatusResult.data ?? null : null;

    // Fetch owner_id for the organization
    const { data: orgData } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', orgId)
        .single();

    const ownerId = orgData?.owner_id || null;
    const canInviteMembers = planFeatures?.can_invite_members ?? false;

    return (
        <Tabs defaultValue={initialTab} className="h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Configuración"
                icon={<Settings />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-4 flex items-start justify-start">
                        <TabsTrigger value="members" className={tabTriggerClass}>
                            Miembros
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className={tabTriggerClass}>
                            Permisos
                        </TabsTrigger>
                        <TabsTrigger value="billing" className={tabTriggerClass}>
                            Facturación
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <SettingsClient data={data} organizationId={orgId} currentUserId={publicUser.id} ownerId={ownerId} canInviteMembers={canInviteMembers} seatStatus={seatStatus} plans={plans} purchaseFlags={purchaseFlags} isAdmin={isAdmin} />
            </PageWrapper>
        </Tabs>
    );
}
