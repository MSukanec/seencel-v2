import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { getOrganizationSettingsData } from "@/actions/organization-settings";
import { getOrganizationSeatStatus, getExternalActorsForOrg } from "@/features/team/actions";
import { getOrganizationPlanFeatures } from "@/actions/plans";
import { ErrorDisplay } from "@/components/ui/error-display";
import { TeamMembersView } from "@/features/team/views/team-members-view";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Miembros | Seencel",
        description: "Gestión de miembros de la organización",
        robots: "noindex, nofollow",
    };
}

export default async function MembersPage() {
    try {
        const { orgId, userId } = await requireAuthContext();

        const [data, planFeatures, seatStatusResult, externalActorsResult] = await Promise.all([
            getOrganizationSettingsData(orgId),
            getOrganizationPlanFeatures(orgId),
            getOrganizationSeatStatus(orgId),
            getExternalActorsForOrg(orgId),
        ]);

        const seatStatus = seatStatusResult.success ? seatStatusResult.data ?? null : null;
        const externalActors = externalActorsResult.success ? externalActorsResult.data ?? [] : [];

        const supabase = await createClient();
        const { data: orgData } = await supabase
            .schema('iam').from('organizations')
            .select('owner_id')
            .eq('id', orgId)
            .single();

        const ownerId = orgData?.owner_id || null;
        const canInviteMembers = planFeatures?.can_invite_members ?? false;
        const maxExternalAdvisors = planFeatures?.max_external_advisors ?? 0;
        const planId = data.subscription?.plan_id ?? "";

        return (
            <TeamMembersView
                organizationId={orgId}
                planId={planId}
                members={data.members}
                invitations={data.invitations}
                roles={data.roles}
                currentUserId={userId}
                ownerId={ownerId}
                canInviteMembers={canInviteMembers}
                initialSeatStatus={seatStatus}
                externalActors={externalActors}
                maxExternalAdvisors={maxExternalAdvisors}
            />
        );
    } catch (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <ErrorDisplay
                    title="Error al cargar miembros"
                    message={error instanceof Error ? error.message : "Error desconocido"}
                    retryLabel="Reintentar"
                />
            </div>
        );
    }
}
